import { Size, UniversalChart } from '../../../../UniversalChart'
import { Bounds, BoundsAxes, BoundsPatch } from '../../../../utils/Bounds'
import { ChartSpace } from '../../../../utils/ChartSpace'
import { Point } from '../../../../utils/Point'
import { InteractionDirection, Position, TouchZoomPoint } from '../../../basePlotHover/BasePlotHover'
import { ComposableHover, HoverComponent } from '../../ComposableHover'


type LayoutValue = { x: number, y: number, width: number, height: number }
type AxisBounds = { min: number, max: number }

type Options = {
  chart: UniversalChart
  zoom?: boolean
  panDirection?: InteractionDirection
}

export class ZoomChartComponent implements HoverComponent {

  protected readonly chart: UniversalChart
  private panState: {
    startClientX: number,
    startClientY: number,
    startBounds: Bounds,
    layoutWidth: number,
    layoutHeight: number
    ended: boolean
  } | null = null

  private lastCursor: Position | null = null
  private pendingWheelZooms: {
    deltaY: number,
    point: Point,
    layout: LayoutValue
  }[] = []
  private touchZoomState: {
    layout: LayoutValue,
    startBounds: Bounds,
    startFirstChartPoint: Point,
    startSecondChartPoint: Point,
    currentFirst: TouchZoomPoint,
    currentSecond: TouchZoomPoint,
    commitStartBounds: boolean
    dirty: boolean
    ended: boolean
  } | null = null

  constructor(private readonly options: Options) {
    this.chart = options.chart
  }

  //#region Pan

  mayPan(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): InteractionDirection {
    return this.options.panDirection ?? false
  }

  onPanBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean {
    const { bounds, layout } = space
    const startBounds = bounds.clone()
    const touchZoomBounds = this.calculateTouchZoomBounds()
    if (touchZoomBounds) startBounds.patch(touchZoomBounds)

    this.panState = {
      startClientX: cursor.clientX,
      startClientY: cursor.clientY,
      startBounds,
      layoutWidth: layout.width,
      layoutHeight: layout.height,
      ended: false,
    }

    return true
  }

  onPanUpdate(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean {
    if (!this.panState) return false
    this.lastCursor = cursor
    this.panState.ended = false
    return true
  }

  onPanEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean {
    if (!this.panState) {
      this.lastCursor = null
      return false
    }

    this.lastCursor = cursor
    this.panState.ended = true
    return true
  }

  //#endregion

  //#region Touch Zoom

  mayTouchZoom(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace, composable: ComposableHover): InteractionDirection {
    return this.isZoomEnabled() && this.options.panDirection ? this.options.panDirection : false
  }

  onTouchZoomBegin(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace, composable: ComposableHover): boolean {
    if (!this.isZoomEnabled()) return false

    const startBounds = space.bounds.clone()
    this.applyPan(startBounds)

    this.panState = null
    this.lastCursor = null
    this.pendingWheelZooms = []

    const startSpace = new ChartSpace({ ...space.layout }, startBounds)
    this.touchZoomState = {
      layout: { ...space.layout },
      startBounds,
      startFirstChartPoint: startSpace.layoutToChart(first.point),
      startSecondChartPoint: startSpace.layoutToChart(second.point),
      currentFirst: first,
      currentSecond: second,
      commitStartBounds: true,
      dirty: true,
      ended: false,
    }

    return true
  }

  onTouchZoomUpdate(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace, composable: ComposableHover): boolean {
    if (!this.touchZoomState) return false

    this.touchZoomState.currentFirst = first
    this.touchZoomState.currentSecond = second
    this.touchZoomState.dirty = true

    return true
  }

  onTouchZoomEnd(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace, composable: ComposableHover): boolean {
    if (!this.touchZoomState) return false

    this.touchZoomState.currentFirst = first
    this.touchZoomState.currentSecond = second
    this.touchZoomState.dirty = true
    this.touchZoomState.ended = true

    return false
  }

  //#endregion

  //#region Wheel Zoom

  onWheelZoom(cursor: Position, point: Point, space: ChartSpace, deltaY: number, deltaX: number, composable: ComposableHover): boolean {
    if (!this.isZoomEnabled()) return false

    this.pendingWheelZooms.push({
      deltaY,
      point,
      layout: { ...space.layout },
    })

    return true
  }

  //#endregion

  onBeforeLayout(space: ChartSpace, full: Size): void {
    const nextBounds = space.bounds.clone()
    const touchZoomBounds = this.getTouchZoomBounds()

    if (touchZoomBounds) {
      nextBounds.patch(touchZoomBounds)
      this.pendingWheelZooms = []
    }

    const panChanged = this.applyPan(nextBounds)
    const wheelChanged = touchZoomBounds ? false : this.applyWheel(nextBounds)
    if (!touchZoomBounds && !panChanged && !wheelChanged) return

    const patch = nextBounds.toPatch(this.enabledAxes)
    if (Bounds.isPatchValid(patch) && !space.bounds.isEqualToPatch(patch)) this.chart.setRenderBounds(patch, true)
  }

  private applyPan(bounds: Bounds): boolean {
    const state = this.panState
    if (!state) return false

    const cursor = this.lastCursor
    if (!cursor) return false

    this.lastCursor = null

    const patch: BoundsPatch = {}

    if (this.isXAxisEnabled() && state.layoutWidth > 0) {
      const rangeX = state.startBounds.maxX - state.startBounds.minX
      const shiftX = -(cursor.clientX - state.startClientX) * rangeX / state.layoutWidth
      patch.minX = state.startBounds.minX + shiftX
      patch.maxX = state.startBounds.maxX + shiftX
    }

    if (this.isYAxisEnabled() && state.layoutHeight > 0) {
      const rangeY = state.startBounds.maxY - state.startBounds.minY
      const shiftY = (cursor.clientY - state.startClientY) * rangeY / state.layoutHeight
      patch.minY = state.startBounds.minY + shiftY
      patch.maxY = state.startBounds.maxY + shiftY
    }

    if (!Bounds.isPatchValid(patch)) {
      if (state.ended) {
        this.panState = null
        this.lastCursor = null
      }
      return false
    }

    bounds.patch(patch)

    if (state.ended) {
      this.panState = null
      this.lastCursor = null
    } else {
      state.startClientX = cursor.clientX
      state.startClientY = cursor.clientY
      state.startBounds = bounds.clone()
    }

    return true
  }

  private applyWheel(bounds: Bounds): boolean {
    if (this.pendingWheelZooms.length === 0) return false

    let changed = false

    for (const zoom of this.pendingWheelZooms) {
      const zoomFactor = 1 + zoom.deltaY * 0.001
      if (!Number.isFinite(zoomFactor) || zoomFactor <= 0) continue

      const patch: BoundsPatch = {}
      const { layout, point } = zoom

      if (this.isXAxisEnabled() && layout.width > 0) {
        const tX = (point.x - layout.x) / layout.width
        const rangeX = bounds.maxX - bounds.minX
        patch.minX = bounds.minX + tX * (1 - zoomFactor) * rangeX
        patch.maxX = bounds.maxX - (1 - tX) * (1 - zoomFactor) * rangeX
      }

      if (this.isYAxisEnabled() && layout.height > 0) {
        const tY = (point.y - layout.y) / layout.height
        const rangeY = bounds.maxY - bounds.minY
        patch.minY = bounds.minY + (1 - tY) * (1 - zoomFactor) * rangeY
        patch.maxY = bounds.maxY - tY * (1 - zoomFactor) * rangeY
      }

      if (Bounds.isPatchValid(patch)) {
        bounds.patch(patch)
        changed = true
      }
    }

    this.pendingWheelZooms = []

    if (changed && this.panState) this.panState.startBounds = bounds.clone()
    return changed
  }

  private getTouchZoomBounds(): BoundsPatch | null {
    const state = this.touchZoomState
    if (!state?.dirty) return null

    state.dirty = false
    if (state.ended) this.touchZoomState = null

    const bounds = this.calculateTouchZoomBounds(state)
    state.commitStartBounds = false
    return bounds
  }

  private calculateTouchZoomBounds(state = this.touchZoomState): BoundsPatch | null {
    if (!state) return null
    const nextBounds: BoundsPatch = state.commitStartBounds ? state.startBounds.toPatch(this.enabledAxes) : {}
    const { layout, startFirstChartPoint, startSecondChartPoint, currentFirst, currentSecond } = state

    if (this.isXAxisEnabled() && layout.width > 0) {
      const firstPosition = (currentFirst.point.x - layout.x) / layout.width
      const secondPosition = (currentSecond.point.x - layout.x) / layout.width
      const bounds = this.solveAxisBounds(
        startFirstChartPoint.x,
        startSecondChartPoint.x,
        firstPosition,
        secondPosition,
      )

      if (bounds) {
        nextBounds.minX = bounds.min
        nextBounds.maxX = bounds.max
      }
    }

    if (this.isYAxisEnabled() && layout.height > 0) {
      const firstPosition = 1 - (currentFirst.point.y - layout.y) / layout.height
      const secondPosition = 1 - (currentSecond.point.y - layout.y) / layout.height
      const bounds = this.solveAxisBounds(
        startFirstChartPoint.y,
        startSecondChartPoint.y,
        firstPosition,
        secondPosition,
      )

      if (bounds) {
        nextBounds.minY = bounds.min
        nextBounds.maxY = bounds.max
      }
    }

    return Bounds.isPatchValid(nextBounds) ? nextBounds : null
  }

  private solveAxisBounds(firstValue: number, secondValue: number, firstPosition: number, secondPosition: number): AxisBounds | null {
    const positionDelta = secondPosition - firstPosition
    if (!Number.isFinite(positionDelta) || Math.abs(positionDelta) < 0.0001) return null

    const range = (secondValue - firstValue) / positionDelta
    const min = firstValue - firstPosition * range
    const max = min + range

    if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return null

    return min < max ? { min, max } : { min: max, max: min }
  }

  private isZoomEnabled() {
    return (this.options.zoom ?? false) && (this.isXAxisEnabled() || this.isYAxisEnabled())
  }

  private get enabledAxes(): BoundsAxes {
    return {
      x: this.isXAxisEnabled(),
      y: this.isYAxisEnabled(),
    }
  }

  private isXAxisEnabled() {
    return this.options.panDirection == 'horizontal' || this.options.panDirection == 'all'
  }

  private isYAxisEnabled() {
    return this.options.panDirection === 'vertical' || this.options.panDirection === 'all'
  }
}
