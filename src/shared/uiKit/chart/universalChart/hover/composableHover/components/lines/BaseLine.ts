import { Overflow, Size } from '../../../../UniversalChart'
import { ChartSpace } from '../../../../utils/ChartSpace'
import { Point } from '../../../../utils/Point'
import { addClasses, Classes } from '../../../../utils/utils'
import { HoveredDataPoint, isDataPointEqual } from '../../../BaseDataSourcedPlotHover'
import { InteractionDirection, Position } from '../../../basePlotHover/BasePlotHover'
import { ComposableHover, HoverComponent } from '../../ComposableHover'
import { HoverResolver } from '../../sync/HoverSynchronizer'

type Options = {
  classes?: Classes
  offset?: number | { start?: number, end?: number } | [start: number, end: number]
  position?: 'cursor' | 'data-point-x' | 'data-point-y' | 'data-point'
  activateDistance?: number
  outOfDistanceVisibility?: boolean
  hoverSync?: HoverResolver
}

export abstract class BaseLine implements HoverComponent {

  protected line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  protected offset: { start: number, end: number }
  protected position: 'cursor' | 'data-point-x' | 'data-point-y' | 'data-point'
  protected composable: ComposableHover | null = null

  protected lastDataPoints: HoveredDataPoint | null = null
  protected spaceHash = ''

  protected lastPoint: Point = { x: 0, y: 0 }
  protected hovered = false

  private onSyncChange = () => this.composable?.scheduleRender()

  constructor(protected options: Options = {}) {
    addClasses(this.line, 'hover-line', 'vertical', options.classes)
    this.position = options.position ?? 'cursor'

    if (typeof options.offset === 'number') {
      this.offset = { start: options.offset, end: options.offset }
    } else if (Array.isArray(options.offset)) {
      this.offset = { start: options.offset[0], end: options.offset[1] }
    } else if (options.offset) {
      this.offset = { start: options.offset.start ?? 0, end: options.offset.end ?? 0 }
    } else {
      this.offset = { start: 0, end: 0 }
    }
  }

  attach(root: SVGGElement, composable: ComposableHover): void {
    root.appendChild(this.line)
    this.composable = composable
    this.options.hoverSync?.subscribeChange(this.onSyncChange)
  }

  detach(): void {
    this.options.hoverSync?.unsubscribeChange(this.onSyncChange)
  }

  onHoverBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean {
    if (this.position === 'cursor') this.line.classList.toggle('visible', true)
    this.hovered = true
    this.process(space, point)
    return true
  }

  onHoverEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean {
    this.line.classList.toggle('visible', false)
    this.hovered = false
    this.lastDataPoints = null
    return false
  }

  onHoverUpdate(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean {
    this.lastPoint = point
    return this.hovered
  }

  abstract mayHover(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): InteractionDirection

  render(space: ChartSpace, overflow: Overflow, full: Size): void {
    const point = this.hovered ? this.lastPoint : (this.options.hoverSync?.resolve(space) ?? null)
    if (!point) {
      this.line.classList.toggle('visible', false)
      this.lastDataPoints = null
      return
    }
    if (this.position === 'cursor') this.line.classList.toggle('visible', true)
    this.process(space, point)
  }

  protected process(space: ChartSpace, point: Point = this.lastPoint) {
    this.lastPoint = point

    if (this.position === 'cursor') {
      this.setLinePosition(point, space)
      return
    }

    if (!this.composable) return

    let nearestDataPoints: HoveredDataPoint[] = []
    if (this.position === 'data-point-x') {
      nearestDataPoints = this.composable.findNearestByAxis(point, space, 'x', true)
    } else if (this.position === 'data-point-y') {
      nearestDataPoints = this.composable.findNearestByAxis(point, space, 'y', true)
    } else if (this.position === 'data-point') {
      nearestDataPoints = this.composable.findNearest(point, space, true)
    }

    nearestDataPoints = nearestDataPoints.filter(p => p.distance <= (this.options.activateDistance ?? Infinity))
    if (this.options.outOfDistanceVisibility && nearestDataPoints.length === 0) {
      this.setLinePosition(point, space)
      this.line.classList.toggle('visible', true)
      this.lastDataPoints = null
      return
    }

    if (nearestDataPoints.length === 0) {
      this.line.classList.toggle('visible', false)
      this.lastDataPoints = null
      return
    }

    const nearest = nearestDataPoints[0]

    const spaceHash = space.getHash()
    if (this.spaceHash === space.getHash() && this.lastDataPoints && isDataPointEqual(nearest, this.lastDataPoints)) return
    this.spaceHash = spaceHash

    if (!this.lastDataPoints) this.line.classList.toggle('visible', true)
    this.lastDataPoints = nearest

    if (this.position === 'data-point') {
      this.setLinePosition(space.chartToLayout({ x: nearest.xValue, y: nearest.yValue }), space)
      return
    }

    if (this.position === 'data-point-x') {
      this.setLinePosition(space.chartToLayout({ x: nearest.xValue, y: point.y }), space)
      return
    }

    if (this.position === 'data-point-y') {
      this.setLinePosition(space.chartToLayout({ x: point.x, y: nearest.yValue }), space)
      return
    }
  }

  abstract setLinePosition(point: Point, space: ChartSpace): void

}