import { wheelInput, WheelInputDecision, WheelInputDetection, WHEEL_GESTURE_PAUSE } from '../../../wheelInput/wheelInput'
import { Point } from '../../../../utils/Point'
import { BoundsAxes } from '../../../../utils/Bounds'
import { CriticalFollower } from '../../../../utils/follower'
import { clamp, LayoutValue } from './common'

type Focus = { point: Point, layout: LayoutValue }
export type WheelZoomStep = Focus & { logDelta: number }
export type WheelPanStep = { deltaX: number, deltaY: number, layout: LayoutValue }
export type WheelPanGesture = { lastEventTime: number, captured: boolean | null, momentum: boolean }
type Pending = WheelZoomStep & WheelPanStep & {
  decision: Readonly<WheelInputDecision>
  zoom: boolean
  pan: boolean
}

// Converts wheel input into zoom or pan frame deltas. The chart owns geometry and limits.
export class WheelNavigation {
  lastEventTime = 0
  private pending: Pending[] = []
  private follow: CriticalFollower | null = null
  private target = 0
  private focus: Focus | null = null
  private lastFrame = 0

  push(deltaY: number, deltaX: number, deltaMode: number, point: Point, layout: LayoutValue, now: number,
    enabled: { zoom: boolean, pan: BoundsAxes, input?: WheelInputDetection }, gesture: WheelPanGesture): boolean {
    let pixelsX = deltaX
    let pixelsY = deltaY
    if (deltaMode === 1) {
      pixelsX *= 16
      pixelsY *= 16
    } else if (deltaMode === 2) {
      pixelsX *= layout.width
      pixelsY *= layout.height
    }
    if (!Number.isFinite(pixelsX) || !Number.isFinite(pixelsY) || (pixelsX === 0 && pixelsY === 0)) return false

    const decision = wheelInput.getDecision(enabled.input)
    // Browsers encode a trackpad pinch as -100 * log(scale) pixel units.
    const sensitivity = decision.pinch && deltaMode === 0 ? 0.01 : 0.001
    const logDelta = clamp(pixelsY * sensitivity, -0.5, 0.5)
    const panDirectionEnabled = !!((enabled.pan.x && Math.abs(pixelsX) >= Math.abs(pixelsY)) ||
      (enabled.pan.y && Math.abs(pixelsY) >= Math.abs(pixelsX)))

    // Keep the initial owner through direction changes and momentum. This state
    // outlives render batches, including gestures passed entirely to the page.
    const interruptPan = decision.pinch || decision.device === 'wheel'
    const momentum = decision.interrupt && !decision.pinch
    const physicalGestureStarted = gesture.momentum && !momentum
    const inputStopped = !momentum && now - gesture.lastEventTime > WHEEL_GESTURE_PAUSE
    if (interruptPan || physicalGestureStarted || inputStopped) gesture.captured = null
    gesture.lastEventTime = now
    gesture.momentum = momentum
    if (!interruptPan && gesture.captured === null) gesture.captured = panDirectionEnabled

    if (!decision.pinch && decision.device === 'trackpad' && !gesture.captured) return false

    const zoom = enabled.zoom && logDelta !== 0 && (decision.pinch || decision.device !== 'trackpad')
    const horizontalWheelPan = decision.device === 'wheel' && enabled.pan.x && pixelsX !== 0
    const pan = !decision.pinch && (horizontalWheelPan || (gesture.captured === true && decision.device === 'trackpad'))
    if (!zoom && !pan) return false

    this.pending.push({
      logDelta, deltaX: pixelsX, deltaY: decision.device === 'wheel' ? 0 : pixelsY, zoom, pan,
      point: { ...point }, layout: { ...layout }, decision,
    })
    this.lastEventTime = now
    return true
  }

  pushPinch(logDelta: number, point: Point, layout: LayoutValue, now: number): void {
    this.pending.push({
      logDelta: clamp(logDelta, -0.5, 0.5), deltaX: 0, deltaY: 0, zoom: true, pan: false,
      point: { ...point }, layout: { ...layout },
      decision: { mode: 'smooth', device: 'trackpad', pinch: true, interrupt: true },
    })
    this.lastEventTime = now
  }

  cancelAnimation(): void {
    this.follow = null
    this.target = 0
  }

  // Call from layout. apply() updates bounds synchronously, so constrain() sees
  // the latest viewport even when direct and animated events share one frame.
  flush(now: number, apply: (step: WheelZoomStep) => void, constrain: (step: WheelZoomStep) => number,
    applyPan: (step: WheelPanStep) => void): boolean {
    if (this.pending.some(step => step.decision.interrupt || step.pan)) this.cancelAnimation()
    this.advance(now, apply)

    let consumed = 0
    for (const step of this.pending) {
      if (step.zoom && step.decision.mode === 'unknown') break
      consumed++
      if (step.pan) {
        this.cancelAnimation()
        applyPan(step)
      }
      if (!step.zoom) continue

      const remaining = this.follow ? this.target - this.follow.value : 0
      if (step.decision.mode === 'smooth') {
        this.cancelAnimation()
        apply({ ...step, logDelta: step.logDelta + (step.decision.interrupt ? 0 : remaining) })
        continue
      }

      const distance = constrain({ ...step, logDelta: remaining + step.logDelta })
      if (distance === 0) {
        this.cancelAnimation()
        continue
      }

      this.follow ??= new CriticalFollower(0)
      this.target = this.follow.value + distance
      // Reversal responds immediately without carrying velocity away from the target.
      if (this.follow.velocity * distance < 0) this.follow.velocity = 0
      this.focus = step
    }
    this.pending.splice(0, consumed)
    this.lastFrame = now
    return this.pending.length > 0 || this.follow !== null
  }

  private advance(now: number, apply: (step: WheelZoomStep) => void): void {
    const follow = this.follow
    const focus = this.focus
    if (!follow || !focus) return

    const before = follow.value
    follow.step(this.target, Math.max(0, now - this.lastFrame) / 1000)
    const settled = follow.settled(this.target, Math.max(focus.layout.width, focus.layout.height))
    const overshot = (this.target - before) * (this.target - follow.value) <= 0
    if (settled || overshot) follow.value = this.target

    apply({ ...focus, logDelta: follow.value - before })
    if (settled || overshot) this.cancelAnimation()
  }
}
