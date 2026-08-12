import { geometryFromRanges, InteractionBounds } from '../../interaction/core/InteractionGeometry'
import { InteractionHit, InteractionSource } from '../../interaction/core/InteractionHit'
import { InteractionResolveContext } from '../../interaction/core/InteractionResolver'
import { Selection } from '../../interaction/core/Selection'
import { ChartSpace } from '../../utils/ChartSpace'
import { Point } from '../../utils/Point'

const ITEM_KEY = 'polygon'

export type PolygonHit = InteractionHit<readonly Point[][], 'polygon'>

export type PolygonPlotAccess = {
  contours(): readonly Point[][]
  target(): SVGPathElement
  bounds(space: ChartSpace): InteractionBounds | null
}

export class PolygonAreaInteractionSource implements InteractionSource {

  constructor(private readonly plot: PolygonPlotAccess) { }

  contains(): Selection<PolygonHit> {
    return new PolygonContainsSelection(this)
  }

  hitAt(pointer: Point, space: ChartSpace): PolygonHit | null {
    const target = this.plot.target()

    if (!target.getAttribute('d')) return null
    if (!target.isPointInFill({ x: pointer.x, y: pointer.y })) return null

    const bounds = this.plot.bounds(space)
    if (!bounds) return null

    const anchor = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 }

    return {
      kind: 'polygon',
      source: this,
      datum: this.plot.contours(),
      identity: { source: this, kind: 'item', key: ITEM_KEY },
      memberships: [],
      geometry: geometryFromRanges(anchor, [bounds.minX, bounds.maxX], [bounds.minY, bounds.maxY]),
      geometryFor: () => null,
      distance: 0,
      contains: true,
      targets: [target],
    }
  }
}

class PolygonContainsSelection extends Selection<PolygonHit> {

  constructor(private readonly source: PolygonAreaInteractionSource) {
    super()
  }

  resolve(ctx: InteractionResolveContext): readonly PolygonHit[] {
    const pointer = ctx.input.pointer
    if (!pointer) return []

    const hit = this.source.hitAt(pointer.point, ctx.space)
    return hit ? [hit] : []
  }
}
