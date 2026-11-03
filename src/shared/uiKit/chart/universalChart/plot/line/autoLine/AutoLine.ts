import { ChartGradient } from '../../../defs/ChartGradient'
import { Overflow, UniversalChart } from '../../../UniversalChart'
import { Bounds, BoundsConstraint } from '../../../utils/Bounds'
import { ChartSpace } from '../../../utils/ChartSpace'
import { Point } from '../../../utils/Point'
import { addClasses, Classes } from '../../../utils/utils'
import { InteractionTag } from '../../../interaction/core/InteractionSource'
import { BasePlotRenderer } from '../../BasePlotRenderer'
import { AutoLineInteractionSource, StrokeGeometry } from './AutoLineInteractionSource'
import { StrokeProjection, StrokeSubpath } from './utils/LineStrokeSampler'
import { LinePath, linePathWasmReady } from './linePath/LinePath'


const NAMESPACE = 'http://www.w3.org/2000/svg'

type Options = {
  classes?: Classes
  color?: string
  interactionTag?: InteractionTag
  area?: boolean | ChartGradient
  precision?: number
  smoothing?: number
  smoothingMethod?: 'monotone' | 'smooth'
  affectsBounds?: boolean
}

export class AutoLine<T extends Point = Point> extends BasePlotRenderer {
  protected bounds: Bounds | null = null
  protected constrainedBounds: { key: string, bounds: Bounds } | null = null
  protected line: SVGPathElement | null = null
  protected area: SVGPathElement | null = null

  protected points: (T | null)[] = []
  protected segments: Point[][] = []
  protected pathSegments: LinePath[] = []

  private renderedPaths: LinePath[] = []
  private strokeSubpaths: readonly StrokeSubpath[] | null = null
  private strokeHalfWidth = 0
  private color: string | undefined

  readonly interaction: AutoLineInteractionSource<T>

  constructor(readonly options: Options) {
    super(options.classes, { affectsBounds: options.affectsBounds ?? true })
    this.color = options.color
    this.interaction = new AutoLineInteractionSource<T>(
      () => this.points,
      () => this.getStrokeGeometry(),
      () => this.line ? [this.line] : [],
      options.interactionTag
    )

    this.awaitWasmReady()
  }

  private async awaitWasmReady() {
    const status = await linePathWasmReady()
    if (status !== 'ready') return
    this.requestRender()
  }

  protected pointsDidChange() {
    this.bounds = null
    this.constrainedBounds = null
    this.requestRender()
  }

  attach(root: SVGGElement, chart: UniversalChart): void {
    super.attach(root, chart)

    if (this.options.area && !this.area) {
      this.area = document.createElementNS(NAMESPACE, 'path')
      addClasses(this.area, 'area', this.options.classes)
      this.area.style.color = this.color ?? ''
      this.root.appendChild(this.area)
      if (this.options.area instanceof ChartGradient) this.options.area.fill(this.area)
    }

    if (!this.line) {
      this.line = document.createElementNS(NAMESPACE, 'path')
      addClasses(this.line, 'line', this.options.classes)
      this.line.style.color = this.color ?? ''
      this.root.appendChild(this.line)
    }
  }

  detach() {
    super.detach()
    for (const path of this.pathSegments) path.release()
    this.renderedPaths = []
    this.strokeSubpaths = null
    this.line?.remove()
    this.line = null
    this.area?.remove()
    this.area = null
  }

  private getStrokeGeometry(): StrokeGeometry {
    return {
      getSubpaths: () => {
        if (!this.strokeSubpaths)
          this.strokeSubpaths = this.renderedPaths.flatMap(path => {
            const subpath = path.getSubpath()
            return subpath ? [subpath] : []
          })
        return this.strokeSubpaths
      },
      nearestPoint: (point, margin) => this.nearestStrokePoint(point, margin),
      target: this.line,
      halfWidth: this.strokeHalfWidth
    }
  }

  private nearestStrokePoint(point: Point, margin: number): StrokeProjection | null {
    let best: StrokeProjection | null = null
    for (let i = 0; i < this.renderedPaths.length; i++) {
      const projection = this.renderedPaths[i].nearestPoint(point, margin)
      if (projection && (!best || projection.distance < best.distance)) best = { ...projection, subpathIndex: i }
    }
    return best
  }

  protected beforeLayoutImpl(): void {
    // Read the animated CSS width before any chart mutates its SVG in this frame.
    const width = this.line ? parseFloat(getComputedStyle(this.line).strokeWidth) : 0
    this.strokeHalfWidth = (Number.isFinite(width) ? width : 0) / 2
  }

  getPoints(): readonly (T | null)[] {
    return this.points
  }

  setColor(color?: string) {
    if (this.color === color) return this

    this.color = color
    if (this.line) this.line.style.color = color ?? ''
    if (this.area) this.area.style.color = color ?? ''
    return this
  }

  setPoints(points: (T | null)[]) {
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
    if (currentSegment.length > 0) {
      // A zero-length segment lets stroke-linecap render an isolated point.
      if (currentSegment.length === 1) currentSegment.push(currentSegment[0])
      this.segments.push(currentSegment)
    }

    for (const path of this.pathSegments) path.dispose()
    this.pathSegments = this.segments.map(segment => new LinePath(segment))

    return this
  }

  protected calculateBounds(constraint?: BoundsConstraint): Bounds {
    if (constraint) return this.getConstrainedBounds(constraint)

    if (this.bounds && !this.bounds.isEmpty()) return this.bounds

    this.bounds = new Bounds()
    for (const point of this.points) {
      if (point) this.bounds.addPoint(point)
    }
    return this.bounds
  }

  private getConstrainedBounds(constraint: BoundsConstraint): Bounds {
    const { minX = -Infinity, maxX = Infinity, minY = -Infinity, maxY = Infinity } = constraint

    const key = `${minX}_${maxX}_${minY}_${maxY}`
    if (this.constrainedBounds?.key === key) return this.constrainedBounds.bounds

    const bounds = new Bounds()
    for (const point of this.points) {
      if (!point) continue
      if (point.x < minX || point.x > maxX || point.y < minY || point.y > maxY) continue
      bounds.addPoint(point)
    }

    this.constrainedBounds = { key, bounds }
    return bounds
  }

  renderImpl(space: ChartSpace, overflow: Overflow) {
    this.renderedPaths = []
    this.strokeSubpaths = null
    if (space.bounds.isEmpty()) {
      this.line?.setAttribute('d', '')
      this.area?.setAttribute('d', '')
      return
    }

    const paths: { area?: string, line: string }[] = []
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i]
      paths.push(this.calculateSegmentPath(i, segment, space, overflow))
    }

    this.area?.setAttribute('d', paths.map(t => t.area ?? '').join(' '))
    this.line?.setAttribute('d', paths.map(t => t.line).join(' '))
  }

  private calculateSegmentPath(lineIndex: number, points: Point[], space: ChartSpace, overflow: Overflow) {

    const bounds = space.bounds
    const layout = { minX: space.layout.x, minY: space.layout.y, maxX: space.layout.x + space.layout.width, maxY: space.layout.y + space.layout.height }
    const layoutOverflow = {
      minX: layout.minX - overflow.left,
      maxX: layout.maxX + overflow.right,
      minY: layout.minY - overflow.top,
      maxY: layout.maxY + overflow.bottom
    }

    if (this.options.area) {
      const dataBounds = this.calculateBounds()
      if (!dataBounds.isEmpty()) {
        layoutOverflow.minY = Math.min(layoutOverflow.minY, space.chartToLayoutY(dataBounds.maxY) - 1)
        layoutOverflow.maxY = Math.max(layoutOverflow.maxY, space.chartToLayoutY(dataBounds.minY) + 1)
      }
    }

    const segment = this.pathSegments[lineIndex]
    const path = segment.getPath(this.options, bounds, layout, layoutOverflow)
    if (path === '') return { line: '' }
    this.renderedPaths.push(segment)
    if (!this.options.area) return { line: path }

    const leftPoint = Math.max(space.chartToLayout(points[0]).x, space.chartToLayoutX(space.bounds.minX) - overflow.left)
    const rightPoint = Math.min(space.chartToLayout(points[points.length - 1]).x, space.chartToLayoutX(space.bounds.maxX) + overflow.right)

    const h = space.layout.y + space.layout.height + 1

    const areaPath = path + `L ${rightPoint.toFixed(2)} ${h.toFixed(2)} L ${leftPoint.toFixed(2)} ${h.toFixed(2)} Z`
    return { line: path, area: areaPath }
  }
}
