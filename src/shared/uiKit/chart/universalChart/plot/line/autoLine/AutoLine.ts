import { UniversalChart, PlotRenderer } from '../../../UniversalChart'
import { Bounds } from '../../../utils/Bounds'
import { ChartSpace } from '../../../utils/ChartSpace'
import { addClasses, Classes } from '../../../utils/utils'
import { BasePlotRenderer } from '../../BasePlotRenderer'
import { monotoneXPath, smoothPath } from './utils'


const NAMESPACE = 'http://www.w3.org/2000/svg'
const DEFAULT_PRECISION = 2
const DEFAULT_SMOOTHING = 1

type Options = {
  classes?: Classes
  area?: boolean
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
          this.segments.push(currentSegment)
          currentSegment = []
        }
      }
    }
    if (currentSegment.length > 0) this.segments.push(currentSegment)

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

  renderImpl(space: ChartSpace) {
    const paths: { area?: string, line: string }[] = []
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i]
      paths.push(this.calculateSegmentPath(i, segment, space))
    }

    if (this.options.area) {
      if (!this.area) {
        this.area = document.createElementNS(NAMESPACE, 'path')
        addClasses(this.area, 'area', this.options.classes)
        this.root.appendChild(this.area)
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

  private calculateSegmentPath(lineIndex: number, points: Point[], space: ChartSpace) {
    const p = points.map(p => space.chartToLayout(p))
    const path = this.getSmoothPath(p)

    if (!this.options.area) return { line: path }

    const areaPath = path + `L ${p[p.length - 1].x} ${space.layout.y + space.layout.height + 1} L ${p[0].x} ${space.layout.y + space.layout.height + 1} Z`
    return { line: path, area: areaPath }
  }

  private getSmoothPath(points: Point[]) {

    const smoothing = this.options.smoothing ?? DEFAULT_SMOOTHING
    const precision = this.options.precision ?? DEFAULT_PRECISION

    if (this.options.smoothingMethod === 'monotone') {
      return monotoneXPath(points, smoothing, precision)
    }

    if (this.options.smoothingMethod === 'smooth' || this.options.smoothing) {
      return smoothPath(points, smoothing, precision)
    }

    const d: string[] = []
    for (let i = 0; i < points.length; i++) {
      const p = points[i]
      d.push(`${i === 0 ? 'M' : 'L'} ${p.x.toFixed(precision)} ${p.y.toFixed(precision)}`)
    }
    return d.join(' ')
  }
}
