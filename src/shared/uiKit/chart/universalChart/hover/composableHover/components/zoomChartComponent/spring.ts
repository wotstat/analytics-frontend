const SPRING_OMEGA = 14
const SPRING_EPSILON_PX = 0.1
const SPRING_VELOCITY_EPSILON_PX = 1

// Critically damped spring in closed form (frame-rate independent, cannot oscillate):
//   x(t) = target + (p0 + b * t) * e^(-omega * t),  b = v0 + omega * p0
// Animates one displayed-space channel value (center or ln(range)) of one axis.
export class ScalarSpring {

  private readonly initialOffset: number
  private readonly b: number

  constructor(from: number, readonly target: number, initialVelocity: number) {
    this.initialOffset = from - target
    this.b = initialVelocity + SPRING_OMEGA * this.initialOffset
  }

  valueAt(elapsed: number): number {
    return this.target + (this.initialOffset + this.b * elapsed) * Math.exp(-SPRING_OMEGA * elapsed)
  }

  velocityAt(elapsed: number): number {
    return (this.b - SPRING_OMEGA * (this.initialOffset + this.b * elapsed)) * Math.exp(-SPRING_OMEGA * elapsed)
  }

  // Value at `elapsed`, settling: once the remaining offset and velocity are both below
  // the pixel thresholds the value snaps to the target and the spring reports settled
  sample(elapsed: number, pxPerUnit: number): { value: number, settled: boolean } {
    const value = this.valueAt(elapsed)
    const settled = Math.abs(value - this.target) * pxPerUnit < SPRING_EPSILON_PX &&
      Math.abs(this.velocityAt(elapsed)) * pxPerUnit < SPRING_VELOCITY_EPSILON_PX

    return { value: settled ? this.target : value, settled }
  }
}
