import { Overflow, Size } from '../../../../UniversalChart'
import { ChartSpace } from '../../../../utils/ChartSpace'
import { Point } from '../../../../utils/Point'
import { addClasses, removeClasses, Classes } from '../../../../utils/utils'
import { HoveredDataPoint, isDataPointEqual } from '../../../BaseDataSourcedInteractionController'
import { InteractionDirection, Position } from '../../../baseInteractionController/BaseInteractionController'
import { InteractionController, InteractionComponent } from '../../InteractionController'
import { HoverResolver } from '../../sync/HoverSynchronizer'

type Options = {
  classes?: Classes
  offset?: number | { start?: number, end?: number } | [start: number, end: number]
  position?: 'cursor' | 'data-point-x' | 'data-point-y' | 'data-point'
  activateDistance?: number
  outOfDistanceVisibility?: boolean
  hoverSync?: HoverResolver
}

function unwrapLineOffset(offset: Options['offset']) {
  if (typeof offset === 'number') return { start: offset, end: offset }
  if (Array.isArray(offset)) return { start: offset[0], end: offset[1] }
  if (offset) return { start: offset.start ?? 0, end: offset.end ?? 0 }
  return { start: 0, end: 0 }
}

export abstract class BaseLine implements InteractionComponent {

  protected line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  protected options: Options = {}
  protected offset = { start: 0, end: 0 }
  protected position: 'cursor' | 'data-point-x' | 'data-point-y' | 'data-point' = 'cursor'
  protected controller: InteractionController | null = null

  protected lastDataPoints: HoveredDataPoint | null = null
  protected spaceHash = ''

  protected lastPoint: Point = { x: 0, y: 0 }
  protected hovered = false

  private onSyncChange = () => this.controller?.scheduleRender()

  constructor(options: Options = {}) {
    this.applyOptions(options)
  }

  attach(root: SVGGElement, controller: InteractionController): void {
    root.appendChild(this.line)
    this.controller = controller
    this.options.hoverSync?.subscribeChange(this.onSyncChange)
  }

  detach(): void {
    this.options.hoverSync?.unsubscribeChange(this.onSyncChange)
    this.line.remove()
    this.line.classList.remove('visible')
    this.controller = null
    this.hovered = false
    this.lastDataPoints = null
    this.spaceHash = ''
  }

  updateOptions(options: Options) {
    const previousSync = this.options.hoverSync
    if (previousSync !== options.hoverSync) {
      previousSync?.unsubscribeChange(this.onSyncChange)
      if (this.controller) options.hoverSync?.subscribeChange(this.onSyncChange)
    }

    this.applyOptions(options)

    this.lastDataPoints = null
    this.spaceHash = ''
    this.controller?.scheduleRender()
  }

  private applyOptions(options: Options) {
    if (this.options) removeClasses(this.line, 'hover-line', this.options.classes)

    this.options = options
    this.position = options.position ?? 'cursor'
    this.offset = unwrapLineOffset(options.offset)

    addClasses(this.line, 'hover-line', options.classes)
  }

  onHoverBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): boolean {
    if (this.position === 'cursor') this.line.classList.toggle('visible', true)
    this.hovered = true
    this.process(space, point)
    return true
  }

  onHoverEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): boolean {
    this.line.classList.toggle('visible', false)
    this.hovered = false
    this.lastDataPoints = null
    return false
  }

  onHoverUpdate(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): boolean {
    this.lastPoint = point
    return this.hovered
  }

  abstract mayHover(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): InteractionDirection

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

    if (!this.controller) return

    let nearestDataPoints: HoveredDataPoint[] = []
    if (this.position === 'data-point-x') {
      nearestDataPoints = this.controller.findNearestByAxis(point, space, 'x', true)
    } else if (this.position === 'data-point-y') {
      nearestDataPoints = this.controller.findNearestByAxis(point, space, 'y', true)
    } else if (this.position === 'data-point') {
      nearestDataPoints = this.controller.findNearest(point, space, true)
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