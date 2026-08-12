import { geometryFromPoint } from '../../../interaction/core/InteractionGeometry'
import { InteractionHit } from '../../../interaction/core/InteractionHit'
import { InteractionSource } from '../../../interaction/core/InteractionIdentity'
import { InteractionResolveContext } from '../../../interaction/core/InteractionResolver'
import { Selection } from '../../../interaction/core/Selection'
import { ChartSpace } from '../../../utils/ChartSpace'
import { Point } from '../../../utils/Point'
import { nearestPointOnSubpaths, StrokeSubpath } from './LineStrokeSampler'

export type LinePointHit<T extends Point = Point> = InteractionHit<T, 'line-point'> & {
  readonly pointIndex: number
}

export type NearestByAxisOptions = {
  maxAxisDistance?: number
}

export type StrokeGeometry = {
  readonly subpaths: readonly StrokeSubpath[]
  readonly target: SVGPathElement | null
}

export type NearStrokeOptions = {
  maxDistance: number
}

export type LineStrokeDatum<T extends Point = Point> = {
  readonly points: readonly (T | null)[]
}

export type LineStrokeMeta = {
  readonly subpathIndex: number
}

export type LineStrokeHit<T extends Point = Point> = InteractionHit<LineStrokeDatum<T>, 'line-stroke'> & {
  readonly meta: LineStrokeMeta
}

const SERIES_KEY = 'series'

export abstract class AutoLineInteractionQuery<T extends Point = Point> {

  abstract readonly sources: readonly AutoLineInteractionSource<T>[]

  union<U extends Point>(other: AutoLineInteractionQuery<U>): AutoLineInteractionQuery<T | U> {
    return new AutoLineSourceUnion<T | U>([...this.sources, ...other.sources])
  }

  nearestByAxis(axis: 'x' | 'y', options: NearestByAxisOptions = {}): Selection<LinePointHit<T>> {
    return new NearestByAxisSelection(this.sources, axis, options)
  }

  nearStroke(options: NearStrokeOptions): Selection<LineStrokeHit<T>> {
    return new NearStrokeSelection(this.sources, options)
  }
}

class AutoLineSourceUnion<T extends Point> extends AutoLineInteractionQuery<T> {
  constructor(readonly sources: readonly AutoLineInteractionSource<T>[]) {
    super()
  }
}

export class AutoLineInteractionSource<T extends Point = Point> extends AutoLineInteractionQuery<T> implements InteractionSource {

  readonly sources: readonly AutoLineInteractionSource<T>[] = [this]

  constructor(
    private readonly getPoints: () => readonly (T | null)[],
    private readonly getStroke: () => StrokeGeometry
  ) {
    super()
  }

  get points(): readonly (T | null)[] {
    return this.getPoints()
  }

  nearStrokeHit(point: Point, maxDistance: number): LineStrokeHit<T> | null {
    const { subpaths, target } = this.getStroke()
    if (!target || subpaths.length === 0) return null

    const halfWidth = strokeHalfWidth(target)
    const projection = nearestPointOnSubpaths(subpaths, point, Math.max(maxDistance, halfWidth))
    if (!projection) return null

    const contains = projection.distance <= halfWidth
    if (!contains && projection.distance > maxDistance) return null

    return {
      kind: 'line-stroke',
      source: this,
      datum: { points: this.points },
      identity: { source: this, kind: 'series', key: SERIES_KEY },
      memberships: [],
      geometry: geometryFromPoint(projection.anchor),
      geometryFor: () => null,
      distance: projection.distance,
      contains,
      targets: [target],
      meta: { subpathIndex: projection.subpathIndex }
    }
  }
}

function strokeHalfWidth(target: SVGPathElement): number {
  const width = parseFloat(getComputedStyle(target).strokeWidth)
  return (Number.isFinite(width) ? width : 0) / 2
}

function isEligible<T extends Point>(point: T | null, space: ChartSpace): point is T {
  return point !== null && space.bounds.contains(point)
}

class NearestByAxisSelection<T extends Point> extends Selection<LinePointHit<T>> {

  constructor(
    private readonly sources: readonly AutoLineInteractionSource<T>[],
    private readonly axis: 'x' | 'y',
    private readonly options: NearestByAxisOptions
  ) {
    super()
  }

  resolve(ctx: InteractionResolveContext): readonly LinePointHit<T>[] {
    const pointer = ctx.input.pointer
    if (!pointer) return []

    const space = ctx.space
    const scale = space.chartToLocalScale()
    const axisScale = this.axis === 'x' ? scale.scaleX : scale.scaleY
    const target = this.axis === 'x' ? space.layoutToChartX(pointer.point.x) : space.layoutToChartY(pointer.point.y)

    let bestValue = 0
    let bestDistance = Infinity

    for (const source of this.sources) {
      for (const point of source.points) {
        if (!isEligible(point, space)) continue

        const value = this.axis === 'x' ? point.x : point.y
        const distance = Math.abs(value - target) * axisScale
        if (distance < bestDistance) {
          bestDistance = distance
          bestValue = value
        }
      }
    }

    if (bestDistance === Infinity) return []
    if (bestDistance > (this.options.maxAxisDistance ?? Infinity)) return []

    const hits: LinePointHit<T>[] = []
    for (const source of this.sources) {
      const points = source.points

      for (let i = 0; i < points.length; i++) {
        const point = points[i]
        if (!isEligible(point, space)) continue
        if ((this.axis === 'x' ? point.x : point.y) !== bestValue) continue

        const hit = createHit(source, point, i, space, pointer.point)
        if (hit) hits.push(hit)
      }
    }

    return hits
  }
}

function createHit<T extends Point>(
  source: AutoLineInteractionSource<T>,
  point: T,
  index: number,
  space: ChartSpace,
  pointer: Point
): LinePointHit<T> | null {
  const anchor = space.chartToLayout(point)
  if (!Number.isFinite(anchor.x) || !Number.isFinite(anchor.y)) return null

  return {
    kind: 'line-point',
    source,
    datum: point,
    identity: { source, kind: 'item', key: index },
    memberships: [{ source, kind: 'series', key: SERIES_KEY }],
    geometry: geometryFromPoint(anchor),
    geometryFor: () => null,
    distance: Math.hypot(anchor.x - pointer.x, anchor.y - pointer.y),
    contains: false,
    targets: [],
    pointIndex: index
  }
}

class NearStrokeSelection<T extends Point> extends Selection<LineStrokeHit<T>> {

  constructor(
    private readonly sources: readonly AutoLineInteractionSource<T>[],
    private readonly options: NearStrokeOptions
  ) {
    super()
  }

  resolve(ctx: InteractionResolveContext): readonly LineStrokeHit<T>[] {
    const pointer = ctx.input.pointer
    if (!pointer) return []

    const hits: LineStrokeHit<T>[] = []
    for (const source of this.sources) {
      const hit = source.nearStrokeHit(pointer.point, this.options.maxDistance)
      if (hit) hits.push(hit)
    }

    return hits
  }
}
