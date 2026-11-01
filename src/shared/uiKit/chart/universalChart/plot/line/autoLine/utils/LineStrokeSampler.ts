import { InteractionBounds } from '../../../../interaction/core/InteractionGeometry'
import { Point } from '../../../../utils/Point'

export type StrokeSubpath = {
  readonly points: readonly Point[]
  readonly bounds: InteractionBounds
  readonly curves: readonly StrokeCurve[]
  readonly directions: Readonly<Record<'x' | 'y', AxisDirection>>
}

type StrokeCurve = { from: Point, to: Point, controls?: readonly [Point, Point] }
type AxisDirection = -1 | 0 | 1 | null

export type StrokeProjection = {
  readonly anchor: Point
  readonly distance: number
  readonly subpathIndex: number
}

const SAMPLE_STEP_PX = 4
const MAX_SEGMENTS_PER_CURVE = 2000
const MAX_SAMPLES_PER_SUBPATH = 4000
const AXIS_EPSILON_PX = 0.01
const TARGET_EPSILON_PX = 0.1

export function sampleStrokeSubpaths(d: string): readonly StrokeSubpath[] {
  const commands = parseCommands(d)
  const subpaths: StrokeSubpath[] = []

  let current: Point[] = []
  let curves: StrokeCurve[] = []
  let cursor: Point | null = null

  const flush = () => {
    if (current.length > 0) subpaths.push({
      points: current, bounds: boundsOf(current), curves,
      directions: { x: axisDirection(curves, 'x'), y: axisDirection(curves, 'y') },
    })
    current = []
    curves = []
  }

  for (const command of commands) {
    if (command.type === 'M') {
      flush()
      cursor = { x: command.values[0], y: command.values[1] }
      current.push(cursor)
      continue
    }
    if (!cursor) continue

    if (command.type === 'L') {
      const end = { x: command.values[0], y: command.values[1] }
      curves.push({ from: cursor, to: end })
      cursor = end
      current.push(cursor)
      continue
    }

    if (command.type === 'C') {
      const c1 = { x: command.values[0], y: command.values[1] }
      const c2 = { x: command.values[2], y: command.values[3] }
      const end = { x: command.values[4], y: command.values[5] }
      curves.push({ from: cursor, to: end, controls: [c1, c2] })
      appendFlattenedCubic(current, cursor, c1, c2, end)
      cursor = end
    }
  }
  flush()

  return subpaths
}

// Sample where the spring is now; the selected point disambiguates overlapping subpaths.
export function pointOnSubpathsAtAxis(subpaths: readonly StrokeSubpath[], axis: 'x' | 'y', value: number, target: Point): Point | null {
  return sampleOrNearestAtAxis(subpaths, axis, value, target, 0)
}

export function sampleOrNearestAtAxis(subpaths: readonly StrokeSubpath[], axis: 'x' | 'y', value: number, target: Point, maxAxisDistance = Infinity): Point | null {
  if (!Number.isFinite(value)) return null

  let selected: Point | null = null
  let axisDistance = Infinity
  let distance = Infinity
  let ambiguous = false

  for (const subpath of subpaths) {
    const sampled = pointOnSubpathAtAxis(subpath, axis, value)
    const anchor = sampled ?? nearestSubpathEndpoint(subpath, axis, value, maxAxisDistance)
    if (!anchor) continue

    const nextAxisDistance = sampled ? 0 : Math.abs(anchor[axis] - value)
    const targetAnchor = pointOnSubpathAtAxis(subpath, axis, target[axis])
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

function nearestSubpathEndpoint(subpath: StrokeSubpath, axis: 'x' | 'y', value: number, maxAxisDistance: number): Point | null {
  if (subpath.directions[axis] === null) return null
  const first = subpath.curves[0]?.from ?? subpath.points[0]
  const last = subpath.curves.at(-1)?.to ?? first
  const firstDistance = Math.abs(value - first[axis])
  const lastDistance = Math.abs(value - last[axis])
  const nearest = firstDistance <= lastDistance ? first : last
  return Math.abs(value - nearest[axis]) <= maxAxisDistance ? nearest : null
}

function axisDirection(curves: readonly StrokeCurve[], axis: 'x' | 'y'): AxisDirection {
  let direction: AxisDirection = 0
  const other = axis === 'x' ? 'y' : 'x'

  for (const curve of curves) {
    const points = [...(curve.controls ?? []), curve.to]
    if (curve.from[axis] === curve.to[axis] && points.some(p => p[other] !== curve.from[other])) return null

    let previous = curve.from[axis]
    for (const point of points) {
      const delta = point[axis] - previous
      previous = point[axis]
      if (delta === 0) continue
      const sign = delta > 0 ? 1 : -1
      if (direction !== 0 && direction !== sign) return null
      direction = sign
    }
  }

  return direction
}

function pointOnSubpathAtAxis(subpath: StrokeSubpath, axis: 'x' | 'y', value: number): Point | null {
  const direction = subpath.directions[axis]
  if (direction === null || !Number.isFinite(value)) return null

  const first = subpath.curves[0]?.from ?? subpath.points[0]
  const last = subpath.curves.at(-1)?.to ?? first
  if (direction === 0) {
    if (Math.abs(value - first[axis]) <= AXIS_EPSILON_PX) return { ...first, [axis]: value }
    return null
  }

  const position = value * direction
  const start = first[axis] * direction
  const end = last[axis] * direction
  if (position < start - AXIS_EPSILON_PX || position > end + AXIS_EPSILON_PX) return null
  if (position <= start) return { ...first, [axis]: value }
  if (position >= end) return { ...last, [axis]: value }

  let low = 0
  let high = subpath.curves.length - 1
  while (low < high) {
    const mid = (low + high) >>> 1
    if (subpath.curves[mid].to[axis] * direction < position) low = mid + 1
    else high = mid
  }

  const curve = subpath.curves[low]
  if (!curve.controls) {
    const t = (value - curve.from[axis]) / (curve.to[axis] - curve.from[axis])
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
    const coordinate = cubicCoordinateAt(curve.from[axis], c1[axis], c2[axis], curve.to[axis], t)
    if (Math.abs(coordinate - value) < 1e-7) break
    if ((coordinate - value) * direction < 0) from = t
    else to = t
  }
  return { ...cubicPointAt(curve.from, c1, c2, curve.to, t), [axis]: value }
}

function cubicCoordinateAt(from: number, c1: number, c2: number, to: number, t: number): number {
  const mt = 1 - t
  return mt * mt * mt * from + 3 * mt * mt * t * c1 + 3 * mt * t * t * c2 + t * t * t * to
}

type PathCommand = { type: 'M' | 'L' | 'C', values: number[] }

const ARG_COUNT: Record<PathCommand['type'], number> = { M: 2, L: 2, C: 6 }
const KNOWN_COMMANDS = new Set(['M', 'L', 'C'])

// TODO: Возможно лучше не парсить svg, а получать исходные точки из которых этот d был построен.
function parseCommands(d: string): PathCommand[] {
  const tokens = d.match(/[A-Za-z]|-?\d+\.?\d*(?:[eE][+-]?\d+)?/g) ?? []
  const commands: PathCommand[] = []

  let i = 0
  let type: PathCommand['type'] | null = null

  while (i < tokens.length) {
    const token = tokens[i]

    if (/^[A-Za-z]$/.test(token)) {
      if (!KNOWN_COMMANDS.has(token)) {
        console.error(`LineStrokeSampler: unexpected path command "${token}" — stroke sampling supports only M/L/C, parsing stopped`)
        break
      }
      type = token as PathCommand['type']
      i++
      continue
    }
    if (!type) break

    const count = ARG_COUNT[type]
    const values: number[] = []
    for (let k = 0; k < count && i < tokens.length; k++, i++) values.push(Number(tokens[i]))
    if (values.length === count) commands.push({ type, values })
  }

  return commands
}

function appendFlattenedCubic(out: Point[], p0: Point, c1: Point, c2: Point, p1: Point) {
  const controlLength = dist(p0, c1) + dist(c1, c2) + dist(c2, p1)
  const segments = Math.min(MAX_SEGMENTS_PER_CURVE, Math.max(1, Math.ceil(controlLength / SAMPLE_STEP_PX)))

  for (let i = 1; i <= segments; i++) {
    if (out.length >= MAX_SAMPLES_PER_SUBPATH) return
    const t = i / segments
    out.push(cubicPointAt(p0, c1, c2, p1, t))
  }
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

function boundsOf(points: readonly Point[]): InteractionBounds {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const p of points) {
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y)
    maxY = Math.max(maxY, p.y)
  }

  return { minX, maxX, minY, maxY }
}

export function nearestPointOnSubpaths(subpaths: readonly StrokeSubpath[], point: Point, margin: number): StrokeProjection | null {
  let best: StrokeProjection | null = null

  for (let i = 0; i < subpaths.length; i++) {
    const subpath = subpaths[i]
    if (!boundsWithinMargin(subpath.bounds, point, margin)) continue

    const projection = nearestPointOnPolyline(subpath.points, point)
    if (projection && (!best || projection.distance < best.distance)) best = { ...projection, subpathIndex: i }
  }

  return best
}

function boundsWithinMargin(bounds: InteractionBounds, point: Point, margin: number): boolean {
  return point.x >= bounds.minX - margin && point.x <= bounds.maxX + margin &&
    point.y >= bounds.minY - margin && point.y <= bounds.maxY + margin
}

function nearestPointOnPolyline(points: readonly Point[], point: Point): { anchor: Point, distance: number } | null {
  if (points.length === 0) return null
  if (points.length === 1) return { anchor: points[0], distance: dist(point, points[0]) }

  let best: { anchor: Point, distance: number } | null = null

  for (let i = 0; i < points.length - 1; i++) {
    const projection = projectOnSegment(point, points[i], points[i + 1])
    if (!best || projection.distance < best.distance) best = projection
  }

  return best
}

function projectOnSegment(point: Point, a: Point, b: Point): { anchor: Point, distance: number } {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSq = dx * dx + dy * dy

  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq))
  const anchor = { x: a.x + t * dx, y: a.y + t * dy }

  return { anchor, distance: dist(point, anchor) }
}
