import { Overflow, Size } from '../../../../UniversalChart'
import { ChartSpace } from '../../../../utils/ChartSpace'
import { Point } from '../../../../utils/Point'
import { addClasses, Classes } from '../../../../utils/utils'
import { HoveredDataPoint, isDataPointEqual, Position } from '../../../BasePlotHover'
import { ComposableHover, HoverComponent } from '../../ComposableHover'

type Options = {
  classes?: Classes
  offset?: number | { start?: number, end?: number } | [start: number, end: number]
  position?: 'cursor' | 'data-point-x' | 'data-point-y' | 'data-point'
  activateDistance?: number
  outOfDistanceVisibility?: boolean
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
  }

  onHoverBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): void {
    if (this.position === 'cursor') this.line.classList.add('visible')
    this.hovered = true
    this.process(space, point)
  }

  onHoverEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): void {
    this.line.classList.remove('visible')
    this.hovered = false
    this.lastDataPoints = null
  }

  onHoverMove(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover) {
    this.lastPoint = point
  }

  render(space: ChartSpace, overflow: Overflow, full: Size): void {
    this.process(space)
  }

  protected process(space: ChartSpace, point: Point = this.lastPoint) {
    this.lastPoint = point
    if (!this.hovered) return

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
      this.line.classList.add('visible')
      this.lastDataPoints = null
      return
    }

    if (nearestDataPoints.length === 0) {
      this.line.classList.remove('visible')
      this.lastDataPoints = null
      return
    }

    const nearest = nearestDataPoints[0]

    const spaceHash = space.getHash()
    if (this.spaceHash === space.getHash() && this.lastDataPoints && isDataPointEqual(nearest, this.lastDataPoints)) return
    this.spaceHash = spaceHash

    if (!this.lastDataPoints) this.line.classList.add('visible')
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