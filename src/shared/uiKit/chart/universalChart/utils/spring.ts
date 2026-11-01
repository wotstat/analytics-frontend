export type Spring = Readonly<{ response: number, dampingRatio: number }>

const DEFAULT_RESPONSE = 2 * Math.PI / 30
const SETTLE_EPSILON_PX = 0.1
const SETTLE_VELOCITY_EPSILON_PX = 1

export function spring(options: Partial<Spring> = {}): Spring {
  const response = options.response ?? DEFAULT_RESPONSE
  const dampingRatio = options.dampingRatio ?? 1
  const omega = 2 * Math.PI / response

  if (!Number.isFinite(response) || response <= 0 || !Number.isFinite(omega * omega)) {
    throw new RangeError('spring response must be positive and finite')
  }
  if (!Number.isFinite(dampingRatio) || dampingRatio < 0 || !Number.isFinite(2 * dampingRatio * omega)) {
    throw new RangeError('spring dampingRatio must be non-negative and finite')
  }

  return Object.freeze({ response, dampingRatio })
}

export const DEFAULT_SPRING = spring()

export class SpringFollower {
  private readonly omega: number
  private readonly dampingRatio: number

  constructor(public value: number, public velocity: number = 0, motion: Spring = DEFAULT_SPRING) {
    const config = spring(motion)
    this.omega = 2 * Math.PI / config.response
    this.dampingRatio = config.dampingRatio
  }

  // Exact solution for a target held over dt. Retargeting keeps the existing position and velocity.
  step(target: number, dt: number): void {
    if (!(dt > 0) || !Number.isFinite(dt)) return

    const offset = this.value - target
    const omega = this.omega
    const ratio = this.dampingRatio
    if (ratio === 1) {
      const b = this.velocity + omega * offset
      const decay = Math.exp(-omega * dt)
      this.value = target + (offset + b * dt) * decay
      this.velocity = (b - omega * (offset + b * dt)) * decay
      return
    }

    const attenuation = ratio * omega
    let c: number
    let s: number
    if (ratio < 1) {
      const frequency = omega * Math.sqrt((1 - ratio) * (1 + ratio))
      const decay = Math.exp(-attenuation * dt)
      c = decay * Math.cos(frequency * dt)
      s = decay * Math.sin(frequency * dt) / frequency
    } else {
      const root = Math.sqrt(ratio - 1) * Math.sqrt(ratio + 1)
      const frequency = omega * root
      const slow = Math.exp(-omega / ratio / (1 + root / ratio) * dt)
      const fast = Math.exp(-(attenuation + frequency) * dt)
      c = (slow + fast) / 2
      s = slow * -Math.expm1(-2 * frequency * dt) / (2 * frequency)
    }

    this.value = target + offset * c + (this.velocity + attenuation * offset) * s
    this.velocity = this.velocity * c - (attenuation * this.velocity + omega * omega * offset) * s
  }

  settled(target: number, pxPerUnit: number): boolean {
    const scale = Math.abs(pxPerUnit)
    return Math.abs(this.value - target) * scale < SETTLE_EPSILON_PX &&
      Math.abs(this.velocity) * scale < SETTLE_VELOCITY_EPSILON_PX
  }
}
