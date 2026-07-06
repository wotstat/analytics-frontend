import { AxisBounds, RUBBER_BAND_COEFF, RUBBER_BAND_MAX_RATIO, axisCenter, axisRange, clamp } from './common'
import { AxisLimits, effectiveMaxDelta } from './limits'

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

// Stateless raw -> displayed projection: identity inside limits, resisted overflow outside.
// Range (zoom) overflow is resisted in log space, then the center is resisted against the
// valid center interval computed with the already-resisted range.
export function applyElasticAxis(bounds: AxisBounds, limits: AxisLimits, layoutSize: number): AxisBounds {
  if (!limits.hasAny || !(layoutSize > 0)) return bounds

  const range = resistRange(axisRange(bounds), limits, layoutSize)
  const center = resistCenter(axisCenter(bounds), range, limits, layoutSize)

  return { min: center - range / 2, max: center + range / 2 }
}

export function invertElasticAxis(bounds: AxisBounds, limits: AxisLimits, layoutSize: number): AxisBounds {
  if (!limits.hasAny || !(layoutSize > 0)) return bounds

  const displayedRange = axisRange(bounds)
  const rawRange = invertResistedRange(displayedRange, limits, layoutSize)
  const rawCenter = invertResistedCenter(axisCenter(bounds), displayedRange, limits, layoutSize)

  return { min: rawCenter - rawRange / 2, max: rawCenter + rawRange / 2 }
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
  const resistedRange = resistRange(range, limits, layoutSize)
  const clampedCenter = clampCenter(center, resistedRange, limits)
  if (center !== clampedCenter) {
    const scale = layoutSize / resistedRange
    centerFactor = rubberBandDerivative((center - clampedCenter) * scale, layoutSize)
  }

  return { center: centerFactor, logRange: logRangeFactor }
}

function violatedRangeLimit(range: number, limits: AxisLimits): number | null {
  const maxDelta = effectiveMaxDelta(limits)
  const limit = range > maxDelta ? maxDelta : range < limits.minDelta ? limits.minDelta : null
  if (limit === null || limit <= 0 || !Number.isFinite(limit)) return null
  return limit
}

function resistRange(range: number, limits: AxisLimits, layoutSize: number): number {
  const limit = violatedRangeLimit(range, limits)
  if (limit === null) return range

  const overflowPx = Math.log(range / limit) * layoutSize
  return limit * Math.exp(rubberBand(overflowPx, layoutSize) / layoutSize)
}

function invertResistedRange(range: number, limits: AxisLimits, layoutSize: number): number {
  const limit = violatedRangeLimit(range, limits)
  if (limit === null) return range

  const resistedPx = Math.log(range / limit) * layoutSize
  return limit * Math.exp(invRubberBand(resistedPx, layoutSize) / layoutSize)
}

// The valid center interval collapses continuously to the limits midpoint once the window
// no longer fits between the absolute limits.
function clampCenter(center: number, range: number, limits: AxisLimits): number {
  const minCenter = limits.min + range / 2
  const maxCenter = limits.max - range / 2
  return minCenter > maxCenter ? (limits.min + limits.max) / 2 : clamp(center, minCenter, maxCenter)
}

function resistCenter(center: number, range: number, limits: AxisLimits, layoutSize: number): number {
  const clampedCenter = clampCenter(center, range, limits)
  if (center === clampedCenter) return center

  const scale = layoutSize / range
  return clampedCenter + rubberBand((center - clampedCenter) * scale, layoutSize) / scale
}

function invertResistedCenter(center: number, displayedRange: number, limits: AxisLimits, layoutSize: number): number {
  const clampedCenter = clampCenter(center, displayedRange, limits)
  if (center === clampedCenter) return center

  const scale = layoutSize / displayedRange
  return clampedCenter + invRubberBand((center - clampedCenter) * scale, layoutSize) / scale
}
