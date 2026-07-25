export const DEFAULT_FOLLOW_OMEGA = 30 // Natural frequency of a follower. Higher = snappier catch-up.
const SETTLE_EPSILON_PX = 0.1
const SETTLE_VELOCITY_EPSILON_PX = 1

export class CriticalFollower {

  constructor(public value: number, public velocity: number = 0, private readonly omega: number = DEFAULT_FOLLOW_OMEGA) { }

  step(target: number, dt: number): void {
    if (!(dt > 0)) return

    const offset = this.value - target
    const b = this.velocity + this.omega * offset
    const decay = Math.exp(-this.omega * dt)

    this.value = target + (offset + b * dt) * decay
    this.velocity = (b - this.omega * (offset + b * dt)) * decay
  }

  settled(target: number, pxPerUnit: number): boolean {
    return Math.abs(this.value - target) * pxPerUnit < SETTLE_EPSILON_PX &&
      Math.abs(this.velocity) * pxPerUnit < SETTLE_VELOCITY_EPSILON_PX
  }
}
