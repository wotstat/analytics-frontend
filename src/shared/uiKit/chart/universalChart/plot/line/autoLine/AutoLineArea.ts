import { ChartGradient } from '../../../defs/ChartGradient'
import { Overflow } from '../../../UniversalChart'
import { Bounds, BoundsConstraint } from '../../../utils/Bounds'
import { ChartSpace } from '../../../utils/ChartSpace'
import { addClasses, Classes } from '../../../utils/utils'
import { BasePlotRenderer } from '../../BasePlotRenderer'
import { LinePath, linePathWasmReady } from './linePath/LinePath'


const NAMESPACE = 'http://www.w3.org/2000/svg'

type Options = {
  classes?: Classes
  lines?: boolean
  fill?: ChartGradient
  precision?: number
  smoothing?: number
  smoothingMethod?: 'monotone' | 'smooth'
  affectsBounds?: boolean
}

type Point = { x: number, y: number }

export class AutoLineArea extends BasePlotRenderer {
  protected bounds: Bounds | null = null
  protected constrainedBounds: { key: string, bounds: Bounds } | null = null
  protected topLine: SVGPathElement | null = null
  protected bottomLine: SVGPathElement | null = null
  protected area: SVGPathElement | null = null

  protected topPoints: (Point | null)[] = []
  protected bottomPoints: (Point | null)[] = []
  protected topSegments: Point[][] = []
  protected bottomSegments: Point[][] = []
  protected topPathSegments: LinePath[] = []
  protected bottomPathSegments: LinePath[] = []

  constructor(readonly options: Options) {
    super(options.classes, { affectsBounds: options.affectsBounds ?? true })
    linePathWasmReady().then(status => {
      if (status === 'ready') this.requestRender()
    })
  }

  protected pointsDidChange() {
    this.bounds = null
    this.constrainedBounds = null
    this.requestRender()
  }

  detach() {
    super.detach()
    for (const path of this.topPathSegments) path.release()
    for (const path of this.bottomPathSegments) path.release()
    this.topLine?.remove()
    this.topLine = null
    this.bottomLine?.remove()
    this.bottomLine = null
    this.area?.remove()
    this.area = null
  }

  setPoints(top: (Point | null)[], bottom: (Point | null)[]) {
    this.topPoints = top
    this.bottomPoints = bottom
    this.pointsDidChange()

    this.topSegments = splitToSegments(top)
    this.bottomSegments = splitToSegments(bottom).map(segment => segment.reverse())

    for (const path of this.topPathSegments) path.dispose()
    for (const path of this.bottomPathSegments) path.dispose()

    this.topPathSegments = this.topSegments.map(segment => new LinePath(segment))
    this.bottomPathSegments = this.bottomSegments.map(segment => new LinePath(segment))

    return this
  }

  protected calculateBounds(constraint?: BoundsConstraint): Bounds {
    if (constraint) return this.getConstrainedBounds(constraint)

    if (this.bounds && !this.bounds.isEmpty()) return this.bounds

    this.bounds = new Bounds()
    for (const point of this.topPoints) {
      if (point) this.bounds.addPoint(point)
    }
    for (const point of this.bottomPoints) {
      if (point) this.bounds.addPoint(point)
    }
    return this.bounds
  }

  private getConstrainedBounds(constraint: BoundsConstraint): Bounds {
    const { minX = -Infinity, maxX = Infinity, minY = -Infinity, maxY = Infinity } = constraint

    const key = `${minX}_${maxX}_${minY}_${maxY}`
    if (this.constrainedBounds?.key === key) return this.constrainedBounds.bounds

    const bounds = new Bounds()
    for (const point of [...this.topPoints, ...this.bottomPoints]) {
      if (!point) continue
      if (point.x < minX || point.x > maxX || point.y < minY || point.y > maxY) continue
      bounds.addPoint(point)
    }

    this.constrainedBounds = { key, bounds }
    return bounds
  }

  renderImpl(space: ChartSpace, overflow: Overflow) {
    if (space.bounds.isEmpty()) {
      this.topLine?.setAttribute('d', '')
      this.bottomLine?.setAttribute('d', '')
      this.area?.setAttribute('d', '')
      return
    }

    const topPaths = this.topPathSegments.map(path => this.calculateSegmentPath(path, space, overflow))
    const bottomPaths = this.bottomPathSegments.map(path => this.calculateSegmentPath(path, space, overflow))

    if (!this.area) {
      this.area = document.createElementNS(NAMESPACE, 'path')
      addClasses(this.area, 'area', this.options.classes)
      this.root.appendChild(this.area)
      if (this.options.fill) this.options.fill.fill(this.area)
    }

    const areaParts: string[] = []
    const pairsCount = Math.min(topPaths.length, bottomPaths.length)
    for (let i = 0; i < pairsCount; i++) {
      const top = topPaths[i]
      const bottom = bottomPaths[i]
      if (top === '' || bottom === '') continue
      areaParts.push(`${top} L${bottom.slice(1)} Z`)
    }
    this.area.setAttribute('d', areaParts.join(' '))

    if (!this.options.lines) return

    if (!this.topLine) {
      this.topLine = document.createElementNS(NAMESPACE, 'path')
      addClasses(this.topLine, ['line', 'line-top'], this.options.classes)
      this.root.appendChild(this.topLine)
    }
    if (!this.bottomLine) {
      this.bottomLine = document.createElementNS(NAMESPACE, 'path')
      addClasses(this.bottomLine, ['line', 'line-bottom'], this.options.classes)
      this.root.appendChild(this.bottomLine)
    }

    this.topLine.setAttribute('d', topPaths.join(' '))
    this.bottomLine.setAttribute('d', bottomPaths.join(' '))
  }

  private calculateSegmentPath(path: LinePath, space: ChartSpace, overflow: Overflow): string {
    const bounds = space.bounds
    const layout = { minX: space.layout.x, minY: space.layout.y, maxX: space.layout.x + space.layout.width, maxY: space.layout.y + space.layout.height }
    const layoutOverflow = {
      minX: layout.minX - overflow.left,
      maxX: layout.maxX + overflow.right,
      minY: layout.minY - overflow.top,
      maxY: layout.maxY + overflow.bottom
    }

    const dataBounds = this.calculateBounds()
    if (!dataBounds.isEmpty()) {
      layoutOverflow.minY = Math.min(layoutOverflow.minY, space.chartToLayoutY(dataBounds.maxY) - 1)
      layoutOverflow.maxY = Math.max(layoutOverflow.maxY, space.chartToLayoutY(dataBounds.minY) + 1)
    }

    return path.getPath(this.options, bounds, layout, layoutOverflow)
  }
}

function splitToSegments(points: (Point | null)[]): Point[][] {
  const segments: Point[][] = []
  let currentSegment: Point[] = []
  for (const point of points) {
    if (point) {
      currentSegment.push(point)
    } else {
      if (currentSegment.length > 0) {
        if (currentSegment.length === 1) currentSegment.push(currentSegment[0])
        segments.push(currentSegment)
        currentSegment = []
      }
    }
  }
  if (currentSegment.length > 0) segments.push(currentSegment)
  return segments
}
