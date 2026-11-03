import { Point } from '../../../../utils/Point'
import { axisCoordinate, type Axis } from '../../../../utils/Axis'

export type StrokeSubpath = {
  readonly start: Point
  readonly curves: readonly StrokeCurve[]
  readonly directions: Readonly<Record<keyof Point, CoordinateDirection>>
}

type StrokeCurve = { from: Point, to: Point, controls?: readonly [Point, Point] }
type CoordinateDirection = -1 | 0 | 1 | null

export type StrokeProjection = {
  readonly anchor: Point
  readonly distance: number
  readonly subpathIndex: number
}

const AXIS_EPSILON_PX = 0.01
const TARGET_EPSILON_PX = 0.1

// Packed endpoints and cubic controls are shared with linePath.zig; no SVG text is involved.
export function strokeSubpathFromNodes(nodes: Float64Array): StrokeSubpath | null {
  if (nodes.length === 0) return null
  const start = { x: nodes[0], y: nodes[1] }
  let cursor = start
  const curves: StrokeCurve[] = []

  for (let i = 6; i < nodes.length; i += 6) {
    const end = { x: nodes[i], y: nodes[i + 1] }
    if (Number.isFinite(nodes[i + 2])) {
      const c1 = { x: nodes[i + 2], y: nodes[i + 3] }
      const c2 = { x: nodes[i + 4], y: nodes[i + 5] }
      curves.push({ from: cursor, to: end, controls: [c1, c2] })
    } else {
      curves.push({ from: cursor, to: end })
    }
    cursor = end
  }

  return {
    start, curves,
    directions: { x: coordinateDirection(curves, 'x'), y: coordinateDirection(curves, 'y') },
  }
}

// Sample where the spring is now; the selected point disambiguates overlapping subpaths.
export function pointOnSubpathsAtAxis(subpaths: readonly StrokeSubpath[], axis: Axis, value: number, target: Point): Point | null {
  return sampleOrNearestAtAxis(subpaths, axis, value, target, 0)
}

export function sampleOrNearestAtAxis(subpaths: readonly StrokeSubpath[], axis: Axis, value: number, target: Point, maxAxisDistance = Infinity): Point | null {
  if (!Number.isFinite(value)) return null

  const coordinateKey = axisCoordinate(axis)
  let selected: Point | null = null
  let axisDistance = Infinity
  let distance = Infinity
  let ambiguous = false

  for (const subpath of subpaths) {
    const sampled = pointOnSubpathAtCoordinate(subpath, coordinateKey, value)
    const anchor = sampled ?? nearestSubpathEndpoint(subpath, coordinateKey, value, maxAxisDistance)
    if (!anchor) continue

    const nextAxisDistance = sampled ? 0 : Math.abs(anchor[coordinateKey] - value)
    const targetAnchor = pointOnSubpathAtCoordinate(subpath, coordinateKey, target[coordinateKey])
    const nextDistance = targetAnchor ? dist(targetAnchor, target) : Infinity

    if (!selected || nextAxisDistance < axisDistance || nextAxisDistance === axisDistance && nextDistance < distance) {
      selected = anchor
      axisDistance = nextAxisDistance
      distance = nextDistance
      ambiguous = false
      continue
    }
    if (nextAxisDistance === axisDistance && nextDistance === distance && dist(anchor, selected) > TARGET_EPSILON_PX) {
      ambiguous = true
    }
  }

  return ambiguous ? null : selected
}

function nearestSubpathEndpoint(subpath: StrokeSubpath, coordinateKey: keyof Point, value: number, maxAxisDistance: number): Point | null {
  if (subpath.directions[coordinateKey] === null) return null
  const first = subpath.start
  const last = subpath.curves.at(-1)?.to ?? first
  const firstDistance = Math.abs(value - first[coordinateKey])
  const lastDistance = Math.abs(value - last[coordinateKey])
  const nearest = firstDistance <= lastDistance ? first : last
  return Math.abs(value - nearest[coordinateKey]) <= maxAxisDistance ? nearest : null
}

function coordinateDirection(curves: readonly StrokeCurve[], coordinateKey: keyof Point): CoordinateDirection {
  let direction: CoordinateDirection = 0
  const other = coordinateKey === 'x' ? 'y' : 'x'

  for (const curve of curves) {
    const points = [...(curve.controls ?? []), curve.to]
    if (curve.from[coordinateKey] === curve.to[coordinateKey] && points.some(p => p[other] !== curve.from[other])) return null

    let previous = curve.from[coordinateKey]
    for (const point of points) {
      const delta = point[coordinateKey] - previous
      previous = point[coordinateKey]
      if (delta === 0) continue
      const sign = delta > 0 ? 1 : -1
      if (direction !== 0 && direction !== sign) return null
      direction = sign
    }
  }

  return direction
}

function pointOnSubpathAtCoordinate(subpath: StrokeSubpath, coordinateKey: keyof Point, value: number): Point | null {
  const direction = subpath.directions[coordinateKey]
  if (direction === null || !Number.isFinite(value)) return null

  const first = subpath.start
  const last = subpath.curves.at(-1)?.to ?? first
  if (direction === 0) {
    if (Math.abs(value - first[coordinateKey]) <= AXIS_EPSILON_PX) return { ...first, [coordinateKey]: value }
    return null
  }

  const position = value * direction
  const start = first[coordinateKey] * direction
  const end = last[coordinateKey] * direction
  if (position < start - AXIS_EPSILON_PX || position > end + AXIS_EPSILON_PX) return null
  if (position <= start) return { ...first, [coordinateKey]: value }
  if (position >= end) return { ...last, [coordinateKey]: value }

  let low = 0
  let high = subpath.curves.length - 1
  while (low < high) {
    const mid = (low + high) >>> 1
    if (subpath.curves[mid].to[coordinateKey] * direction < position) low = mid + 1
    else high = mid
  }

  const curve = subpath.curves[low]
  if (!curve.controls) {
    const t = (value - curve.from[coordinateKey]) / (curve.to[coordinateKey] - curve.from[coordinateKey])
    return {
      x: curve.from.x + (curve.to.x - curve.from.x) * t,
      y: curve.from.y + (curve.to.y - curve.from.y) * t,
    }
  }

  const [c1, c2] = curve.controls
  let from = 0
  let to = 1
  let t = 0.5
  for (let i = 0; i < 40; i++) {
    t = (from + to) / 2
    const coordinate = cubicCoordinateAt(curve.from[coordinateKey], c1[coordinateKey], c2[coordinateKey], curve.to[coordinateKey], t)
    if (Math.abs(coordinate - value) < 1e-7) break
    if ((coordinate - value) * direction < 0) from = t
    else to = t
  }
  return { ...cubicPointAt(curve.from, c1, c2, curve.to, t), [coordinateKey]: value }
}

function cubicCoordinateAt(from: number, c1: number, c2: number, to: number, t: number): number {
  const mt = 1 - t
  return mt * mt * mt * from + 3 * mt * mt * t * c1 + 3 * mt * t * t * c2 + t * t * t * to
}

function cubicPointAt(p0: Point, c1: Point, c2: Point, p1: Point, t: number): Point {
  const mt = 1 - t
  const a = mt * mt * mt
  const b = 3 * mt * mt * t
  const c = 3 * mt * t * t
  const e = t * t * t

  return {
    x: a * p0.x + b * c1.x + c * c2.x + e * p1.x,
    y: a * p0.y + b * c1.y + c * c2.y + e * p1.y,
  }
}

function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}
