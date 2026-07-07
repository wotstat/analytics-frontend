import { AxisBounds, clamp } from './common'

export type AxisLimits = {
  min: number
  max: number
  minDelta: number
  maxDelta: number
  hasAny: boolean
}

export type NormalizedLimits = {
  x: AxisLimits
  y: AxisLimits
  elastic: boolean
}

type RawLimits = {
  minX?: number
  minY?: number
  maxX?: number
  maxY?: number
  minDeltaX?: number
  minDeltaY?: number
  maxDeltaX?: number
  maxDeltaY?: number
  elastic?: boolean
}

const NO_LIMITS: AxisLimits = { min: -Infinity, max: Infinity, minDelta: 0, maxDelta: Infinity, hasAny: false }

export function normalizeLimits(raw: RawLimits | undefined): NormalizedLimits {
  if (!raw) return { x: NO_LIMITS, y: NO_LIMITS, elastic: false }

  return {
    x: normalizeAxisLimits('X', raw.minX, raw.maxX, raw.minDeltaX, raw.maxDeltaX),
    y: normalizeAxisLimits('Y', raw.minY, raw.maxY, raw.minDeltaY, raw.maxDeltaY),
    elastic: raw.elastic === true,
  }
}

function normalizeAxisLimits(
  axis: 'X' | 'Y',
  rawMin: number | undefined,
  rawMax: number | undefined,
  rawMinDelta: number | undefined,
  rawMaxDelta: number | undefined
): AxisLimits {
  let min = finiteOrWarn(rawMin, `min${axis}`)
  let max = finiteOrWarn(rawMax, `max${axis}`)
  let minDelta = positiveOrWarn(rawMinDelta, `minDelta${axis}`)
  let maxDelta = positiveOrWarn(rawMaxDelta, `maxDelta${axis}`)

  if (min !== undefined && max !== undefined && min >= max) {
    warn(`min${axis} (${min}) must be less than max${axis} (${max}), both are ignored`)
    min = undefined
    max = undefined
  }

  if (minDelta !== undefined && min !== undefined && max !== undefined && minDelta > max - min) {
    warn(`minDelta${axis} (${minDelta}) is greater than the max${axis} - min${axis} range (${max - min}), it is ignored`)
    minDelta = undefined
  }

  if (minDelta !== undefined && maxDelta !== undefined && minDelta > maxDelta) {
    warn(`minDelta${axis} (${minDelta}) is greater than maxDelta${axis} (${maxDelta}), both are ignored`)
    minDelta = undefined
    maxDelta = undefined
  }

  const hasAny = min !== undefined || max !== undefined || minDelta !== undefined || maxDelta !== undefined
  return {
    min: min ?? -Infinity,
    max: max ?? Infinity,
    minDelta: minDelta ?? 0,
    maxDelta: maxDelta ?? Infinity,
    hasAny,
  }
}

function finiteOrWarn(value: number | undefined, name: string): number | undefined {
  if (value === undefined) return undefined
  if (!Number.isFinite(value)) {
    warn(`limits.${name} must be a finite number, got ${value}, it is ignored`)
    return undefined
  }
  return value
}

function positiveOrWarn(value: number | undefined, name: string): number | undefined {
  const finite = finiteOrWarn(value, name)
  if (finite === undefined) return undefined
  if (finite <= 0) {
    warn(`limits.${name} must be positive, got ${finite}, it is ignored`)
    return undefined
  }
  return finite
}

function warn(message: string): void {
  console.warn(`ZoomChartComponent: ${message}`)
}

// maxDelta cannot exceed the absolute min/max range, the window would not fit otherwise
export function effectiveMaxDelta(limits: AxisLimits): number {
  return Math.min(limits.maxDelta, limits.max - limits.min)
}

// Bounds are routinely decomposed into (center, range) and rebuilt, which drifts values
// by a few ULPs. Violations below this range-relative tolerance are floating point
// noise, treating them as real would e.g. kill an inertia sitting exactly on a limit.
const LIMITS_EPSILON = 1e-9

export function isAxisInsideLimits(bounds: AxisBounds, limits: AxisLimits): boolean {
  if (!limits.hasAny) return true
  const delta = bounds.max - bounds.min
  const epsilon = Math.abs(delta) * LIMITS_EPSILON
  return bounds.min >= limits.min - epsilon &&
    bounds.max <= limits.max + epsilon &&
    delta >= limits.minDelta - epsilon &&
    delta <= effectiveMaxDelta(limits) + epsilon
}

// Valid placements (window min) for a window of the given displayed size. When the
// window is wider than the whole limits range the band inverts to placements covering
// all of it — both edges overflow, no gap on either side.
export function placementBand(range: number, limits: AxisLimits): { lo: number, hi: number } {
  const nearEdge = limits.min
  const farEdge = limits.max - range
  return nearEdge <= farEdge ? { lo: nearEdge, hi: farEdge } : { lo: farEdge, hi: nearEdge }
}

// Per-channel validity, tolerant to (center, range) recomposition fp noise

export function isRangeWithinLimits(range: number, limits: AxisLimits): boolean {
  if (!limits.hasAny) return true
  const epsilon = Math.abs(range) * LIMITS_EPSILON
  return range >= limits.minDelta - epsilon && range <= effectiveMaxDelta(limits) + epsilon
}

export function isPlacementWithinLimits(min: number, range: number, limits: AxisLimits): boolean {
  if (!limits.hasAny) return true
  const band = placementBand(range, limits)
  const epsilon = Math.abs(range) * LIMITS_EPSILON
  return min >= band.lo - epsilon && min <= band.hi + epsilon
}

// Clamps the window to valid limits preserving the anchor screen fraction where possible.
// Range is clamped first around the anchor, then the window is shifted inside min/max,
// so bounds validity always wins over anchor preservation. Returns the input values
// untouched when nothing is violated: callers rely on comparing the result against the
// input to detect a real clamp, so no-op calls must not introduce reconstruction noise.
export function clampAxisToLimits(bounds: AxisBounds, limits: AxisLimits, anchorT: number = 0.5): AxisBounds {
  if (!limits.hasAny) return bounds

  const range = bounds.max - bounds.min
  const epsilon = Math.abs(range) * LIMITS_EPSILON
  const maxDelta = effectiveMaxDelta(limits)

  let min = bounds.min
  let max = bounds.max

  if (range > maxDelta + epsilon || range < limits.minDelta - epsilon) {
    const clampedRange = clamp(range, limits.minDelta, maxDelta)
    const anchorValue = min + anchorT * range
    min = anchorValue - anchorT * clampedRange
    max = min + clampedRange
  }

  if (min < limits.min - epsilon) {
    max += limits.min - min
    min = limits.min
  } else if (max > limits.max + epsilon) {
    min -= max - limits.max
    max = limits.max
  }

  return min === bounds.min && max === bounds.max ? bounds : { min, max }
}

export function nearestValidAxisTarget(bounds: AxisBounds, limits: AxisLimits): AxisBounds {
  return clampAxisToLimits(bounds, limits, 0.5)
}
