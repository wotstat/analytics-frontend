import { ChartSpace } from '../../../../../utils/ChartSpace'
import { Point } from '../../../../../utils/Point'
import { HoveredDataPoint, isDataPointArrayEqual } from '../../../BasePlotHover'
import { ComposableHover, HoverComponent } from '../../ComposableHover'


type TooltipCtx = {
  pivot: {
    x: number
    y: number
  },
  cursor: {
    x: number
    y: number
  },
  nearestDataPoints: HoveredDataPoint[]
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

  constructor(protected options: Options = {}) {
  }

  onLeave(cursor: Point, point: Point, space: ChartSpace, composable: ComposableHover): void {
    if (this.lastNearestDataPoints && this.lastNearestDataPoints.length > 0) {
      this.options.onHide?.()
      this.lastNearestDataPoints = null
    }
  }

  onPositionChange(cursor: Point, point: Point, space: ChartSpace, composable: ComposableHover): void {
    let nearestDataPoints: HoveredDataPoint[]

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

    let pivot = { x: cursor.x, y: cursor.y }

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
      cursor: cursor,
      nearestDataPoints
    }

    if (!this.lastNearestDataPoints && nearestDataPoints.length > 0) this.options.onShow?.(ctx)
    this.options.onPositionChange?.(ctx)


    this.lastNearestDataPoints = nearestDataPoints
  }

  // protected 
}