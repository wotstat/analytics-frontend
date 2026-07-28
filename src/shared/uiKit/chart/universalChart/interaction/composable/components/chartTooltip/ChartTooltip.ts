import { Overflow, Size } from '../../../../UniversalChart'
import { ChartSpace } from '../../../../utils/ChartSpace'
import { Point } from '../../../../utils/Point'
import { HoveredDataPoint } from '../../../BaseDataSourcedInteractionController'
import { InteractionDirection, Position } from '../../../baseInteractionController/BaseInteractionController'
import { InteractionController, InteractionComponent } from '../../InteractionController'
import { HoverResolver } from '../../sync/HoverSynchronizer'

export type TooltipCtx = {
  pivot: Point,
  absolutePivot: Point,
  cursor: Position,
  absoluteCursor: Point,
  nearestDataPoints: HoveredDataPoint[]
  chartBox: { top: number, right: number, bottom: number, left: number }
  absoluteChartBox: { top: number, right: number, bottom: number, left: number }
  isTouch: boolean
}

type Options = {
  position?: 'data-point-x' | 'data-point-y' | 'data-point' | 'nearest-data-point'
  tooltipPivot?: 'avg' | 'nearest' | 'cursor'
  activateDistance?: number
  onShow?: (ctx: TooltipCtx) => void
  onPositionChange?: (ctx: TooltipCtx) => void
  onHide?: () => void
  hoverSync?: HoverResolver
}

export class ChartTooltip implements InteractionComponent {
  private lastNearestDataPoints: HoveredDataPoint[] | null = null
  private windowScroll = { x: 0, y: 0 }
  private controller: InteractionController | null = null
  private lastPoint: Point | null = null
  private lastCursor: Position | null = null
  private lastIsTouch = false
  private hovered = false

  private onSyncChange = () => this.controller?.scheduleRender()

  constructor(protected options: Options = {}) {
  }

  attach(root: SVGGElement, controller: InteractionController): void {
    this.controller = controller
    this.options.hoverSync?.subscribeChange(this.onSyncChange)
  }

  detach(): void {
    this.options.hoverSync?.unsubscribeChange(this.onSyncChange)
    this.clear()
    this.controller = null
    this.hovered = false
  }

  updateOptions(options: Options) {
    const previousSync = this.options.hoverSync
    if (previousSync !== options.hoverSync) {
      previousSync?.unsubscribeChange(this.onSyncChange)
      if (this.controller) options.hoverSync?.subscribeChange(this.onSyncChange)
    }

    this.clear()
    this.options = options
    this.controller?.scheduleRender()
  }

  onHoverBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): boolean {
    this.hovered = true
    this.lastPoint = point
    this.lastCursor = cursor
    this.lastIsTouch = isTouch
    return true
  }

  onHoverEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): boolean {
    if (this.lastNearestDataPoints && this.lastNearestDataPoints.length > 0) {
      this.options.onHide?.()
      this.lastNearestDataPoints = null
    }

    this.hovered = false
    return false
  }

  onBeforeLayout(space: ChartSpace, full: Size): void {
    this.windowScroll = { x: window.scrollX, y: window.scrollY }
  }

  onHoverUpdate(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): boolean {
    this.lastPoint = point
    this.lastCursor = cursor
    this.lastIsTouch = isTouch
    return this.hovered
  }

  mayHover(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, controller: InteractionController): InteractionDirection {
    const direction = {
      'data-point-x': 'horizontal',
      'data-point-y': 'vertical',
      'data-point': 'all',
      'nearest-data-point': 'all'
    } as const

    return direction[this.options.position ?? 'data-point-x']
  }

  render(space: ChartSpace, overflow: Overflow, full: Size): void {
    const controller = this.controller
    const point = this.hovered ? this.lastPoint : (this.options.hoverSync?.resolve(space) ?? null)
    if (!controller || !point) {
      this.clear()
      return
    }

    let cursor = this.hovered && this.lastCursor
      ? this.lastCursor
      : this.syntheticCursor(controller, point)
    const isTouch = this.hovered ? this.lastIsTouch : (this.options.hoverSync?.isTouch ?? false)

    let nearestDataPoints: HoveredDataPoint[]

    if (this.options.position === 'data-point-x') {
      const dp = controller.findNearestByAxis(point, space, 'x', true)
      nearestDataPoints = dp.length ? dp.filter(p => p.xValue === dp[0].xValue) : []
    } else if (this.options.position === 'data-point-y') {
      const dp = controller.findNearestByAxis(point, space, 'y', true)
      nearestDataPoints = dp.length ? dp.filter(p => p.yValue === dp[0].yValue) : []
    } else {
      nearestDataPoints = controller.findNearest(point, space, true)
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

      pivot = controller.chartToPage({
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

      pivot = controller.chartToPage({
        x: space.chartToLayoutX(avg.x),
        y: space.chartToLayoutY(avg.y)
      })
    }

    // If the hover is not active, we use the pivot point as the cursor position
    if (!this.hovered) cursor = { clientX: pivot.x, clientY: pivot.y, offsetX: 0, offsetY: 0 }

    const layoutTopLeft = controller.chartToPage({ x: space.layout.x, y: space.layout.y })
    const layoutBottomRight = controller.chartToPage({ x: space.layout.x + space.layout.width, y: space.layout.y + space.layout.height })
    const layoutBox = {
      top: layoutTopLeft.y,
      right: layoutBottomRight.x,
      bottom: layoutBottomRight.y,
      left: layoutTopLeft.x
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
      isTouch,
      chartBox: layoutBox,
      absoluteChartBox: {
        top: layoutBox.top + this.windowScroll.y,
        right: layoutBox.right + this.windowScroll.x,
        bottom: layoutBox.bottom + this.windowScroll.y,
        left: layoutBox.left + this.windowScroll.x
      }
    }

    if (!this.lastNearestDataPoints && nearestDataPoints.length > 0) this.options.onShow?.(ctx)
    this.options.onPositionChange?.(ctx)


    this.lastNearestDataPoints = nearestDataPoints
  }

  private clear(): void {
    if (this.lastNearestDataPoints && this.lastNearestDataPoints.length > 0) this.options.onHide?.()
    this.lastNearestDataPoints = null
  }

  private syntheticCursor(controller: InteractionController, point: Point): Position {
    const page = controller.chartToPage(point)
    return { clientX: page.x, clientY: page.y, offsetX: 0, offsetY: 0 }
  }
}