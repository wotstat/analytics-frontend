import { Size, UniversalChart } from '../../../../UniversalChart'
import { ChartSpace } from '../../../../utils/ChartSpace'
import { Point } from '../../../../utils/Point'
import { Position } from '../../../BasePlotHover'
import { ComposableHover, HoverComponent } from '../../ComposableHover'


type Options = {
  chart: UniversalChart
  zoomBy?: 'x' | 'y' | 'both'
}

export class ZoomChartComponent implements HoverComponent {

  protected readonly chart: UniversalChart
  protected interactiveZone: SVGRectElement | null = null
  private panState: {
    startClientX: number,
    startClientY: number,
    startBounds: { minX: number, maxX: number, minY: number, maxY: number },
    layoutWidth: number,
    layoutHeight: number
  } | null = null

  private lastCursor: Position | null = null

  constructor(private readonly options: Options) {
    this.chart = options.chart
  }

  attach(_root: SVGGElement, composable: ComposableHover): void {
    this.interactiveZone = composable.interactiveZone
    // this.interactiveZone.addEventListener('wheel', this.wheelHandler, { passive: false })
  }

  mayPan(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean {
    return true
  }

  onPanBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): void {
    const { bounds, layout } = space

    this.panState = {
      startClientX: cursor.clientX,
      startClientY: cursor.clientY,
      startBounds: {
        minX: bounds.minX,
        maxX: bounds.maxX,
        minY: bounds.minY,
        maxY: bounds.maxY,
      },
      layoutWidth: layout.width,
      layoutHeight: layout.height,
    }
  }

  onPanEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): void {
    this.panState = null
  }

  onPanMove(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): void {
    if (!this.panState) return
    this.lastCursor = cursor
  }

  onBeforeLayout(space: ChartSpace, full: Size): void {
    if (!this.panState) return
    const cursor = this.lastCursor
    if (!cursor) return

    const { startClientX, startClientY, startBounds, layoutWidth, layoutHeight } = this.panState
    const nextBounds: { minX?: number, maxX?: number, minY?: number, maxY?: number } = {}

    if (this.isXAxisEnabled() && layoutWidth > 0) {
      const rangeX = startBounds.maxX - startBounds.minX
      const shiftX = -(cursor.clientX - startClientX) * rangeX / layoutWidth
      nextBounds.minX = startBounds.minX + shiftX
      nextBounds.maxX = startBounds.maxX + shiftX
    }

    if (this.isYAxisEnabled() && layoutHeight > 0) {
      const rangeY = startBounds.maxY - startBounds.minY
      const shiftY = (cursor.clientY - startClientY) * rangeY / layoutHeight
      nextBounds.minY = startBounds.minY + shiftY
      nextBounds.maxY = startBounds.maxY + shiftY
    }

    if (Object.keys(nextBounds).length === 0) return

    this.chart.setRenderBounds(nextBounds, true)
  }

  private onWheelEvent(event: WheelEvent) {
    if (!this.interactiveZone) return

    event.preventDefault()
    event.stopPropagation()

    const { deltaY } = event

    const zoomFactor = 1 - deltaY * -0.001

    const bounds = this.chart.space.bounds

    const interactiveZoneRect = this.interactiveZone.getBoundingClientRect()

    const dX = event.clientX - interactiveZoneRect.left
    const dY = event.clientY - interactiveZoneRect.top

    this.chart.setRenderBounds({
      ...(this.isXAxisEnabled() ? {
        minX: bounds.minX + (dX / interactiveZoneRect.width) * (1 - zoomFactor) * (bounds.maxX - bounds.minX),
        maxX: bounds.maxX - (1 - dX / interactiveZoneRect.width) * (1 - zoomFactor) * (bounds.maxX - bounds.minX),
      } : {}),
      ...(this.isYAxisEnabled() ? {
        minY: bounds.minY + (dY / interactiveZoneRect.height) * (1 - zoomFactor) * (bounds.maxY - bounds.minY),
        maxY: bounds.maxY - (1 - dY / interactiveZoneRect.height) * (1 - zoomFactor) * (bounds.maxY - bounds.minY),
      } : {}),
    })
  }

  private isXAxisEnabled() {
    return this.options.zoomBy !== 'y'
  }

  private isYAxisEnabled() {
    return this.options.zoomBy === 'y' || this.options.zoomBy === 'both'
  }
}
