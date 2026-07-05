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
type BoundsPatchKey = keyof BoundsPatch
type DecelerationOptions = {
  mousePan?: number,
  touchPan?: number,
  touchZoom?: number
}
type InertiaKind = keyof DecelerationOptions
type PanInertiaKind = Exclude<InertiaKind, 'touchZoom'>
type BoundsVelocity = BoundsPatch
type TouchZoomVelocity = {
  centerX?: number,
  logRangeX?: number,
  centerY?: number,
  logRangeY?: number
}
type InertiaStateBase = {
  deceleration: number,
  startTime: number,
  lastElapsed: number
}
type InertiaState = InertiaStateBase & (
  { kind: PanInertiaKind, velocity: BoundsVelocity } |
  { kind: 'touchZoom', velocity: TouchZoomVelocity }
)
type ProjectionAxisPoints = {
  firstValue: number,
  secondValue: number,
  firstPosition: number,
  secondPosition: number,
  startPositionDelta: number
}

const TOUCH_ZOOM_MIN_AXIS_DISTANCE = 48
const TOUCH_ZOOM_ACTIVATE_AXIS_DISTANCE = 72
const TOUCH_ZOOM_MIN_DISTANCE = 8
const DEFAULT_DECELERATION = 0.98
const MIN_VELOCITY_SAMPLE_DT = 1 / 60
const INPUT_STOP_TIMEOUT = 0.1
const INERTIA_MIN_REMAINING_PIXELS = 0.05
const BOUNDS_PATCH_KEYS: BoundsPatchKey[] = ['minX', 'maxX', 'minY', 'maxY']

type Options = {
  chart: UniversalChart
  zoom?: boolean
  panDirection?: InteractionDirection
  deceleration?: DecelerationOptions
}

export class ZoomChartComponent implements HoverComponent {

  protected readonly chart: UniversalChart
  private panState: {
    startClientX: number,
    startClientY: number,
    startBounds: Bounds,
    layoutWidth: number,
    layoutHeight: number
    isTouch: boolean,
    suppressInertia: boolean,
    lastSampleClientX: number,
    lastSampleClientY: number,
    lastSampleTime: number,
    velocity: BoundsVelocity | null,
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
    updateTime: number,
    lastBoundsSample: BoundsPatch | null,
    lastBoundsSampleTime: number | null,
    velocity: TouchZoomVelocity | null,
    inertiaCanceled: boolean,
    dirty: boolean
    ended: boolean
  } | null = null
  private inertia: InertiaState | null = null
  private pendingTouchZoomInertia: InertiaState | null = null

  constructor(private readonly options: Options) {
    this.chart = options.chart
  }

  //#region Pan

  mayPan(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): InteractionDirection {
    return this.options.panDirection ?? false
  }

  onPanBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean {
    const keepTouchZoomInertia = isTouch && (this.touchZoomState?.ended ?? false)
    if (!keepTouchZoomInertia) this.stopInertia()

    const { bounds, layout } = space
    const startBounds = bounds.clone()
    const touchZoomBounds = this.calculateTouchZoomBounds(this.touchZoomState, bounds)
    if (touchZoomBounds) startBounds.patch(touchZoomBounds)

    const time = this.getNow()
    this.panState = {
      startClientX: cursor.clientX,
      startClientY: cursor.clientY,
      startBounds,
      layoutWidth: layout.width,
      layoutHeight: layout.height,
      isTouch,
      suppressInertia: keepTouchZoomInertia,
      lastSampleClientX: cursor.clientX,
      lastSampleClientY: cursor.clientY,
      lastSampleTime: time,
      velocity: null,
      ended: false,
    }

    return true
  }

  onPanUpdate(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean {
    if (!this.panState) return false
    if (isTouch) {
      if (!this.panState.suppressInertia) this.cancelTouchZoomInertia()
    } else {
      this.stopInertia()
    }
    if (!this.panState.suppressInertia) this.inertia = null
    this.recordPanVelocity(cursor)
    this.lastCursor = cursor
    this.panState.ended = false
    return true
  }

  onPanEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean {
    if (!this.panState) {
      this.lastCursor = null
      return false
    }

    this.recordPanVelocity(cursor)
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

    this.stopInertia()

    const startBounds = space.bounds.clone()
    this.applyPan(startBounds)
    this.inertia = null

    this.panState = null
    this.lastCursor = null
    this.pendingWheelZooms = []

    const layout = { ...space.layout }
    const startSpace = new ChartSpace(layout, startBounds)
    const startFirstLayoutPoint = { ...first.point }
    const startSecondLayoutPoint = { ...second.point }
    const startMidLayoutPoint = this.getMidPoint(startFirstLayoutPoint, startSecondLayoutPoint)
    const time = this.getNow()
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
      updateTime: time,
      lastBoundsSample: null,
      lastBoundsSampleTime: null,
      velocity: null,
      inertiaCanceled: false,
      dirty: true,
      ended: false,
    }

    return true
  }

  onTouchZoomUpdate(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace, composable: ComposableHover): boolean {
    if (!this.touchZoomState) return false

    this.touchZoomState.currentFirst = first
    this.touchZoomState.currentSecond = second
    this.touchZoomState.updateTime = this.getNow()
    this.touchZoomState.dirty = true
    this.sampleTouchZoomVelocity(this.touchZoomState, space.bounds)

    return true
  }

  onTouchZoomEnd(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace, composable: ComposableHover): boolean {
    if (!this.touchZoomState) return false

    this.touchZoomState.currentFirst = first
    this.touchZoomState.currentSecond = second
    this.touchZoomState.updateTime = this.getNow()
    this.touchZoomState.dirty = true
    this.touchZoomState.ended = true
    this.sampleTouchZoomVelocity(this.touchZoomState, space.bounds)

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
    this.stopInertia()

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
    this.activatePendingTouchZoomInertia()

    const directChanged = !!touchZoomBounds || panChanged || wheelChanged
    const inertiaChanged = this.applyInertia(nextBounds, space.layout)
    if (inertiaChanged && this.panState && !this.panState.ended) this.panState.startBounds = nextBounds.clone()
    if (!directChanged && !inertiaChanged) {
      if (this.inertia) this.chart.scheduleRender()
      return
    }

    const patch = nextBounds.toPatch(this.enabledAxes)
    if (Bounds.isPatchValid(patch) && !space.bounds.isEqualToPatch(patch)) this.chart.setRenderBounds(patch, true)
    if (this.inertia) this.chart.scheduleRender()
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
      if (!state.suppressInertia) this.startPanInertia(state.isTouch ? 'touchPan' : 'mousePan', state.velocity)
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
    if (bounds) this.recordTouchZoomVelocity(state, bounds)
    state.commitStartBounds = false
    if (state.ended && !state.inertiaCanceled && bounds) this.queueTouchZoomInertia(state.velocity)
    return bounds
  }

  private getNow(): number {
    return performance.now()
  }

  private stopInertia(): void {
    this.inertia = null
    this.pendingTouchZoomInertia = null
  }

  private cancelTouchZoomInertia(): void {
    this.pendingTouchZoomInertia = null
    if (this.touchZoomState?.ended) this.touchZoomState.inertiaCanceled = true
  }

  private recordPanVelocity(cursor: Position): void {
    const state = this.panState
    if (!state) return

    const time = this.getNow()
    const dt = (time - state.lastSampleTime) / 1000
    const dx = cursor.clientX - state.lastSampleClientX
    const dy = cursor.clientY - state.lastSampleClientY
    const moved = dx !== 0 || dy !== 0

    if (moved && dt >= MIN_VELOCITY_SAMPLE_DT) {
      const velocity: BoundsVelocity = {}

      if (this.isXAxisEnabled() && state.layoutWidth > 0) {
        const rangeX = state.startBounds.maxX - state.startBounds.minX
        const shiftX = -dx * rangeX / state.layoutWidth
        velocity.minX = shiftX / dt
        velocity.maxX = shiftX / dt
      }

      if (this.isYAxisEnabled() && state.layoutHeight > 0) {
        const rangeY = state.startBounds.maxY - state.startBounds.minY
        const shiftY = dy * rangeY / state.layoutHeight
        velocity.minY = shiftY / dt
        velocity.maxY = shiftY / dt
      }

      state.velocity = this.filterVelocity(velocity)
    } else if (dt > INPUT_STOP_TIMEOUT) {
      state.velocity = null
    } else if (moved) {
      return
    }

    state.lastSampleClientX = cursor.clientX
    state.lastSampleClientY = cursor.clientY
    state.lastSampleTime = time
  }

  private recordTouchZoomVelocity(
    state: NonNullable<ZoomChartComponent['touchZoomState']>,
    bounds: BoundsPatch
  ): void {
    const sample = this.copyPatch(bounds)
    const time = state.updateTime

    if (!state.lastBoundsSample || state.lastBoundsSampleTime === null) {
      state.lastBoundsSample = sample
      state.lastBoundsSampleTime = time
      return
    }

    const dt = (time - state.lastBoundsSampleTime) / 1000
    const changed = this.hasPatchDelta(state.lastBoundsSample, sample)

    if (changed && dt >= MIN_VELOCITY_SAMPLE_DT) {
      state.velocity = this.getTouchZoomVelocity(state.lastBoundsSample, sample, dt)
    } else if (dt > INPUT_STOP_TIMEOUT) {
      state.velocity = null
    } else if (changed) {
      return
    }

    state.lastBoundsSample = sample
    state.lastBoundsSampleTime = time
  }

  private sampleTouchZoomVelocity(
    state: NonNullable<ZoomChartComponent['touchZoomState']>,
    currentBounds: Bounds
  ): void {
    const bounds = this.calculateTouchZoomBounds(state, currentBounds)
    if (bounds) this.recordTouchZoomVelocity(state, bounds)
  }

  private startPanInertia(kind: PanInertiaKind, velocity: BoundsVelocity | null): void {
    this.inertia = this.createPanInertia(kind, velocity)
  }

  private queueTouchZoomInertia(velocity: TouchZoomVelocity | null): void {
    this.pendingTouchZoomInertia = this.createTouchZoomInertia(velocity)
  }

  private activatePendingTouchZoomInertia(): void {
    if (!this.pendingTouchZoomInertia) return

    const inertia = this.pendingTouchZoomInertia
    inertia.lastElapsed = Math.max(0, (this.getNow() - inertia.startTime) / 1000)
    this.inertia = inertia
    this.pendingTouchZoomInertia = null
  }

  private createPanInertia(kind: PanInertiaKind, velocity: BoundsVelocity | null): InertiaState | null {
    const deceleration = this.getDeceleration(kind)
    if (deceleration === null) return null

    const filteredVelocity = this.filterVelocity(velocity)
    if (!filteredVelocity) return null

    return {
      kind,
      deceleration,
      velocity: filteredVelocity,
      startTime: this.getNow(),
      lastElapsed: 0,
    }
  }

  private createTouchZoomInertia(velocity: TouchZoomVelocity | null): InertiaState | null {
    const deceleration = this.getDeceleration('touchZoom')
    if (deceleration === null) return null

    const filteredVelocity = this.filterTouchZoomVelocity(velocity)
    if (!filteredVelocity) return null

    return {
      kind: 'touchZoom',
      deceleration,
      velocity: filteredVelocity,
      startTime: this.getNow(),
      lastElapsed: 0,
    }
  }

  private applyInertia(bounds: Bounds, layout: LayoutValue): boolean {
    const state = this.inertia
    if (!state) return false

    const elapsed = Math.max(0, (this.getNow() - state.startTime) / 1000)
    if (elapsed <= state.lastElapsed) return false

    const previousOffset = this.getDecelerationOffset(state.deceleration, state.lastElapsed)
    const nextOffset = this.getDecelerationOffset(state.deceleration, elapsed)
    const offsetDelta = nextOffset - previousOffset
    state.lastElapsed = elapsed

    if (state.kind === 'touchZoom') return this.applyTouchZoomInertia(bounds, layout, state, offsetDelta, elapsed)

    const patch: BoundsPatch = {}
    this.patchInertiaAxis(bounds, patch, 'x', offsetDelta, state.velocity.minX, state.velocity.maxX)
    this.patchInertiaAxis(bounds, patch, 'y', offsetDelta, state.velocity.minY, state.velocity.maxY)

    if (!Bounds.isPatchValid(patch)) {
      this.inertia = null
      return false
    }

    const changed = !bounds.isEqualToPatch(patch)
    bounds.patch(patch)

    if (!this.shouldContinueInertia(state, bounds, layout, elapsed)) this.inertia = null
    return changed
  }

  private patchInertiaAxis(
    bounds: Bounds,
    patch: BoundsPatch,
    axis: TouchZoomAxis,
    offsetDelta: number,
    minVelocity: number | undefined,
    maxVelocity: number | undefined
  ): void {
    if (axis === 'x') {
      if (!this.isXAxisEnabled()) return
      if (Number.isFinite(minVelocity)) patch.minX = bounds.minX + minVelocity! * offsetDelta
      if (Number.isFinite(maxVelocity)) patch.maxX = bounds.maxX + maxVelocity! * offsetDelta
      return
    }

    if (!this.isYAxisEnabled()) return
    if (Number.isFinite(minVelocity)) patch.minY = bounds.minY + minVelocity! * offsetDelta
    if (Number.isFinite(maxVelocity)) patch.maxY = bounds.maxY + maxVelocity! * offsetDelta
  }

  private applyTouchZoomInertia(
    bounds: Bounds,
    layout: LayoutValue,
    state: Extract<InertiaState, { kind: 'touchZoom' }>,
    offsetDelta: number,
    elapsed: number
  ): boolean {
    const patch: BoundsPatch = {}
    this.patchTouchZoomInertiaAxis(bounds, patch, 'x', offsetDelta, state.velocity.centerX, state.velocity.logRangeX)
    this.patchTouchZoomInertiaAxis(bounds, patch, 'y', offsetDelta, state.velocity.centerY, state.velocity.logRangeY)

    if (!Bounds.isPatchValid(patch)) {
      this.inertia = null
      return false
    }

    const changed = !bounds.isEqualToPatch(patch)
    bounds.patch(patch)

    if (!this.shouldContinueTouchZoomInertia(state, bounds, layout, elapsed)) this.inertia = null
    return changed
  }

  private patchTouchZoomInertiaAxis(
    bounds: Bounds,
    patch: BoundsPatch,
    axis: TouchZoomAxis,
    offsetDelta: number,
    centerVelocity: number | undefined,
    logRangeVelocity: number | undefined
  ): void {
    if (axis === 'x') {
      if (!this.isXAxisEnabled()) return

      const nextBounds = this.getTouchZoomInertiaAxisBounds(
        bounds.minX,
        bounds.maxX,
        centerVelocity,
        logRangeVelocity,
        offsetDelta,
      )
      if (!nextBounds) return

      patch.minX = nextBounds.min
      patch.maxX = nextBounds.max
      return
    }

    if (!this.isYAxisEnabled()) return

    const nextBounds = this.getTouchZoomInertiaAxisBounds(
      bounds.minY,
      bounds.maxY,
      centerVelocity,
      logRangeVelocity,
      offsetDelta,
    )
    if (!nextBounds) return

    patch.minY = nextBounds.min
    patch.maxY = nextBounds.max
  }

  private getTouchZoomInertiaAxisBounds(
    min: number,
    max: number,
    centerVelocity: number | undefined,
    logRangeVelocity: number | undefined,
    offsetDelta: number
  ): AxisBounds | null {
    if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return null
    if (!Number.isFinite(centerVelocity) && !Number.isFinite(logRangeVelocity)) return null

    const range = max - min
    const center = (min + max) / 2
    const nextCenter = center + (Number.isFinite(centerVelocity) ? centerVelocity! * offsetDelta : 0)
    const nextRange = range * Math.exp(Number.isFinite(logRangeVelocity) ? logRangeVelocity! * offsetDelta : 0)
    if (!Number.isFinite(nextCenter) || !Number.isFinite(nextRange) || nextRange === 0) return null

    const nextMin = nextCenter - nextRange / 2
    const nextMax = nextCenter + nextRange / 2
    if (!Number.isFinite(nextMin) || !Number.isFinite(nextMax) || nextMin === nextMax) return null

    return nextMin < nextMax ? { min: nextMin, max: nextMax } : { min: nextMax, max: nextMin }
  }

  private shouldContinueInertia(
    state: Extract<InertiaState, { kind: PanInertiaKind }>,
    bounds: Bounds,
    layout: LayoutValue,
    elapsed: number
  ): boolean {
    const remainingOffset = this.getRemainingDecelerationOffset(state.deceleration, elapsed)
    let maxRemainingPixels = 0
    let hasVelocity = false

    if (this.isXAxisEnabled() && layout.width > 0) {
      const rangeX = bounds.maxX - bounds.minX
      if (Number.isFinite(rangeX) && rangeX !== 0) {
        const scaleX = layout.width / Math.abs(rangeX)
        for (const key of ['minX', 'maxX'] as const) {
          const velocity = state.velocity[key]
          if (!Number.isFinite(velocity)) continue
          hasVelocity = true
          maxRemainingPixels = Math.max(maxRemainingPixels, Math.abs(velocity! * remainingOffset) * scaleX)
        }
      }
    }

    if (this.isYAxisEnabled() && layout.height > 0) {
      const rangeY = bounds.maxY - bounds.minY
      if (Number.isFinite(rangeY) && rangeY !== 0) {
        const scaleY = layout.height / Math.abs(rangeY)
        for (const key of ['minY', 'maxY'] as const) {
          const velocity = state.velocity[key]
          if (!Number.isFinite(velocity)) continue
          hasVelocity = true
          maxRemainingPixels = Math.max(maxRemainingPixels, Math.abs(velocity! * remainingOffset) * scaleY)
        }
      }
    }

    return hasVelocity && maxRemainingPixels >= INERTIA_MIN_REMAINING_PIXELS
  }

  private shouldContinueTouchZoomInertia(
    state: Extract<InertiaState, { kind: 'touchZoom' }>,
    bounds: Bounds,
    layout: LayoutValue,
    elapsed: number
  ): boolean {
    const remainingOffset = this.getRemainingDecelerationOffset(state.deceleration, elapsed)
    let maxRemainingPixels = 0
    let hasVelocity = false

    if (this.isXAxisEnabled() && layout.width > 0) {
      const remaining = this.getTouchZoomAxisRemainingPixels(
        bounds.minX,
        bounds.maxX,
        layout.width,
        state.velocity.centerX,
        state.velocity.logRangeX,
        remainingOffset,
      )
      if (remaining !== null) {
        hasVelocity = true
        maxRemainingPixels = Math.max(maxRemainingPixels, remaining)
      }
    }

    if (this.isYAxisEnabled() && layout.height > 0) {
      const remaining = this.getTouchZoomAxisRemainingPixels(
        bounds.minY,
        bounds.maxY,
        layout.height,
        state.velocity.centerY,
        state.velocity.logRangeY,
        remainingOffset,
      )
      if (remaining !== null) {
        hasVelocity = true
        maxRemainingPixels = Math.max(maxRemainingPixels, remaining)
      }
    }

    return hasVelocity && maxRemainingPixels >= INERTIA_MIN_REMAINING_PIXELS
  }

  private getTouchZoomAxisRemainingPixels(
    min: number,
    max: number,
    layoutSize: number,
    centerVelocity: number | undefined,
    logRangeVelocity: number | undefined,
    remainingOffset: number
  ): number | null {
    const range = max - min
    if (!Number.isFinite(range) || range === 0) return null

    const scale = layoutSize / Math.abs(range)
    let remaining = 0
    let hasVelocity = false

    if (Number.isFinite(centerVelocity)) {
      remaining += Math.abs(centerVelocity! * remainingOffset)
      hasVelocity = true
    }

    if (Number.isFinite(logRangeVelocity)) {
      remaining += Math.abs(range * (Math.exp(logRangeVelocity! * remainingOffset) - 1)) / 2
      hasVelocity = true
    }

    return hasVelocity ? remaining * scale : null
  }

  private getDecelerationOffset(deceleration: number, elapsed: number): number {
    return (Math.pow(deceleration, 1000 * elapsed) - 1) / (1000 * Math.log(deceleration))
  }

  private getRemainingDecelerationOffset(deceleration: number, elapsed: number): number {
    return -Math.pow(deceleration, 1000 * elapsed) / (1000 * Math.log(deceleration))
  }

  private getDeceleration(kind: InertiaKind): number | null {
    const deceleration = this.options.deceleration?.[kind] ?? DEFAULT_DECELERATION
    if (!Number.isFinite(deceleration) || deceleration <= 0 || deceleration >= 1) return null
    return deceleration
  }

  private getTouchZoomVelocity(previous: BoundsPatch, next: BoundsPatch, dt: number): TouchZoomVelocity | null {
    if (dt <= 0) return null

    return this.filterTouchZoomVelocity({
      ...this.getTouchZoomAxisVelocity(previous.minX, previous.maxX, next.minX, next.maxX, 'x', dt),
      ...this.getTouchZoomAxisVelocity(previous.minY, previous.maxY, next.minY, next.maxY, 'y', dt),
    })
  }

  private getTouchZoomAxisVelocity(
    previousMin: number | undefined,
    previousMax: number | undefined,
    nextMin: number | undefined,
    nextMax: number | undefined,
    axis: TouchZoomAxis,
    dt: number
  ): TouchZoomVelocity {
    if (previousMin === undefined || previousMax === undefined || nextMin === undefined || nextMax === undefined) return {}
    if (!this.isTouchZoomVelocityAxisEnabled(axis)) return {}

    const previousRange = previousMax - previousMin
    const nextRange = nextMax - nextMin
    if (!Number.isFinite(previousRange) || !Number.isFinite(nextRange) || previousRange <= 0 || nextRange <= 0) return {}

    const previousCenter = (previousMin + previousMax) / 2
    const nextCenter = (nextMin + nextMax) / 2
    const centerVelocity = (nextCenter - previousCenter) / dt
    const logRangeVelocity = Math.log(nextRange / previousRange) / dt

    if (axis === 'x') {
      return {
        centerX: centerVelocity,
        logRangeX: logRangeVelocity,
      }
    }

    return {
      centerY: centerVelocity,
      logRangeY: logRangeVelocity,
    }
  }

  private filterTouchZoomVelocity(velocity: TouchZoomVelocity | null): TouchZoomVelocity | null {
    if (!velocity) return null

    const filtered: TouchZoomVelocity = {}
    let hasVelocity = false

    if (this.isXAxisEnabled()) {
      if (Number.isFinite(velocity.centerX) && velocity.centerX !== 0) {
        filtered.centerX = velocity.centerX
        hasVelocity = true
      }
      if (Number.isFinite(velocity.logRangeX) && velocity.logRangeX !== 0) {
        filtered.logRangeX = velocity.logRangeX
        hasVelocity = true
      }
    }

    if (this.isYAxisEnabled()) {
      if (Number.isFinite(velocity.centerY) && velocity.centerY !== 0) {
        filtered.centerY = velocity.centerY
        hasVelocity = true
      }
      if (Number.isFinite(velocity.logRangeY) && velocity.logRangeY !== 0) {
        filtered.logRangeY = velocity.logRangeY
        hasVelocity = true
      }
    }

    return hasVelocity ? filtered : null
  }

  private isTouchZoomVelocityAxisEnabled(axis: TouchZoomAxis): boolean {
    return axis === 'x' ? this.isXAxisEnabled() : this.isYAxisEnabled()
  }

  private filterVelocity(velocity: BoundsVelocity | null): BoundsVelocity | null {
    if (!velocity) return null

    const filtered: BoundsVelocity = {}
    let hasVelocity = false

    for (const key of BOUNDS_PATCH_KEYS) {
      if (!this.isVelocityKeyEnabled(key)) continue
      const value = velocity[key]
      if (!Number.isFinite(value) || value === 0) continue
      filtered[key] = value
      hasVelocity = true
    }

    return hasVelocity ? filtered : null
  }

  private isVelocityKeyEnabled(key: BoundsPatchKey): boolean {
    return (key === 'minX' || key === 'maxX') ? this.isXAxisEnabled() : this.isYAxisEnabled()
  }

  private hasPatchDelta(previous: BoundsPatch, next: BoundsPatch): boolean {
    for (const key of BOUNDS_PATCH_KEYS) {
      if (!this.isVelocityKeyEnabled(key)) continue
      const previousValue = previous[key]
      const nextValue = next[key]
      if (previousValue === undefined || nextValue === undefined) continue
      if (previousValue !== nextValue) return true
    }

    return false
  }

  private copyPatch(patch: BoundsPatch): BoundsPatch {
    const copy: BoundsPatch = {}
    for (const key of BOUNDS_PATCH_KEYS) {
      const value = patch[key]
      if (value !== undefined) copy[key] = value
    }

    return copy
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
        const projection = this.getProjectionAxisPoints('x', state, firstPosition, secondPosition)
        const positions = this.clampTouchZoomAxisPositions(
          projection.firstPosition,
          projection.secondPosition,
          this.getTouchZoomMinAxisDistance(layout.width) / layout.width,
          projection.startPositionDelta
        )
        firstPosition = positions[0]
        secondPosition = positions[1]
        bounds = this.solveAxisBounds(
          projection.firstValue,
          projection.secondValue,
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
        const projection = this.getProjectionAxisPoints('y', state, firstPosition, secondPosition)
        const positions = this.clampTouchZoomAxisPositions(
          projection.firstPosition,
          projection.secondPosition,
          this.getTouchZoomMinAxisDistance(layout.height) / layout.height,
          projection.startPositionDelta
        )
        firstPosition = positions[0]
        secondPosition = positions[1]
        bounds = this.solveAxisBounds(
          projection.firstValue,
          projection.secondValue,
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

  private getProjectionAxisPoints(
    axis: TouchZoomAxis,
    state: NonNullable<ZoomChartComponent['touchZoomState']>,
    firstPosition: number,
    secondPosition: number
  ): ProjectionAxisPoints {
    const startFirstPosition = this.getAxisPosition(axis, state.startFirstLayoutPoint, state.layout)
    const startSecondPosition = this.getAxisPosition(axis, state.startSecondLayoutPoint, state.layout)
    const startFirstValue = axis === 'x' ? state.startFirstChartPoint.x : state.startFirstChartPoint.y
    const startSecondValue = axis === 'x' ? state.startSecondChartPoint.x : state.startSecondChartPoint.y

    const [firstValue, secondValue] = startFirstPosition <= startSecondPosition
      ? [startFirstValue, startSecondValue]
      : [startSecondValue, startFirstValue]
    const [orderedFirstPosition, orderedSecondPosition] = firstPosition <= secondPosition
      ? [firstPosition, secondPosition]
      : [secondPosition, firstPosition]

    return {
      firstValue,
      secondValue,
      firstPosition: orderedFirstPosition,
      secondPosition: orderedSecondPosition,
      startPositionDelta: Math.abs(startSecondPosition - startFirstPosition),
    }
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
