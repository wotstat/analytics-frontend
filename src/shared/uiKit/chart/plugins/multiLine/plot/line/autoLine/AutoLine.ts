import { MultiLineChart, PlotRenderer } from '../../../MultiLine'
import { Bounds } from '../../../utils/Bounds'
import { ChartSpace } from '../../../utils/ChartSpace'
import { monotoneXPath, smoothPath } from './utils'


const NAMESPACE = 'http://www.w3.org/2000/svg'
const DEFAULT_PRECISION = 2
const DEFAULT_SMOOTHING = 1

type Options = {
  classes?: string[]
  area?: boolean
  precision?: number
  smoothing?: number
  smoothingMethod?: 'monotone' | 'smooth'
}

type Point = { x: number, y: number }

export class AutoLine implements PlotRenderer {
  protected multiLine: MultiLineChart | null = null
  protected bounds: Bounds | null = null
  protected isDirty = true

  protected root = document.createElementNS(NAMESPACE, 'g')
  protected lines: SVGPathElement[] = []
  protected areas: SVGPathElement[] = []

  protected points: (Point | null)[] = []
  protected segments: Point[][] = []

  private lastRenderedBoundsHash = ''

  constructor(readonly options: Options) {
  }

  protected pointsDidChange() {
    this.isDirty = true
    this.bounds = null
    this.multiLine?.dataDidChange()
  }

  attach(root: SVGGElement, multiLine: MultiLineChart) {
    this.multiLine = multiLine
    root.appendChild(this.root)
  }

  detach() {
    for (const line of this.lines) line.remove()
    for (const area of this.areas) area.remove()
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

  render(space: ChartSpace) {
    if (!this.isDirty && this.lastRenderedBoundsHash === space.getHash()) return
    this.isDirty = false
    this.lastRenderedBoundsHash = space.getHash()

    this.prepareRender()

    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i]
      this.drawSegment(i, segment, space)
    }
  }

  private drawSegment(lineIndex: number, points: Point[], space: ChartSpace) {
    const line = this.lines[lineIndex]
    const p = points.map(p => space.chartToLayout(p))
    const path = this.getSmoothPath(p)
    line.setAttribute('d', path)

    if (this.options.area) {
      const area = this.areas[lineIndex]

      const areaPath = path + `L ${p[p.length - 1].x} ${space.layout.y + space.layout.height + 1} L ${p[0].x} ${space.layout.y + space.layout.height + 1} Z`
      area.setAttribute('d', areaPath)
    }
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

  private prepareRender() {

    if (this.options.area) {
      for (let i = this.segments.length; i < this.areas.length; i++) this.areas[i].remove()
      this.areas = this.areas.slice(0, this.segments.length)

      for (let i = this.areas.length; i < this.segments.length; i++) {
        const area = document.createElementNS(NAMESPACE, 'path')
        area.classList.add('area', ...(this.options.classes ?? []))
        this.areas.push(area)
        this.root.appendChild(area)
      }
    }

    for (let i = this.segments.length; i < this.lines.length; i++) this.lines[i].remove()
    this.lines = this.lines.slice(0, this.segments.length)

    for (let i = this.lines.length; i < this.segments.length; i++) {
      const line = document.createElementNS(NAMESPACE, 'path')
      line.classList.add('line', ...(this.options.classes ?? []))
      this.lines.push(line)
      this.root.appendChild(line)
    }
  }
}
