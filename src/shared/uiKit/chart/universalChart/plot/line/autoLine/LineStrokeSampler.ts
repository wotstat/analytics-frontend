import { InteractionBounds } from '../../../interaction/core/InteractionGeometry'
import { Point } from '../../../utils/Point'

export type StrokeSubpath = {
  readonly points: readonly Point[]
  readonly bounds: InteractionBounds
}

export type StrokeProjection = {
  readonly anchor: Point
  readonly distance: number
  readonly subpathIndex: number
}

const SAMPLE_STEP_PX = 4
const MAX_SEGMENTS_PER_CURVE = 2000
const MAX_SAMPLES_PER_SUBPATH = 4000

export function sampleStrokeSubpaths(d: string): readonly StrokeSubpath[] {
  const commands = parseCommands(d)
  const subpaths: StrokeSubpath[] = []

  let current: Point[] = []
  let cursor: Point | null = null

  const flush = () => {
    if (current.length > 0) subpaths.push({ points: current, bounds: boundsOf(current) })
    current = []
  }

  for (const command of commands) {
    if (command.type === 'M') {
      flush()
      cursor = { x: command.values[0], y: command.values[1] }
      current.push(cursor)
    } else if (command.type === 'L' && cursor) {
      cursor = { x: command.values[0], y: command.values[1] }
      current.push(cursor)
    } else if (command.type === 'C' && cursor) {
      const c1 = { x: command.values[0], y: command.values[1] }
      const c2 = { x: command.values[2], y: command.values[3] }
      const end = { x: command.values[4], y: command.values[5] }
      appendFlattenedCubic(current, cursor, c1, c2, end)
      cursor = end
    }
  }
  flush()

  return subpaths
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
        console.error(`LineStrokeSampler: неожиданная команда path "${token}" — nearStroke понимает только M/L/C, разбор прерван`)
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
