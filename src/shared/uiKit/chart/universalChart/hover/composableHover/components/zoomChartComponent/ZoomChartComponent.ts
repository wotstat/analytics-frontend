import { Size, UniversalChart } from '../../../../UniversalChart'
import { Bounds, BoundsAxes, BoundsPatch } from '../../../../utils/Bounds'
import { ChartSpace } from '../../../../utils/ChartSpace'
import { Point } from '../../../../utils/Point'
import { InteractionDirection, Position, TouchZoomPoint } from '../../../basePlotHover/BasePlotHover'
import { ComposableHover, HoverComponent } from '../../ComposableHover'


type Options = {
  chart: UniversalChart
  zoom?: boolean
  panDirection?: InteractionDirection
  deceleration?: {
    mousePan?: number,
    touchPan?: number,
    touchZoom?: number
  }
  limits?: {
    minX?: number
    minY?: number
    maxX?: number
    maxY?: number
    minDeltaX?: number
    minDeltaY?: number
    maxDeltaX?: number
    maxDeltaY?: number
    elastic?: boolean
  }
}

export class ZoomChartComponent implements HoverComponent {

  protected readonly chart: UniversalChart

  constructor(private readonly options: Options) {
    this.chart = options.chart
  }

  mayPan(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): InteractionDirection {
    return this.options.panDirection ?? false
  }

  onPanBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean {
    return true
  }

  onPanUpdate(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean {
    return true
  }

  onPanEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean {
    return true
  }

  mayTouchZoom(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace, composable: ComposableHover): InteractionDirection {
    return this.options.zoom ? this.options.panDirection ?? false : false
  }

  onTouchZoomBegin(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace, composable: ComposableHover): boolean {
    return true
  }

  onTouchZoomEnd(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace, composable: ComposableHover): boolean {
    return false
  }

  onWheelZoom(cursor: Position, point: Point, space: ChartSpace, deltaY: number, deltaX: number, composable: ComposableHover): boolean {
    return true
  }

  onBeforeLayout(space: ChartSpace, full: Size): void {
  }
}
