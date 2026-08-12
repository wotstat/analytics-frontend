import { geometryFromPoint } from '../../../interaction/core/InteractionGeometry'
import { InteractionHit } from '../../../interaction/core/InteractionHit'
import { InteractionResolveContext } from '../../../interaction/core/InteractionResolver'
import { Selection } from '../../../interaction/core/Selection'
import { ChartSpace } from '../../../utils/ChartSpace'
import { Point } from '../../../utils/Point'

export type NearestPointOptions = {
  maxDistance: number
}

export type AutoMarkerRenderMeta = {
  readonly size: number
  readonly maskSize: number
}

export type AutoMarkerHit<T extends Point = Point> = InteractionHit<T, 'scatter-point'> & {
  readonly markerIndex: number
  readonly meta: AutoMarkerRenderMeta
}

export type AutoMarkersPlotAccess<T extends Point> = {
  markers(): readonly T[]
  renderMeta(index: number): AutoMarkerRenderMeta | null
  target(index: number): SVGElement | null
}

export class AutoMarkersInteractionSource<T extends Point = Point> {

  readonly id = Symbol('AutoMarkersInteractionSource')

  constructor(private readonly plot: AutoMarkersPlotAccess<T>) { }

  nearestPoint(options: NearestPointOptions): Selection<AutoMarkerHit<T>> {
    return new AllMarkersSelection(this).within(options).nearest()
  }

  allHits(pointer: Point, space: ChartSpace): readonly AutoMarkerHit<T>[] {
    const markers = this.plot.markers()

    const hits: AutoMarkerHit<T>[] = []
    for (let index = 0; index < markers.length; index++) {
      const hit = this.createHit(index, pointer, space)
      if (hit) hits.push(hit)
    }

    return hits
  }

  private createHit(index: number, pointer: Point, space: ChartSpace): AutoMarkerHit<T> | null {
    const datum = this.plot.markers()[index]
    const meta = this.plot.renderMeta(index)
    const target = this.plot.target(index)
    if (!datum || !meta || !target) return null

    const anchor = space.chartToLayout(datum)
    if (!Number.isFinite(anchor.x) || !Number.isFinite(anchor.y)) return null

    const distance = Math.hypot(anchor.x - pointer.x, anchor.y - pointer.y)

    return {
      kind: 'scatter-point',
      sourceId: this.id,
      datum,
      identity: { sourceId: this.id, kind: 'item', key: index },
      memberships: [],
      geometry: geometryFromPoint(anchor),
      geometryFor: () => null,
      distance,
      contains: distance <= meta.size,
      targets: [target],
      markerIndex: index,
      meta,
    }
  }
}

class AllMarkersSelection<T extends Point> extends Selection<AutoMarkerHit<T>> {

  constructor(private readonly source: AutoMarkersInteractionSource<T>) {
    super()
  }

  resolve(ctx: InteractionResolveContext): readonly AutoMarkerHit<T>[] {
    const pointer = ctx.input.pointer
    if (!pointer) return []

    return this.source.allHits(pointer.point, ctx.space)
  }
}
