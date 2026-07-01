import { Overflow, Size } from '../../../../UniversalChart'
import { ChartSpace } from '../../../../utils/ChartSpace'
import { Point } from '../../../../utils/Point'
import { HoveredDataPoint, Position } from '../../../BasePlotHover'
import { ComposableHover, HoverComponent } from '../../ComposableHover'

export type TooltipCtx = {
  pivot: Point,
  absolutePivot: Point,
  cursor: Position,
  absoluteCursor: Point,
  nearestDataPoints: HoveredDataPoint[]
  isTouch: boolean
}

type Options = {
  position?: 'data-point-x' | 'data-point-y' | 'data-point' | 'nearest-data-point'
  tooltipPivot?: 'avg' | 'nearest' | 'cursor'
  activateDistance?: number
  onShow?: (ctx: TooltipCtx) => void
  onPositionChange?: (ctx: TooltipCtx) => void
  onHide?: () => void
}

export class ChartTooltip implements HoverComponent {
  private lastNearestDataPoints: HoveredDataPoint[] | null = null
  private windowScroll = { x: 0, y: 0 }
  private composable: ComposableHover | null = null
  private lastPoint: Point | null = null
  private lastCursor: Position | null = null
  private lastIsTouch = false
  private hovered = false

  constructor(protected options: Options = {}) {
  }

  attach(root: SVGGElement, composable: ComposableHover): void {
    this.composable = composable
  }

  onHoverBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): void {
    this.hovered = true
  }

  onHoverEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): void {
    if (this.lastNearestDataPoints && this.lastNearestDataPoints.length > 0) {
      this.options.onHide?.()
      this.lastNearestDataPoints = null
    }

    this.hovered = false
  }

  onBeforeLayout(space: ChartSpace, full: Size): void {
    this.windowScroll = { x: window.scrollX, y: window.scrollY }
  }

  onHoverMove(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean {
    this.lastPoint = point
    this.lastCursor = cursor
    this.lastIsTouch = isTouch
    return this.hovered
  }

  render(space: ChartSpace, overflow: Overflow, full: Size): void {
    if (!this.hovered) return

    let nearestDataPoints: HoveredDataPoint[]

    const point = this.lastPoint
    const cursor = this.lastCursor
    const composable = this.composable
    if (!composable || !cursor || !point) return

    if (this.options.position === 'data-point-x') {
      const dp = composable.findNearestByAxis(point, space, 'x', true)
      nearestDataPoints = dp.filter(p => p.xValue === dp[0].xValue)
    } else if (this.options.position === 'data-point-y') {
      const dp = composable.findNearestByAxis(point, space, 'y', true)
      nearestDataPoints = dp.filter(p => p.yValue === dp[0].yValue)
    } else {
      nearestDataPoints = composable.findNearest(point, space, true)
      if (this.options.position === 'nearest-data-point' && nearestDataPoints.length > 1) nearestDataPoints = [nearestDataPoints[0]]
    }

    nearestDataPoints = nearestDataPoints.filter(p => p.distance <= (this.options.activateDistance ?? Infinity))

    if (this.lastNearestDataPoints && this.lastNearestDataPoints.length > 0 && nearestDataPoints.length == 0) {
      this.options.onHide?.()
      this.lastNearestDataPoints = null
      return
    }

    if (nearestDataPoints.length === 0) {
      this.lastNearestDataPoints = null
      return
    }

    let pivot = { x: cursor.clientX, y: cursor.clientY }

    if (this.options.tooltipPivot === 'nearest') {
      let nearest = nearestDataPoints[0]

      if (this.options.position !== 'data-point') {
        let minDistance = Infinity
        for (const dp of nearestDataPoints) {
          const dpLayout = space.chartToLayout({ x: dp.xValue, y: dp.yValue })

          const distance = Math.pow(dpLayout.x - point.x, 2) + Math.pow(dpLayout.y - point.y, 2)
          if (distance < minDistance) {
            minDistance = distance
            nearest = dp
          }
        }
      }

      pivot = composable.chartToPage({
        x: space.chartToLayoutX(nearest.xValue),
        y: space.chartToLayoutY(nearest.yValue)
      })

    } else if (this.options.tooltipPivot === 'avg') {
      const avg = nearestDataPoints.reduce((acc, p) => {
        acc.x += p.xValue
        acc.y += p.yValue
        return acc
      }, { x: 0, y: 0 })

      avg.x /= nearestDataPoints.length
      avg.y /= nearestDataPoints.length

      pivot = composable.chartToPage({
        x: space.chartToLayoutX(avg.x),
        y: space.chartToLayoutY(avg.y)
      })
    }

    const ctx = {
      pivot: pivot,
      absolutePivot: {
        x: pivot.x + this.windowScroll.x,
        y: pivot.y + this.windowScroll.y
      },
      cursor: cursor,
      absoluteCursor: {
        x: cursor.clientX + this.windowScroll.x,
        y: cursor.clientY + this.windowScroll.y
      },
      nearestDataPoints,
      isTouch: this.lastIsTouch
    }

    if (!this.lastNearestDataPoints && nearestDataPoints.length > 0) this.options.onShow?.(ctx)
    this.options.onPositionChange?.(ctx)


    this.lastNearestDataPoints = nearestDataPoints
  }
}