import { Bounds } from '../../../../utils/Bounds'
import { Point } from '../../../../utils/Point'

export type Axis = 'x' | 'y'
export type AxisBounds = { min: number, max: number }
export type LayoutValue = { x: number, y: number, width: number, height: number }

export const DEFAULT_DECELERATION = 0.99
export const DEFAULT_TOUCH_ZOOM_DECELERATION = 0.95
export const MIN_VELOCITY_SAMPLE_DT = 1 / 200
export const VELOCITY_SAMPLE_OUTLIER_RATIO = 0.5
export const VELOCITY_SAMPLE_DT_SMOOTHING = 0.2
export const INPUT_STOP_TIMEOUT = 0.1
export const INERTIA_MIN_REMAINING_PIXELS = 0.5
export const WHEEL_BATCH_TIMEOUT = 0.15
export const RUBBER_BAND_COEFF = 0.15
export const RUBBER_BAND_MAX_RATIO = 0.15

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// Normalized position along an axis in chart direction (0 at min, 1 at max).
// Screen Y grows downward while chart Y grows upward, hence the inversion.
export function getAxisPosition(axis: Axis, point: Point, layout: LayoutValue): number {
  if (axis === 'x') return (point.x - layout.x) / layout.width
  return 1 - (point.y - layout.y) / layout.height
}

export function getAxisSize(axis: Axis, layout: LayoutValue): number {
  return axis === 'x' ? layout.width : layout.height
}

export function orderedAxisBounds(min: number, max: number): AxisBounds | null {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return null
  return min < max ? { min, max } : { min: max, max: min }
}

export function getAxisBounds(bounds: Bounds, axis: Axis): AxisBounds {
  return axis === 'x' ? { min: bounds.minX, max: bounds.maxX } : { min: bounds.minY, max: bounds.maxY }
}

export function setAxisBounds(bounds: Bounds, axis: Axis, value: AxisBounds): void {
  if (axis === 'x') {
    bounds.minX = value.min
    bounds.maxX = value.max
  } else {
    bounds.minY = value.min
    bounds.maxY = value.max
  }
}

export function axisCenter(bounds: AxisBounds): number {
  return (bounds.min + bounds.max) / 2
}

export function axisRange(bounds: AxisBounds): number {
  return bounds.max - bounds.min
}
