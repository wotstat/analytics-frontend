import { Size, UniversalChart } from '../../../../UniversalChart'
import { Bounds, BoundsAxes, BoundsPatch } from '../../../../utils/Bounds'
import { ChartSpace } from '../../../../utils/ChartSpace'
import { Point } from '../../../../utils/Point'
import { InteractionDirection, Position, TouchZoomPoint } from '../../../basePlotHover/BasePlotHover'
import { ComposableHover, HoverComponent } from '../../ComposableHover'


type LayoutValue = { x: number, y: number, width: number, height: number }
type AxisBounds = { min: number, max: number }
type TouchZoomAxis = 'x' | 'y'
type TouchZoomAxisMode = 'projection' | 'distance' | 'locked'

const TOUCH_ZOOM_MIN_AXIS_DISTANCE = 48
const TOUCH_ZOOM_ACTIVATE_AXIS_DISTANCE = 72
const TOUCH_ZOOM_MIN_DISTANCE = 8

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
    startFirstLayoutPoint: Point,
    startSecondLayoutPoint: Point,
    startFirstChartPoint: Point,
    startSecondChartPoint: Point,
    startMidChartPoint: Point,
    startTouchDistance: number,
    xAxisMode: TouchZoomAxisMode,
    yAxisMode: TouchZoomAxisMode,
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
    const touchZoomBounds = this.calculateTouchZoomBounds(this.touchZoomState, bounds)
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

    const layout = { ...space.layout }
    const startSpace = new ChartSpace(layout, startBounds)
    const startFirstLayoutPoint = { ...first.point }
    const startSecondLayoutPoint = { ...second.point }
    const startMidLayoutPoint = this.getMidPoint(startFirstLayoutPoint, startSecondLayoutPoint)
    this.touchZoomState = {
      layout,
      startBounds,
      startFirstLayoutPoint,
      startSecondLayoutPoint,
      startFirstChartPoint: startSpace.layoutToChart(first.point),
      startSecondChartPoint: startSpace.layoutToChart(second.point),
      startMidChartPoint: startSpace.layoutToChart(startMidLayoutPoint),
      startTouchDistance: this.getTouchDistance(startFirstLayoutPoint, startSecondLayoutPoint),
      xAxisMode: this.getTouchZoomAxisMode(startFirstLayoutPoint.x, startSecondLayoutPoint.x, layout.width),
      yAxisMode: this.getTouchZoomAxisMode(startFirstLayoutPoint.y, startSecondLayoutPoint.y, layout.height),
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
    const touchZoomBounds = this.getTouchZoomBounds(space.bounds)

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

  private getTouchZoomBounds(currentBounds: Bounds): BoundsPatch | null {
    const state = this.touchZoomState
    if (!state?.dirty) return null

    state.dirty = false
    if (state.ended) this.touchZoomState = null

    const bounds = this.calculateTouchZoomBounds(state, currentBounds)
    state.commitStartBounds = false
    return bounds
  }

  private calculateTouchZoomBounds(state = this.touchZoomState, currentBounds = state?.startBounds): BoundsPatch | null {
    if (!state) return null
    if (!currentBounds) return null
    const nextBounds: BoundsPatch = state.commitStartBounds ? state.startBounds.toPatch(this.enabledAxes) : {}
    const {
      layout,
      startBounds,
      startFirstLayoutPoint,
      startSecondLayoutPoint,
      startFirstChartPoint,
      startSecondChartPoint,
      startMidChartPoint,
      startTouchDistance,
      currentFirst,
      currentSecond,
    } = state
    const currentTouchDistance = this.getTouchDistance(currentFirst.point, currentSecond.point)
    if (startTouchDistance < TOUCH_ZOOM_MIN_DISTANCE || currentTouchDistance < TOUCH_ZOOM_MIN_DISTANCE) {
      return Bounds.isPatchValid(nextBounds) ? nextBounds : null
    }

    if (this.isXAxisEnabled() && layout.width > 0) {
      let firstPosition = this.getAxisPosition('x', currentFirst.point, layout)
      let secondPosition = this.getAxisPosition('x', currentSecond.point, layout)
      let bounds: AxisBounds | null = null

      if (state.xAxisMode === 'locked') {
        const startMidPosition = (this.getAxisPosition('x', startFirstLayoutPoint, layout) + this.getAxisPosition('x', startSecondLayoutPoint, layout)) / 2
        const currentMidPosition = (firstPosition + secondPosition) / 2
        bounds = this.solvePanAxisBounds(startBounds.minX, startBounds.maxX, startMidPosition, currentMidPosition)

        if (this.canActivateTouchZoomAxis('x', currentFirst.point, currentSecond.point, layout)) {
          this.activateTouchZoomAxis('x', state, this.getBoundsWithAxisBounds(currentBounds, 'x', bounds), firstPosition, secondPosition)
        }
      }

      if (state.xAxisMode === 'projection') {
        const startPositionDelta = this.getAxisPosition('x', startSecondLayoutPoint, layout) - this.getAxisPosition('x', startFirstLayoutPoint, layout)
        const positions = this.clampTouchZoomAxisPositions(firstPosition, secondPosition, this.getTouchZoomMinAxisDistance(layout.width) / layout.width, startPositionDelta)
        firstPosition = positions[0]
        secondPosition = positions[1]
        bounds = this.solveAxisBounds(
          startFirstChartPoint.x,
          startSecondChartPoint.x,
          firstPosition,
          secondPosition,
        )
      } else if (state.xAxisMode === 'distance') {
        bounds = this.solveDistanceAxisBounds(
          startBounds.minX,
          startBounds.maxX,
          startMidChartPoint.x,
          (firstPosition + secondPosition) / 2,
          startTouchDistance,
          currentTouchDistance,
        )
      }

      if (bounds) {
        nextBounds.minX = bounds.min
        nextBounds.maxX = bounds.max
      }
    }

    if (this.isYAxisEnabled() && layout.height > 0) {
      let firstPosition = this.getAxisPosition('y', currentFirst.point, layout)
      let secondPosition = this.getAxisPosition('y', currentSecond.point, layout)
      let bounds: AxisBounds | null = null

      if (state.yAxisMode === 'locked') {
        const startMidPosition = (this.getAxisPosition('y', startFirstLayoutPoint, layout) + this.getAxisPosition('y', startSecondLayoutPoint, layout)) / 2
        const currentMidPosition = (firstPosition + secondPosition) / 2
        bounds = this.solvePanAxisBounds(startBounds.minY, startBounds.maxY, startMidPosition, currentMidPosition)

        if (this.canActivateTouchZoomAxis('y', currentFirst.point, currentSecond.point, layout)) {
          this.activateTouchZoomAxis('y', state, this.getBoundsWithAxisBounds(currentBounds, 'y', bounds), firstPosition, secondPosition)
        }
      }

      if (state.yAxisMode === 'projection') {
        const startPositionDelta = this.getAxisPosition('y', startSecondLayoutPoint, layout) - this.getAxisPosition('y', startFirstLayoutPoint, layout)
        const positions = this.clampTouchZoomAxisPositions(firstPosition, secondPosition, this.getTouchZoomMinAxisDistance(layout.height) / layout.height, startPositionDelta)
        firstPosition = positions[0]
        secondPosition = positions[1]
        bounds = this.solveAxisBounds(
          startFirstChartPoint.y,
          startSecondChartPoint.y,
          firstPosition,
          secondPosition,
        )
      } else if (state.yAxisMode === 'distance') {
        bounds = this.solveDistanceAxisBounds(
          startBounds.minY,
          startBounds.maxY,
          startMidChartPoint.y,
          (firstPosition + secondPosition) / 2,
          startTouchDistance,
          currentTouchDistance,
        )
      }

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

  private solvePanAxisBounds(startMin: number, startMax: number, startPosition: number, currentPosition: number): AxisBounds | null {
    const range = startMax - startMin
    const positionDelta = currentPosition - startPosition
    if (!Number.isFinite(range) || !Number.isFinite(positionDelta) || range === 0) return null

    const shift = -positionDelta * range
    const min = startMin + shift
    const max = startMax + shift

    if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return null

    return min < max ? { min, max } : { min: max, max: min }
  }

  private getBoundsWithAxisBounds(bounds: Bounds, axis: TouchZoomAxis, axisBounds: AxisBounds | null): Bounds {
    if (!axisBounds) return bounds

    const nextBounds = bounds.clone()
    if (axis === 'x') {
      nextBounds.minX = axisBounds.min
      nextBounds.maxX = axisBounds.max
    } else {
      nextBounds.minY = axisBounds.min
      nextBounds.maxY = axisBounds.max
    }

    return nextBounds
  }

  private activateTouchZoomAxis(
    axis: TouchZoomAxis,
    state: NonNullable<ZoomChartComponent['touchZoomState']>,
    currentBounds: Bounds,
    firstPosition: number,
    secondPosition: number
  ): void {
    const min = axis === 'x' ? currentBounds.minX : currentBounds.minY
    const max = axis === 'x' ? currentBounds.maxX : currentBounds.maxY
    const range = max - min
    if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(range) || range === 0) return

    const firstValue = min + firstPosition * range
    const secondValue = min + secondPosition * range
    const midValue = min + ((firstPosition + secondPosition) / 2) * range
    if (!Number.isFinite(firstValue) || !Number.isFinite(secondValue) || !Number.isFinite(midValue)) return

    if (axis === 'x') {
      state.startBounds.minX = min
      state.startBounds.maxX = max
      state.startFirstLayoutPoint.x = state.currentFirst.point.x
      state.startSecondLayoutPoint.x = state.currentSecond.point.x
      state.startFirstChartPoint.x = firstValue
      state.startSecondChartPoint.x = secondValue
      state.startMidChartPoint.x = midValue
      state.xAxisMode = 'projection'
      return
    }

    state.startBounds.minY = min
    state.startBounds.maxY = max
    state.startFirstLayoutPoint.y = state.currentFirst.point.y
    state.startSecondLayoutPoint.y = state.currentSecond.point.y
    state.startFirstChartPoint.y = firstValue
    state.startSecondChartPoint.y = secondValue
    state.startMidChartPoint.y = midValue
    state.yAxisMode = 'projection'
  }

  private solveDistanceAxisBounds(
    startMin: number,
    startMax: number,
    startMidValue: number,
    currentMidPosition: number,
    startDistance: number,
    currentDistance: number
  ): AxisBounds | null {
    if (!Number.isFinite(startDistance) || !Number.isFinite(currentDistance)) return null
    if (startDistance < TOUCH_ZOOM_MIN_DISTANCE || currentDistance < TOUCH_ZOOM_MIN_DISTANCE) return null

    const zoomFactor = currentDistance / startDistance
    if (!Number.isFinite(zoomFactor) || zoomFactor <= 0) return null

    const range = (startMax - startMin) / zoomFactor
    const min = startMidValue - currentMidPosition * range
    const max = min + range

    if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return null

    return min < max ? { min, max } : { min: max, max: min }
  }

  private clampTouchZoomAxisPositions(
    firstPosition: number,
    secondPosition: number,
    minPositionDelta: number,
    fallbackPositionDelta: number
  ): [number, number] {
    const positionDelta = secondPosition - firstPosition
    if (!Number.isFinite(positionDelta) || !Number.isFinite(minPositionDelta) || minPositionDelta <= 0) return [firstPosition, secondPosition]
    if (Math.abs(positionDelta) >= minPositionDelta) return [firstPosition, secondPosition]

    const midpoint = (firstPosition + secondPosition) / 2
    if (!Number.isFinite(midpoint)) return [firstPosition, secondPosition]

    const sign = Math.sign(positionDelta) || Math.sign(fallbackPositionDelta) || 1
    const halfDelta = minPositionDelta / 2
    return [midpoint - sign * halfDelta, midpoint + sign * halfDelta]
  }

  private getTouchZoomAxisMode(firstPosition: number, secondPosition: number, axisSize: number): TouchZoomAxisMode {
    if (Math.abs(secondPosition - firstPosition) >= this.getTouchZoomMinAxisDistance(axisSize)) return 'projection'
    return this.options.panDirection === 'all' ? 'locked' : 'distance'
  }

  private getTouchZoomMinAxisDistance(axisSize: number): number {
    return Math.min(TOUCH_ZOOM_MIN_AXIS_DISTANCE, axisSize / 4)
  }

  private getTouchZoomActivateAxisDistance(axisSize: number): number {
    return Math.min(TOUCH_ZOOM_ACTIVATE_AXIS_DISTANCE, axisSize / 3)
  }

  private canActivateTouchZoomAxis(axis: TouchZoomAxis, first: Point, second: Point, layout: LayoutValue): boolean {
    const axisDistance = axis === 'x' ? Math.abs(second.x - first.x) : Math.abs(second.y - first.y)
    const axisSize = axis === 'x' ? layout.width : layout.height
    return axisDistance >= this.getTouchZoomActivateAxisDistance(axisSize)
  }

  private getTouchDistance(first: Point, second: Point): number {
    const dx = second.x - first.x
    const dy = second.y - first.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  private getMidPoint(first: Point, second: Point): Point {
    return {
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2,
    }
  }

  private getAxisPosition(axis: TouchZoomAxis, point: Point, layout: LayoutValue): number {
    if (axis === 'x') return (point.x - layout.x) / layout.width
    return 1 - (point.y - layout.y) / layout.height
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
