export type WheelInputMode = 'unknown' | 'smooth' | 'discrete'
export type WheelSmoothingReason = 'pending' | 'fine' | 'units' | 'cadence' | 'isolated' | 'gesture'
export type WheelSmoothingSample = { mode: WheelInputMode, reason: WheelSmoothingReason }

type Gesture = { sample: WheelSmoothingSample, smallestDelta: number, time: number }

const GESTURE_PAUSE = 400
const SAMPLE_WINDOW = 40
const DENSE_INTERVAL = 20
const FINE_DELTA = 3
const DENSE_DELTA = 32

// Chooses zoom smoothing only. Pending samples are shared with queued events.
export class WheelSmoothing {
  private gesture: Gesture | null = null
  private timeout: ReturnType<typeof setTimeout> | null = null

  constructor(private readonly onChange: () => void) { }

  reset(): void {
    this.finishSample()
    this.gesture = null
  }

  accept(time: number, magnitude: number, deltaMode: number): WheelSmoothingSample {
    const gap = this.gesture ? time - this.gesture.time : null
    const interval = gap !== null && gap >= 0 ? gap : null

    if (interval === null || interval > GESTURE_PAUSE) {
      this.finishSample()

      const sample: WheelSmoothingSample = { mode: 'unknown', reason: 'pending' }
      this.gesture = { sample, smallestDelta: magnitude, time }

      this.timeout = setTimeout(() => {
        this.finishSample()
        sample.reason = 'isolated'
        this.onChange()
      }, SAMPLE_WINDOW)
    }

    const gesture = this.gesture!
    const ratio = Math.max(gesture.smallestDelta, magnitude) / Math.min(gesture.smallestDelta, magnitude)
    const repeatedStep = Math.abs(ratio - Math.round(ratio)) < 0.01
    gesture.sample.reason = gesture.sample.mode === 'unknown' ? 'pending' : 'gesture'

    if (deltaMode !== 0 || magnitude <= FINE_DELTA) {
      const mode = deltaMode === 0 ? 'smooth' : 'discrete'

      if (gesture.sample.mode !== 'unknown' && gesture.sample.mode !== mode) {
        gesture.sample = { mode, reason: 'pending' }
      } else gesture.sample.mode = mode

      gesture.sample.reason = deltaMode === 0 ? 'fine' : 'units'
    } else if (gesture.sample.mode === 'unknown' && interval !== null && interval <= DENSE_INTERVAL &&
      !repeatedStep && Math.max(gesture.smallestDelta, magnitude) <= DENSE_DELTA) {
      gesture.sample.mode = 'smooth'
      gesture.sample.reason = 'cadence'
    }

    gesture.smallestDelta = Math.min(gesture.smallestDelta, magnitude)
    gesture.time = time

    if (gesture.sample.mode !== 'unknown') this.finishSample()
    return gesture.sample
  }

  private finishSample(): void {
    if (this.timeout !== null) clearTimeout(this.timeout)
    this.timeout = null
    if (this.gesture?.sample.mode === 'unknown') this.gesture.sample.mode = 'discrete'
  }
}
