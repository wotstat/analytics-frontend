import { AxisBounds, RUBBER_BAND_COEFF, RUBBER_BAND_MAX_RATIO, axisCenter, axisRange, clamp } from './common'
import { AxisLimits, effectiveMaxDelta, placementBand } from './limits'

// Exponentially saturating rubber band: the farther the overflow, the exponentially
// weaker the additional pull. Slope at zero overflow is RUBBER_BAND_COEFF, the visible
// overscroll asymptotically approaches RUBBER_BAND_MAX_RATIO of the viewport.
export function rubberBand(overflow: number, viewportSize: number): number {
  const c = RUBBER_BAND_COEFF
  const limit = viewportSize * RUBBER_BAND_MAX_RATIO
  const sign = Math.sign(overflow)
  const x = Math.abs(overflow)

  return sign * limit * (1 - Math.exp(-c * x / limit))
}

export function invRubberBand(resisted: number, viewportSize: number): number {
  const c = RUBBER_BAND_COEFF
  const limit = viewportSize * RUBBER_BAND_MAX_RATIO
  const sign = Math.sign(resisted)
  const y = Math.min(Math.abs(resisted), limit * 0.999)

  return sign * (-limit / c) * Math.log(1 - y / limit)
}

export function rubberBandDerivative(overflow: number, viewportSize: number): number {
  const c = RUBBER_BAND_COEFF
  const limit = viewportSize * RUBBER_BAND_MAX_RATIO

  return c * Math.exp(-c * Math.abs(overflow) / limit)
}

// Raw -> displayed projection: identity inside limits, resisted overflow outside.
// Range (zoom) overflow is resisted in log space, then the resisted window is placed
// so that the zoom anchor (wheel cursor / pinch midpoint screen fraction) keeps its
// chart value, and finally the placement is resisted against the valid placement band.
// Pure function of (bounds, anchorT), so it never fights active input and is exactly
// invertible for the same anchor.
export function applyElasticAxis(bounds: AxisBounds, limits: AxisLimits, layoutSize: number, anchorT: number = 0.5): AxisBounds {
  if (!limits.hasAny || !(layoutSize > 0)) return bounds

  const rawRange = axisRange(bounds)
  const range = resistedAxisRange(rawRange, limits, layoutSize)
  const anchorValue = bounds.min + anchorT * rawRange
  const min = resistPlacement(anchorValue - anchorT * range, range, limits, layoutSize)

  return { min, max: min + range }
}

export function invertElasticAxis(bounds: AxisBounds, limits: AxisLimits, layoutSize: number, anchorT: number = 0.5): AxisBounds {
  if (!limits.hasAny || !(layoutSize > 0)) return bounds

  const displayedRange = axisRange(bounds)
  const rawRange = invertResistedAxisRange(displayedRange, limits, layoutSize)
  const min = invertResistedPlacement(bounds.min, displayedRange, limits, layoutSize)
  const anchorValue = min + anchorT * displayedRange
  const rawMin = anchorValue - anchorT * rawRange

  return { min: rawMin, max: rawMin + rawRange }
}

// Local slope of the projection per channel, used to translate raw-space release velocity
// into displayed-space velocity when starting a spring. 1 while inside limits.
export function elasticVelocityFactor(bounds: AxisBounds, limits: AxisLimits, layoutSize: number): { center: number, logRange: number } {
  if (!limits.hasAny || !(layoutSize > 0)) return { center: 1, logRange: 1 }

  const range = axisRange(bounds)
  const center = axisCenter(bounds)

  let logRangeFactor = 1
  const rangeLimit = violatedRangeLimit(range, limits)
  if (rangeLimit !== null) logRangeFactor = rubberBandDerivative(Math.log(range / rangeLimit) * layoutSize, layoutSize)

  let centerFactor = 1
  const resistedRange = resistedAxisRange(range, limits, layoutSize)
  const min = center - resistedRange / 2 // release contexts project with anchorT = 0.5
  const band = placementBand(resistedRange, limits)
  const clamped = clamp(min, band.lo, band.hi)
  if (min !== clamped) {
    const scale = layoutSize / resistedRange
    centerFactor = rubberBandDerivative((min - clamped) * scale, layoutSize)
  }

  return { center: centerFactor, logRange: logRangeFactor }
}

function violatedRangeLimit(range: number, limits: AxisLimits): number | null {
  const maxDelta = effectiveMaxDelta(limits)
  const limit = range > maxDelta ? maxDelta : range < limits.minDelta ? limits.minDelta : null
  if (limit === null || limit <= 0 || !Number.isFinite(limit)) return null
  return limit
}

export function resistedAxisRange(range: number, limits: AxisLimits, layoutSize: number): number {
  const limit = violatedRangeLimit(range, limits)
  if (limit === null) return range

  const overflowPx = Math.log(range / limit) * layoutSize
  return limit * Math.exp(rubberBand(overflowPx, layoutSize) / layoutSize)
}

export function invertResistedAxisRange(range: number, limits: AxisLimits, layoutSize: number): number {
  const limit = violatedRangeLimit(range, limits)
  if (limit === null) return range

  const resistedPx = Math.log(range / limit) * layoutSize
  return limit * Math.exp(invRubberBand(resistedPx, layoutSize) / layoutSize)
}

function resistPlacement(min: number, range: number, limits: AxisLimits, layoutSize: number): number {
  const band = placementBand(range, limits)
  const clamped = clamp(min, band.lo, band.hi)
  if (min === clamped) return min

  const scale = layoutSize / range
  return clamped + rubberBand((min - clamped) * scale, layoutSize) / scale
}

export function invertResistedPlacement(min: number, range: number, limits: AxisLimits, layoutSize: number): number {
  const band = placementBand(range, limits)
  const clamped = clamp(min, band.lo, band.hi)
  if (min === clamped) return min

  const scale = layoutSize / range
  return clamped + invRubberBand((min - clamped) * scale, layoutSize) / scale
}
