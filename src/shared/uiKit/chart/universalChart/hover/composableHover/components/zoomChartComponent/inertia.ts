import { AxisBounds, axisRange } from './common'

// Apple-style deceleration:
//   v(t) = v0 * d ** (1000 * t)
//   x(t) = x0 + v0 * (d ** (1000 * t) - 1) / (1000 * Math.log(d))
// Velocities are stored per axis as center (translation) + logRange (scale) channels,
// so zoom inertia continues in terms of zoom velocity, not raw bounds velocity.

export type AxisInertia = {
  vCenter: number
  vLogRange: number
  deceleration: number
  startTime: number
  lastElapsed: number
}

// Accumulated displacement per unit of initial velocity after `elapsed` seconds
export function decayOffset(deceleration: number, elapsed: number): number {
  return (Math.pow(deceleration, 1000 * elapsed) - 1) / (1000 * Math.log(deceleration))
}

// Displacement per unit of initial velocity still remaining after `elapsed` seconds
export function remainingDecayOffset(deceleration: number, elapsed: number): number {
  return -Math.pow(deceleration, 1000 * elapsed) / (1000 * Math.log(deceleration))
}

// Total displacement the decay would ever cover from initial velocity `v0`
export function totalDecayTravel(v0: number, deceleration: number): number {
  return -v0 / (1000 * Math.log(deceleration))
}

export function decayVelocityAt(v0: number, deceleration: number, elapsed: number): number {
  return v0 * Math.pow(deceleration, 1000 * elapsed)
}

// Screen-space distance the inertia can still travel, used for the stop condition
export function inertiaRemainingPixels(inertia: AxisInertia, bounds: AxisBounds, layoutSize: number, elapsed: number): number {
  const range = axisRange(bounds)
  if (!Number.isFinite(range) || range === 0 || !(layoutSize > 0)) return 0

  const remaining = remainingDecayOffset(inertia.deceleration, elapsed)
  const scale = layoutSize / Math.abs(range)
  const centerPixels = Math.abs(inertia.vCenter * remaining) * scale
  const rangePixels = Math.abs(range * (Math.exp(inertia.vLogRange * remaining) - 1)) / 2 * scale

  return centerPixels + rangePixels
}
