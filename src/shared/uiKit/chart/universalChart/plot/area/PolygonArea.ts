import { ChartRawPattern } from '../../defs/ChartRawPattern'
import { InteractionBounds } from '../../interaction/core/InteractionGeometry'
import { ChartSpace } from '../../utils/ChartSpace'
import { Bounds, BoundsConstraint } from '../../utils/Bounds'
import { isFinitePoint, Point } from '../../utils/Point'
import { Classes } from '../../utils/utils'
import { BasePlotRenderer } from '../BasePlotRenderer'
import { PolygonAreaInteractionSource } from './PolygonAreaInteractionSource'

type ProjectedContours = {
  readonly contours: readonly Point[][]
  readonly bounds: InteractionBounds | null
}

export class PolygonArea extends BasePlotRenderer {

  protected path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  protected data: Point[][] = []
  protected cachedPath = ''

  readonly interaction: PolygonAreaInteractionSource = new PolygonAreaInteractionSource({
    contours: () => this.data,
    target: () => this.path,
    bounds: space => this.getProjectedContours(space).bounds,
  })

  private projectedCacheKey: string | null = null
  private projectedCache: ProjectedContours | null = null

  constructor(classes: Classes, options: { affectsBounds?: boolean } = {}) {
    super(classes, { affectsBounds: options.affectsBounds ?? true })
    this.root.appendChild(this.path)
  }

  protected renderImpl(space: ChartSpace): void {
    const { contours, bounds } = this.getProjectedContours(space)

    if (!bounds) {
      this.setPath('')
      return
    }

    const layoutMaxX = space.layout.x + space.layout.width
    const layoutMaxY = space.layout.y + space.layout.height

    if (bounds.maxX < space.layout.x || bounds.minX > layoutMaxX || bounds.maxY < space.layout.y || bounds.minY > layoutMaxY) {
      this.setPath('')
      return
    }

    this.setPath(contours
      .filter(contour => contour.length > 0)
      .map(contour => contour
        .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
        .join(' ') + 'Z')
      .join(' '))
  }

  setPoints(points: Point[] | Point[][]) {
    this.data = points.length > 0 && Array.isArray(points[0])
      ? points as Point[][]
      : [points as Point[]]

    this.projectedCacheKey = null
    this.projectedCache = null
    this.requestRender()
  }

  fillByPattern(pattern: ChartRawPattern) {
    pattern.fill(this.path)
    return this
  }

  protected calculateBounds(constraint?: BoundsConstraint): Bounds {
    const bounds = new Bounds()
    for (const contour of this.data) {
      for (const point of contour) bounds.addPoint(point)
    }
    if (bounds.isEmpty()) return bounds

    if (constraint && (
      bounds.maxX < (constraint.minX ?? -Infinity) ||
      bounds.minX > (constraint.maxX ?? Infinity) ||
      bounds.maxY < (constraint.minY ?? -Infinity) ||
      bounds.minY > (constraint.maxY ?? Infinity)
    )) return new Bounds()

    return bounds
  }

  protected setPath(path: string) {
    if (this.cachedPath === path) return
    this.cachedPath = path
    this.path.setAttribute('d', path)
  }

  private getProjectedContours(space: ChartSpace): ProjectedContours {
    const key = space.getHash()
    if (this.projectedCacheKey === key && this.projectedCache) return this.projectedCache

    const contours = this.data.map(contour => contour.map(point => space.chartToLayout(point)))
    const bounds = boundsOfContours(contours)

    this.projectedCacheKey = key
    this.projectedCache = { contours, bounds }
    return this.projectedCache
  }
}

function boundsOfContours(contours: readonly Point[][]): InteractionBounds | null {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  let hasPoint = false

  for (const contour of contours) {
    for (const point of contour) {
      if (!isFinitePoint(point)) return null

      hasPoint = true
      minX = Math.min(minX, point.x)
      maxX = Math.max(maxX, point.x)
      minY = Math.min(minY, point.y)
      maxY = Math.max(maxY, point.y)
    }
  }

  return hasPoint ? { minX, maxX, minY, maxY } : null
}
