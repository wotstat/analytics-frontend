import { EventEmitter } from './universalChart/utils/EventEmitter'

export type WheelInputMode = 'unknown' | 'smooth' | 'discrete'
export type WheelInputDecision = { mode: WheelInputMode, interrupt: boolean }

type Reason = 'pending' | 'fine' | 'units' | 'cadence' | 'isolated' | 'gesture' | 'pinch' | 'momentum'
type Snapshot = {
  mode: WheelInputMode
  eventMode: WheelInputMode
  reason: Reason
  deltaX: number
  deltaY: number
  deltaMode: number
  interval: number | null
}

type Gesture = {
  decision: WheelInputDecision
  smallestDelta: number
  time: number
}

const GESTURE_PAUSE = 400
const SAMPLE_WINDOW = 40
const DENSE_INTERVAL = 20
const FINE_DELTA = 3
const DENSE_DELTA = 32

class WheelInput {
  readonly onChange = new EventEmitter<Snapshot>()
  private gesture: Gesture | null = null
  private timeout: ReturnType<typeof setTimeout> | null = null
  private decision: WheelInputDecision = { mode: 'unknown', interrupt: false }
  private state: Snapshot = this.emptySnapshot()

  get snapshot(): Readonly<Snapshot> { return this.state }
  // An unresolved decision is shared by the queued events of this gesture.
  get currentDecision(): Readonly<WheelInputDecision> { return this.decision }

  reset(): void {
    this.finishSample()
    this.gesture = null
    this.decision = { mode: 'unknown', interrupt: false }
    this.state = this.emptySnapshot()
    this.onChange.emit(this.state)
  }

  readonly observe = (event: WheelEvent): void => {
    const deltaMode = event.deltaMode // Read units before browser-dependent delta conversion.
    const { deltaX, deltaY, timeStamp: time } = event
    if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) return
    const magnitude = Math.max(Math.abs(deltaX), Math.abs(deltaY))
    if (magnitude === 0) return

    const gap = this.gesture ? time - this.gesture.time : null
    const interval = gap !== null && gap >= 0 ? gap : null
    const interrupt = event.ctrlKey || ('momentum' in event && event.momentum === true)
    this.state = { ...this.state, deltaX, deltaY, deltaMode, interval }

    if (interrupt) {
      this.finishSample()
      this.gesture = null
      this.decision = { mode: 'smooth', interrupt: true }
      this.publish(event.ctrlKey ? 'pinch' : 'momentum')
      return
    }

    if (interval === null || interval > GESTURE_PAUSE) {
      this.finishSample()
      this.decision = { mode: 'unknown', interrupt: false }
      this.gesture = { decision: this.decision, smallestDelta: magnitude, time }
      this.timeout = setTimeout(() => {
        this.finishSample()
        this.publish('isolated')
      }, SAMPLE_WINDOW)
    }

    const gesture = this.gesture!
    const ratio = Math.max(gesture.smallestDelta, magnitude) / Math.min(gesture.smallestDelta, magnitude)
    const repeatedStep = Math.abs(ratio - Math.round(ratio)) < 0.01
    let reason: Reason = this.decision.mode === 'unknown' ? 'pending' : 'gesture'
    if (deltaMode !== 0 || magnitude <= FINE_DELTA) {
      // Coarse units are steps; tiny pixel deltas are already fine-grained.
      const mode = deltaMode === 0 ? 'smooth' : 'discrete'
      if (gesture.decision.mode !== 'unknown' && gesture.decision.mode !== mode) {
        gesture.decision = { mode, interrupt: false }
      } else gesture.decision.mode = mode
      reason = deltaMode === 0 ? 'fine' : 'units'
    } else if (gesture.decision.mode === 'unknown' && interval !== null && interval <= DENSE_INTERVAL &&
      !repeatedStep && Math.max(gesture.smallestDelta, magnitude) <= DENSE_DELTA) {
      // Dense, small, varying deltas suggest an already smooth stream. Repeated
      // steps and their multiples remain ambiguous even at coincident timestamps.
      gesture.decision.mode = 'smooth'
      reason = 'cadence'
    }
    gesture.smallestDelta = Math.min(gesture.smallestDelta, magnitude)
    gesture.time = time
    this.decision = gesture.decision
    if (this.decision.mode !== 'unknown') this.finishSample()
    this.publish(reason)
  }

  private finishSample(): void {
    if (this.timeout !== null) clearTimeout(this.timeout)
    this.timeout = null
    if (this.gesture?.decision.mode === 'unknown') this.gesture.decision.mode = 'discrete'
  }

  private publish(reason: Reason): void {
    const eventMode = this.decision.mode
    const mode = this.decision.interrupt || eventMode === 'unknown' ? this.state.mode : eventMode
    this.state = { ...this.state, mode, eventMode, reason }
    this.onChange.emit(this.state)
  }

  private emptySnapshot(): Snapshot {
    return { mode: 'unknown', eventMode: 'unknown', reason: 'pending', deltaX: 0, deltaY: 0, deltaMode: 0, interval: null }
  }
}

// Shared passive observation includes page scrolling, even without mounted charts.
export const wheelInput = new WheelInput()
if (typeof window !== 'undefined') {
  window.addEventListener('wheel', wheelInput.observe, { capture: true, passive: true })
  import.meta.hot?.dispose(() => {
    window.removeEventListener('wheel', wheelInput.observe, true)
    wheelInput.reset()
  })
}
