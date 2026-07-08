// Natural frequency of the auto-fit follower. Higher = snappier catch-up.
export const DEFAULT_FOLLOW_OMEGA = 30
const SETTLE_EPSILON_PX = 0.1
const SETTLE_VELOCITY_EPSILON_PX = 1

// Critically damped follower toward a target that may move every frame. ScalarSpring is a
// closed form over absolute elapsed time against a fixed target; this instead integrates
// one exact critically-damped step per frame, so the target is re-read each step. Used to
// ease an auto-fitted axis to its shifting data extent as the orthogonal axis is panned or
// zoomed, instead of snapping to it on every layout.
export class CriticalFollower {

  constructor(public value: number, public velocity: number = 0, private readonly omega: number = DEFAULT_FOLLOW_OMEGA) { }

  // Advances value/velocity toward target over dt seconds. Exact solution of the critically
  // damped spring x'' + 2ω x' + ω² x = 0 (frame-rate independent, cannot overshoot), holding
  // the target constant across the step.
  step(target: number, dt: number): void {
    if (!(dt > 0)) return

    const offset = this.value - target
    const b = this.velocity + this.omega * offset
    const decay = Math.exp(-this.omega * dt)

    this.value = target + (offset + b * dt) * decay
    this.velocity = (b - this.omega * (offset + b * dt)) * decay
  }

  // Within a pixel of the target and nearly stopped: the animation may end and the axis be
  // handed back to synchronous auto-fit. pxPerUnit maps chart units to on-screen pixels.
  settled(target: number, pxPerUnit: number): boolean {
    return Math.abs(this.value - target) * pxPerUnit < SETTLE_EPSILON_PX &&
      Math.abs(this.velocity) * pxPerUnit < SETTLE_VELOCITY_EPSILON_PX
  }
}
