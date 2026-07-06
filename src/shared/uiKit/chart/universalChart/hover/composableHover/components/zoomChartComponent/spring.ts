import { AxisBounds, SPRING_EPSILON_PX, SPRING_OMEGA, SPRING_VELOCITY_EPSILON_PX, axisCenter, axisRange } from './common'

// Critically damped spring in closed form (frame-rate independent, cannot oscillate):
//   x(t) = target + (p0 + b * t) * e^(-omega * t),  b = v0 + omega * p0
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

// Per-axis spring animating the same center + logRange channels the inertia uses
export type AxisSpring = {
  center: ScalarSpring
  logRange: ScalarSpring
  startTime: number
}

export function createAxisSpring(from: AxisBounds, target: AxisBounds, vCenter: number, vLogRange: number, startTime: number): AxisSpring {
  return {
    center: new ScalarSpring(axisCenter(from), axisCenter(target), vCenter),
    logRange: new ScalarSpring(Math.log(axisRange(from)), Math.log(axisRange(target)), vLogRange),
    startTime,
  }
}

export function axisSpringBoundsAt(spring: AxisSpring, elapsed: number): AxisBounds {
  const center = spring.center.valueAt(elapsed)
  const range = Math.exp(spring.logRange.valueAt(elapsed))

  return { min: center - range / 2, max: center + range / 2 }
}

export function axisSpringTargetBounds(spring: AxisSpring): AxisBounds {
  const range = Math.exp(spring.logRange.target)

  return { min: spring.center.target - range / 2, max: spring.center.target + range / 2 }
}

export function isAxisSpringSettled(spring: AxisSpring, elapsed: number, layoutSize: number): boolean {
  const range = Math.exp(spring.logRange.valueAt(elapsed))
  if (!Number.isFinite(range) || range === 0) return true

  const pxPerUnit = layoutSize / range
  const centerErrorPx = Math.abs(spring.center.valueAt(elapsed) - spring.center.target) * pxPerUnit
  const rangeErrorPx = Math.abs(spring.logRange.valueAt(elapsed) - spring.logRange.target) * layoutSize
  const centerVelocityPx = Math.abs(spring.center.velocityAt(elapsed)) * pxPerUnit
  const rangeVelocityPx = Math.abs(spring.logRange.velocityAt(elapsed)) * layoutSize

  return centerErrorPx < SPRING_EPSILON_PX && rangeErrorPx < SPRING_EPSILON_PX &&
    centerVelocityPx < SPRING_VELOCITY_EPSILON_PX && rangeVelocityPx < SPRING_VELOCITY_EPSILON_PX
}
