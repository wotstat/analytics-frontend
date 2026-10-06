import { wheelInput, WheelInputDecision } from '../../../../../wheelInput'
import { Point } from '../../../../utils/Point'
import { CriticalFollower } from '../../../../utils/follower'
import { clamp, LayoutValue } from './common'

type Focus = { point: Point, layout: LayoutValue }
export type WheelZoomStep = Focus & { logDelta: number }
type Pending = WheelZoomStep & { decision: Readonly<WheelInputDecision> }

// Converts wheel input into frame deltas. The chart owns geometry and limits;
export class WheelZoom {
  lastEventTime = 0
  private pending: Pending[] = []
  private follow: CriticalFollower | null = null
  private target = 0
  private focus: Focus | null = null
  private lastFrame = 0

  push(deltaY: number, deltaMode: number, point: Point, layout: LayoutValue, now: number): boolean {
    const pixels = deltaY * (deltaMode === 1 ? 16 : deltaMode === 2 ? layout.height : 1)
    const logDelta = clamp(pixels * 0.001, -0.5, 0.5)
    if (!Number.isFinite(pixels) || logDelta === 0) return false
    this.pending.push({
      logDelta,
      point: { ...point }, layout: { ...layout }, decision: wheelInput.currentDecision
    })
    this.lastEventTime = now
    return true
  }

  cancelAnimation(): void {
    this.follow = null
    this.target = 0
  }

  // Call from layout. apply() updates bounds synchronously, so constrain() sees
  // the latest viewport even when direct and animated events share one frame.
  flush(now: number, apply: (step: WheelZoomStep) => void, constrain: (step: WheelZoomStep) => number): boolean {
    if (this.pending.some(step => step.decision.interrupt)) this.cancelAnimation()
    this.advance(now, apply)

    let consumed = 0
    for (const step of this.pending) {
      if (step.decision.mode === 'unknown') break
      consumed++
      if (step.logDelta === 0) continue
      const remaining = this.follow ? this.target - this.follow.value : 0
      if (step.decision.mode === 'smooth') {
        this.cancelAnimation()
        apply({ ...step, logDelta: step.logDelta + (step.decision.interrupt ? 0 : remaining) })
      } else {
        const distance = constrain({ ...step, logDelta: remaining + step.logDelta })
        if (distance === 0) this.cancelAnimation()
        else {
          this.follow ??= new CriticalFollower(0)
          this.target = this.follow.value + distance
          // Reversal responds immediately without carrying velocity away from the target.
          if (this.follow.velocity * distance < 0) this.follow.velocity = 0
          this.focus = step
        }
      }
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
