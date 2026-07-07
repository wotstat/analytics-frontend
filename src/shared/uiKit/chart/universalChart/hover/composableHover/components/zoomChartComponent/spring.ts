import { SPRING_OMEGA } from './common'

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
}
