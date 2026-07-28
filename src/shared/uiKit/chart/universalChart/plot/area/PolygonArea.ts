import { ChartRawPattern } from '../../defs/ChartRawPattern'
import { Overflow, Size } from '../../UniversalChart'
import { ChartSpace } from '../../utils/ChartSpace'
import { Bounds, BoundsConstraint } from '../../utils/Bounds'
import { Point } from '../../utils/Point'
import { Classes } from '../../utils/utils'
import { BasePlotRenderer } from '../BasePlotRenderer'

export class PolygonArea extends BasePlotRenderer {

  protected path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  protected data: Point[][] = []
  protected cachedPath = ''

  constructor(classes: Classes, options: { affectsBounds?: boolean } = {}) {
    super(classes, { affectsBounds: options.affectsBounds ?? true })
    this.root.appendChild(this.path)
  }

  protected renderImpl(space: ChartSpace, overflow: Overflow, full: Size): void {
    const contours = this.data.map(contour => contour.map(point => space.chartToLayout(point)))
    const points = contours.flat()

    if (points.length > 0) {
      let minX = Infinity
      let maxX = -Infinity
      let minY = Infinity
      let maxY = -Infinity

      for (const point of points) {
        minX = Math.min(minX, point.x)
        maxX = Math.max(maxX, point.x)
        minY = Math.min(minY, point.y)
        maxY = Math.max(maxY, point.y)
      }

      const layoutMaxX = space.layout.x + space.layout.width
      const layoutMaxY = space.layout.y + space.layout.height

      if (maxX < space.layout.x || minX > layoutMaxX || maxY < space.layout.y || minY > layoutMaxY) {
        this.setPath('')
        return
      }
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
}
