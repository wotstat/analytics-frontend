import { EventEmitter } from '../../utils/EventEmitter'
import { WheelSmoothing, WheelInputMode, WheelSmoothingReason, WheelSmoothingSample } from './WheelSmoothing'
import { isTrackpadGesture } from '../utils/nativeGesture'

export type { WheelInputMode } from './WheelSmoothing'
export type WheelInputDevice = 'wheel' | 'trackpad'
export type WheelInputDetection = 'auto' | WheelInputDevice
export type WheelInputDecision = { mode: WheelInputMode, device: WheelInputDevice, pinch: boolean, interrupt: boolean }

export const WHEEL_GESTURE_PAUSE = 80
export const WHEEL_RETURN_GESTURES = 3

type DetectionReason = 'diagonal' | 'wheel-return'
type DeviceGesture = { axis: 'x' | 'y' | null, time: number, momentum: boolean }
type Reason = WheelSmoothingReason | 'pinch' | 'momentum' | 'native-pinch' | DetectionReason
type Snapshot = {
  mode: WheelInputMode
  device: WheelInputDevice
  eventMode: WheelInputMode
  action: 'pending' | 'zoom' | 'pan' | 'zoom-pan'
  reason: Reason
  deltaX: number
  deltaY: number
  deltaMode: number
  interval: number | null
  singleAxisGestures: number
}

class WheelInput {
  readonly onChange = new EventEmitter<Snapshot>()
  private readonly smoothing = new WheelSmoothing(() => {
    if (this.state.device !== 'wheel') return
    const reason = this.state.reason === 'wheel-return' ? 'wheel-return' : this.sample.reason
    this.publish(reason)
  })
  private sample: WheelSmoothingSample = { mode: 'unknown', reason: 'pending' }
  private pinch = false
  private interrupt = false
  private lastEventTime: number | null = null
  private nativeGestureScale: number | null = null
  private deviceGesture: DeviceGesture | null = null
  private singleAxisGestures = 0
  private state: Snapshot = this.emptySnapshot()

  get snapshot(): Readonly<Snapshot> { return this.state }

  getDecision(detection: WheelInputDetection = 'auto'): Readonly<WheelInputDecision> {
    const sample = this.sample
    const device = detection === 'auto' ? this.state.device : detection
    return {
      // Resolve pending wheel smoothing without changing this event's device or action.
      get mode() { return device === 'trackpad' ? 'smooth' : sample.mode },
      device, pinch: this.pinch, interrupt: this.interrupt,
    }
  }

  reset(): void {
    this.smoothing.reset()
    this.sample = { mode: 'unknown', reason: 'pending' }
    this.pinch = false
    this.interrupt = false
    this.lastEventTime = null
    this.nativeGestureScale = null
    this.deviceGesture = null
    this.singleAxisGestures = 0
    this.state = this.emptySnapshot()
    this.onChange.emit(this.state)
  }

  readonly observe = (event: WheelEvent): void => {
    const deltaMode = event.deltaMode // Read units before browser-dependent delta conversion.
    const { deltaX, deltaY, timeStamp: time } = event
    if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY) || (deltaX === 0 && deltaY === 0)) return

    const gap = this.lastEventTime === null ? null : time - this.lastEventTime
    const interval = gap !== null && gap >= 0 ? gap : null
    const detection = this.detectWheelDevice(event)
    this.lastEventTime = time
    this.state = {
      ...this.state, device: detection.device, deltaX, deltaY, deltaMode, interval,
    }

    this.pinch = event.ctrlKey
    this.interrupt = event.ctrlKey || ('momentum' in event && event.momentum === true)
    if (this.interrupt) {
      this.smoothing.reset()
      this.sample = { mode: 'smooth', reason: 'pending' }
      this.publish(detection.reason ?? (event.ctrlKey ? 'pinch' : 'momentum'))
      return
    }

    this.sample = this.smoothing.accept(time, Math.max(Math.abs(deltaX), Math.abs(deltaY)), deltaMode)
    this.publish(detection.reason ?? this.sample.reason)
  }

  private detectWheelDevice(event: WheelEvent): { device: WheelInputDevice, reason: DetectionReason | null } {
    const device = this.state.device
    if (!event.isTrusted) return { device, reason: null }

    const { deltaX, deltaY, timeStamp: time } = event
    const momentum = 'momentum' in event && event.momentum === true
    const diagonal = !event.ctrlKey && deltaX !== 0 && deltaY !== 0
    if (diagonal || event.ctrlKey) {
      this.singleAxisGestures = 0
      this.deviceGesture = { axis: null, time, momentum }
      return { device: diagonal ? 'trackpad' : device, reason: diagonal ? 'diagonal' : null }
    }

    const previous = this.deviceGesture
    const inputStopped = !previous || time < previous.time || time - previous.time > WHEEL_GESTURE_PAUSE
    const newGesture = !momentum && (inputStopped || previous?.momentum === true)
    const axis = deltaX !== 0 ? 'x' : 'y'
    if (newGesture) {
      this.deviceGesture = { axis, time, momentum }
      if (device !== 'trackpad' || !previous) return { device, reason: null }

      this.singleAxisGestures = previous.axis === null ? 0 : this.singleAxisGestures + 1
      if (this.singleAxisGestures < WHEEL_RETURN_GESTURES) return { device, reason: null }

      this.smoothing.reset()
      return { device: 'wheel', reason: 'wheel-return' }
    }

    if (!previous) {
      // Momentum without an observed physical gesture is not mouse evidence.
      this.deviceGesture = { axis: null, time, momentum }
      return { device, reason: null }
    }

    if (previous.axis !== axis) {
      previous.axis = null
      this.singleAxisGestures = 0
    }
    previous.time = time
    previous.momentum = momentum
    return { device, reason: null }
  }

  readonly observeNativeGesture = (event: Event): void => {
    if (!event.isTrusted || !isTrackpadGesture(event)) return
    if (event.type === 'gesturestart') {
      this.nativeGestureScale = event.scale
      return
    }

    const previous = this.nativeGestureScale
    if (event.type === 'gestureend') this.nativeGestureScale = null
    else if (previous !== null) this.nativeGestureScale = event.scale
    if (previous === null || event.scale === previous) return

    this.deviceGesture = null
    this.singleAxisGestures = 0
    this.state = {
      ...this.state, device: 'trackpad', deltaX: 0, deltaY: -100 * (Math.log(event.scale) - Math.log(previous)),
      deltaMode: 0, interval: null,
    }
    this.smoothing.reset()
    this.sample = { mode: 'smooth', reason: 'pending' }
    this.pinch = true
    this.interrupt = true
    this.publish('native-pinch')
  }

  private publish(reason: Reason): void {
    const { mode: eventMode, device: eventDevice, pinch, interrupt } = this.getDecision()
    const mode = interrupt || eventMode === 'unknown' ? this.state.mode : eventMode
    const device = interrupt ? this.state.device : eventDevice
    const zoom = pinch || (eventDevice === 'wheel' && this.state.deltaY !== 0)
    const pan = !pinch && (eventDevice === 'trackpad' || this.state.deltaX !== 0)
    let action: Snapshot['action'] = 'pan'
    if (zoom && pan) action = 'zoom-pan'
    else if (zoom) action = 'zoom'

    this.state = { ...this.state, mode, device, eventMode, action, reason, singleAxisGestures: this.singleAxisGestures }
    this.onChange.emit(this.state)
  }

  private emptySnapshot(): Snapshot {
    return {
      mode: 'unknown', device: 'wheel', eventMode: 'unknown', action: 'pending', reason: 'pending',
      deltaX: 0, deltaY: 0, deltaMode: 0, interval: null, singleAxisGestures: 0,
    }
  }
}

// Shared passive observation includes page scrolling, even without mounted charts.
export const wheelInput = new WheelInput()
if (typeof window !== 'undefined') {
  window.addEventListener('wheel', wheelInput.observe, { capture: true, passive: true })
  const gestures = ['gesturestart', 'gesturechange', 'gestureend']
  for (const type of gestures) window.addEventListener(type, wheelInput.observeNativeGesture, { capture: true, passive: true })
  import.meta.hot?.dispose(() => {
    window.removeEventListener('wheel', wheelInput.observe, true)
    for (const type of gestures) window.removeEventListener(type, wheelInput.observeNativeGesture, true)
    wheelInput.reset()
  })
}
