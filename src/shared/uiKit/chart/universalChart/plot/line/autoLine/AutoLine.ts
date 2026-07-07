import { ChartGradient } from '../../../defs/ChartGradient'
import { Overflow } from '../../../UniversalChart'
import { Bounds } from '../../../utils/Bounds'
import { ChartSpace } from '../../../utils/ChartSpace'
import { addClasses, Classes } from '../../../utils/utils'
import { BasePlotRenderer } from '../../BasePlotRenderer'
import { MonotoneXPath } from './MonotoneXPath'
import { smoothPath } from './utils'


const NAMESPACE = 'http://www.w3.org/2000/svg'
const DEFAULT_PRECISION = 2
const DEFAULT_SMOOTHING = 1

type Options = {
  classes?: Classes
  area?: boolean | ChartGradient
  precision?: number
  smoothing?: number
  smoothingMethod?: 'monotone' | 'smooth'
}

type Point = { x: number, y: number }

export class AutoLine extends BasePlotRenderer {
  protected bounds: Bounds | null = null
  protected line: SVGPathElement | null = null
  protected area: SVGPathElement | null = null

  protected points: (Point | null)[] = []
  protected segments: Point[][] = []
  protected monotonePathSegments: MonotoneXPath[] = []

  constructor(readonly options: Options) {
    super(options.classes)
  }

  protected pointsDidChange() {
    this.bounds = null
    this.requestRender()
  }

  detach() {
    this.line?.remove()
    this.area?.remove()
  }

  setPoints(points: (Point | null)[]) {
    this.points = points
    this.pointsDidChange()

    this.segments = []
    let currentSegment: Point[] = []
    for (const point of points) {
      if (point) {
        currentSegment.push(point)
      } else {
        if (currentSegment.length > 0) {
          if (currentSegment.length === 1) currentSegment.push(currentSegment[0])
          this.segments.push(currentSegment)
          currentSegment = []
        }
      }
    }
    if (currentSegment.length > 0) this.segments.push(currentSegment)

    for (const path of this.monotonePathSegments) path.dispose()
    if (this.options.smoothingMethod === 'monotone')
      this.monotonePathSegments = this.segments.map(segment => new MonotoneXPath(segment))
    else this.monotonePathSegments = []

    return this
  }

  getBounds(): Bounds {
    if (this.bounds && !this.bounds.isEmpty()) return this.bounds

    this.bounds = new Bounds()
    for (const point of this.points) {
      if (point) this.bounds.addPoint(point)
    }
    return this.bounds
  }

  renderImpl(space: ChartSpace, overflow: Overflow) {
    if (space.bounds.isEmpty()) this.line?.setAttribute('d', '')

    const paths: { area?: string, line: string }[] = []
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i]
      paths.push(this.calculateSegmentPath(i, segment, space, overflow))
    }

    if (this.options.area) {
      if (!this.area) {
        this.area = document.createElementNS(NAMESPACE, 'path')
        addClasses(this.area, 'area', this.options.classes)
        this.root.appendChild(this.area)
        if (this.options.area instanceof ChartGradient) this.options.area.fill(this.area)
      }
      this.area?.setAttribute('d', paths.map(t => t.area ?? '').join(' '))
    }

    if (!this.line) {
      this.line = document.createElementNS(NAMESPACE, 'path')
      addClasses(this.line, 'line', this.options.classes)
      this.root.appendChild(this.line)
    }
    this.line?.setAttribute('d', paths.map(t => t.line).join(' '))
  }

  private calculateSegmentPath(lineIndex: number, points: Point[], space: ChartSpace, overflow: Overflow) {

    const getPath = () => {
      const smoothing = this.options.smoothing ?? DEFAULT_SMOOTHING
      const precision = this.options.precision ?? DEFAULT_PRECISION

      if (this.options.smoothingMethod === 'monotone') {
        const monotonePath = this.monotonePathSegments[lineIndex]
        const bounds = space.bounds
        const layout = { minX: space.layout.x, minY: space.layout.y, maxX: space.layout.x + space.layout.width, maxY: space.layout.y + space.layout.height }
        const layoutOverflow = {
          minX: layout.minX - overflow.left,
          maxX: layout.maxX + overflow.right,
          minY: layout.minY - overflow.top,
          maxY: layout.maxY + overflow.bottom
        }

        return monotonePath.getPath(smoothing, bounds, layout, layoutOverflow)
      }

      if (this.options.smoothingMethod === 'smooth' || this.options.smoothing) {
        const p = points.map(p => space.chartToLayout(p))
        return smoothPath(p, smoothing, precision)
      }

      const d: string[] = []
      for (let i = 0; i < points.length; i++) {
        const p = space.chartToLayout(points[i])
        d.push(`${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      }
      return d.join(' ')
    }

    const path = getPath()
    if (path === '') return { line: '' }
    if (!this.options.area) return { line: path }

    const leftPoint = Math.max(space.chartToLayout(points[0]).x, space.chartToLayoutX(space.bounds.minX) - overflow.left)
    const rightPoint = Math.min(space.chartToLayout(points[points.length - 1]).x, space.chartToLayoutX(space.bounds.maxX) + overflow.right)

    const h = space.layout.y + space.layout.height + 1

    const areaPath = path + `L ${rightPoint.toFixed(2)} ${h.toFixed(2)} L ${leftPoint.toFixed(2)} ${h.toFixed(2)} Z`
    return { line: path, area: areaPath }
  }
}
