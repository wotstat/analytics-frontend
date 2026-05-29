import { ChartSpace } from '../../../../../utils/ChartSpace'
import { Point } from '../../../../../utils/Point'
import { addClasses, Classes } from '../../../../../utils/utils'
import { HoveredDataPoint, isDataPointArrayEqual, isDataPointEqual } from '../../../BasePlotHover'
import { ComposableHover, HoverComponent } from '../../ComposableHover'

type Options = {
  classes?: Classes
  offset?: number | { start?: number, end?: number } | [start: number, end: number]
  position?: 'cursor' | 'data-point-x' | 'data-point-y' | 'data-point'

}

export abstract class BaseLine implements HoverComponent {

  protected line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
  protected offset: { start: number, end: number }
  protected position: 'cursor' | 'data-point-x' | 'data-point-y' | 'data-point'

  protected lastDataPoints: HoveredDataPoint | null = null
  protected spaceHash = ''

  constructor(options: Options = {}) {
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

  attach(root: SVGGElement): void {
    root.appendChild(this.line)
  }

  onEnter(point: Point, space: ChartSpace, composable: ComposableHover): void {
    if (this.position === 'cursor') this.line.classList.add('visible')
    this.process(point, space, composable)
  }

  onLeave(point: Point, space: ChartSpace, composable: ComposableHover): void {
    this.line.classList.remove('visible')
    this.lastDataPoints = null
  }

  onPositionChange(point: Point, space: ChartSpace, composable: ComposableHover) {
    this.process(point, space, composable)
  }

  protected process(point: Point, space: ChartSpace, composable: ComposableHover) {
    if (this.position === 'cursor') {
      this.setLinePosition(point, space)
      return
    }

    let nearestDataPoints: HoveredDataPoint[] = []
    if (this.position === 'data-point-x') {
      nearestDataPoints = composable.findNearestByAxis(point, space, 'x', true)
    } else if (this.position === 'data-point-y') {
      nearestDataPoints = composable.findNearestByAxis(point, space, 'y', true)
    } else if (this.position === 'data-point') {
      nearestDataPoints = composable.findNearest(point, space, true)
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