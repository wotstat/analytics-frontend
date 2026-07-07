// Apple-style deceleration:
//   v(t) = v0 * d ** (1000 * t)
//   x(t) = x0 + v0 * (d ** (1000 * t) - 1) / (1000 * Math.log(d))
// Velocities are stored per axis as center (translation) + logRange (scale) channels,
// so zoom inertia continues in terms of zoom velocity, not raw bounds velocity.

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
