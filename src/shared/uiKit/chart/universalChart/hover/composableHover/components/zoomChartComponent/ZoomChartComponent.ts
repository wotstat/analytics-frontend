import { Size, UniversalChart } from '../../../../UniversalChart'
import { Bounds, BoundsAxes, BoundsConstraint, BoundsPatch } from '../../../../utils/Bounds'
import { ChartSpace } from '../../../../utils/ChartSpace'
import { Point } from '../../../../utils/Point'
import { InteractionDirection, Position, TouchZoomPoint } from '../../../basePlotHover/BasePlotHover'
import { ComposableHover, HoverComponent } from '../../ComposableHover'
import {
  Axis, AxisBounds, DEFAULT_DECELERATION, DEFAULT_TOUCH_ZOOM_DECELERATION, INERTIA_MIN_REMAINING_PIXELS,
  INPUT_STOP_TIMEOUT, LayoutValue, MIN_VELOCITY_SAMPLE_DT, RUBBER_BAND_COEFF,
  VELOCITY_SAMPLE_DT_SMOOTHING, VELOCITY_SAMPLE_OUTLIER_RATIO,
  WHEEL_BATCH_TIMEOUT, axisCenter, axisRange, clamp,
  getAxisBounds, getAxisPosition, getAxisSize, orderedAxisBounds, setAxisBounds
} from './common'
import { applyElasticAxis, elasticVelocityFactor, invertElasticAxis, invertResistedAxisRange, invertResistedPlacement, resistedAxisRange } from './elastic'
import { decayOffset, decayVelocityAt, remainingDecayOffset, totalDecayTravel } from './inertia'
import { AxisLimits, NormalizedLimits, clampAxisToLimits, effectiveMaxDelta, isPlacementWithinLimits, isRangeWithinLimits, normalizeLimits, placementBand } from './limits'
import { CriticalFollower, DEFAULT_FOLLOW_OMEGA } from './follower'
import { ScalarSpring } from './spring'
import { PinchGesture } from './TouchZoomSolver'

// A pan started right after a pinch suppresses its own inertia (the lift-off jitter must
// not fight the pinch inertia) until it moves this far and becomes a deliberate pan
const PAN_SUPPRESS_RELEASE_DISTANCE = 8

type DecelerationOptions = {
  mousePan?: number,
  touchPan?: number,
  touchZoom?: number
}
type InertiaKind = keyof DecelerationOptions
type InertiaSpec = { source: InertiaKind, deceleration: number }

type AxisVelocity = { center: number, logRange: number }

type ChannelMotion =
  | { kind: 'inertia', source: InertiaKind, velocity: number, deceleration: number, startTime: number, lastElapsed: number }
  | { kind: 'spring', spring: ScalarSpring, startTime: number }

type InertiaMotion = Extract<ChannelMotion, { kind: 'inertia' }>

// Motions run per axis per channel: center (translation) and logRange (zoom) are
// independent, so e.g. the zoom-return spring keeps running while a pan flick's
// center inertia glides on the same axis. Inertia integrates raw space directly,
// springs follow a displayed-space curve written back through the inverse projection —
// both mutate raw, so they compose with an active pan gesture on top.
type AxisMotions = { center: ChannelMotion | null, logRange: ChannelMotion | null }

// Eases the opposite (auto-fitted) axis toward its shifting data extent. Min and max glide
// independently; `lastTime` is the timestamp of the previous step for frame-rate independence.
type AutoFollow = { min: CriticalFollower, max: CriticalFollower, lastTime: number }

type PanState = {
  startClientX: number,
  startClientY: number,
  startBounds: Bounds,
  layoutWidth: number,
  layoutHeight: number,
  isTouch: boolean,
  suppressInertia: boolean,
  lastSampleClientX: number,
  lastSampleClientY: number,
  lastSampleTime: number,
  averageSampleDt: number | null,
  velocity: { x?: number, y?: number } | null,
  ended: boolean
}

type PinchState = {
  gesture: PinchGesture,
  ended: boolean,
  dirty: boolean,
  inertiaCanceled: boolean,
  updateTime: number,
  lastSample: { x: AxisBounds | null, y: AxisBounds | null } | null,
  lastSampleTime: number | null,
  velocity: { x: AxisVelocity | null, y: AxisVelocity | null } | null
}

type WheelBatch = {
  pending: { deltaY: number, point: Point, layout: LayoutValue }[],
  lastEventTime: number,
  anchor: { x: number, y: number } | null
}

type Options = {
  chart: UniversalChart
  zoom?: boolean
  panDirection?: InteractionDirection
  deceleration?: DecelerationOptions
  // Eases the auto-fitted (non-driven) axis toward its data extent instead of snapping:
  // true or omitted = default responsiveness, a positive number = custom natural
  // frequency (higher = snappier), false = off (the axis snaps synchronously)
  autoFitFollow?: boolean | number
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

// Controls the chart render bounds through pan, wheel zoom, pinch zoom, inertia and
// limits with optional elastic overscroll. Renders nothing by itself.
//
// Event handlers only record state, all bounds changes are computed and applied in
// onBeforeLayout. Gestures and inertia integrate in "raw" (unresisted) space, the
// displayed bounds are a projection of raw anchored at the active zoom point:
// identity inside limits, rubber band outside (elastic) or clamp (hard). Motions run
// per channel (center / logRange): inertia integrates raw directly, springs follow a
// displayed-space curve written back into raw through the inverse projection, and
// only ever start after the input owning their channel has ended — so a pan composes
// with a still-running zoom return on the same axis.
export class ZoomChartComponent implements HoverComponent {

  private options!: Options
  private chart!: UniversalChart

  private limits!: NormalizedLimits
  private activeAxes!: Axis[]
  private enabledBoundsAxes!: BoundsAxes
  // The axis the component does not drive but auto-fits (single-axis pan/zoom only); null
  // when both axes are driven ('all') or none are. The follower animates this one.
  private autoFitAxis!: Axis | null
  // Follower natural frequency, null when the follow animation is disabled
  private autoFitFollowOmega!: number | null

  private pan: PanState | null = null
  private lastCursor: Position | null = null
  private pinch: PinchState | null = null
  private wheel: WheelBatch | null = null
  private motions: { x: AxisMotions, y: AxisMotions } = {
    x: { center: null, logRange: null },
    y: { center: null, logRange: null },
  }
  private raw: Bounds | null = null
  private autoFollow: AutoFollow | null = null

  constructor(options: Options) {
    this.applyOptions(options)
  }

  private applyOptions(options: Options): void {
    this.options = options
    this.chart = options.chart
    this.limits = normalizeLimits(options.limits)

    this.activeAxes = []
    if (this.isXAxisEnabled()) this.activeAxes.push('x')
    if (this.isYAxisEnabled()) this.activeAxes.push('y')
    this.enabledBoundsAxes = { x: this.isXAxisEnabled(), y: this.isYAxisEnabled() }
    this.autoFitAxis = this.activeAxes.length === 1 ? (this.activeAxes[0] === 'x' ? 'y' : 'x') : null
    this.autoFitFollowOmega = normalizeAutoFitFollow(options.autoFitFollow)
  }

  // Replaces the current options and recomputes the derived config. Any in-flight
  // gesture, inertia or spring is dropped: it may reference an axis or limits that
  // no longer apply (a motion left on a now-disabled axis would never be stepped and
  // would keep scheduling renders forever).
  updateOptions(options: Options): void {
    this.releaseAutoFit(false) // hand the old auto-fit axis back before the config (and axis) changes
    this.applyOptions(options)
    this.pan = null
    this.lastCursor = null
    this.pinch = null
    this.wheel = null
    this.motions = {
      x: { center: null, logRange: null },
      y: { center: null, logRange: null },
    }
    this.raw = null
  }

  //#region Pan

  mayPan(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): InteractionDirection {
    return this.options.panDirection ?? false
  }

  onPanBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean {
    const afterPinch = isTouch && (this.pinch?.ended ?? false)
    this.stopMotionsForPan(isTouch)
    this.lastCursor = null
    if (this.wheel) this.wheel.anchor = null // pan owns the display now, anchor context resets to 0.5

    const raw = this.resetRawFrom(space)
    this.applyPinchResidual(raw)

    const time = this.now()
    this.pan = {
      startClientX: cursor.clientX,
      startClientY: cursor.clientY,
      startBounds: raw.clone(),
      layoutWidth: space.layout.width,
      layoutHeight: space.layout.height,
      isTouch,
      suppressInertia: afterPinch,
      lastSampleClientX: cursor.clientX,
      lastSampleClientY: cursor.clientY,
      lastSampleTime: time,
      averageSampleDt: null,
      velocity: null,
      ended: false,
    }

    return true
  }

  onPanUpdate(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean {
    if (!this.pan) return false
    if (!isTouch) this.stopMotionsForPan(false)

    if (this.pan.suppressInertia) {
      const dx = cursor.clientX - this.pan.startClientX
      const dy = cursor.clientY - this.pan.startClientY
      if (Math.sqrt(dx * dx + dy * dy) > PAN_SUPPRESS_RELEASE_DISTANCE) this.pan.suppressInertia = false
    }

    this.recordPanVelocity(cursor)
    this.lastCursor = cursor
    this.pan.ended = false
    return true
  }

  onPanEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean {
    if (!this.pan) {
      this.lastCursor = null
      return false
    }

    this.recordPanVelocity(cursor)
    this.lastCursor = cursor
    this.pan.ended = true
    return true
  }

  //#endregion

  //#region Touch Zoom

  mayTouchZoom(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace, composable: ComposableHover): InteractionDirection {
    return this.isZoomEnabled() ? this.options.panDirection ?? false : false
  }

  onTouchZoomBegin(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace, composable: ComposableHover): boolean {
    if (!this.isZoomEnabled()) return false

    this.stopAllMotions()

    const raw = this.resetRawFrom(space, axis =>
      clamp((getAxisPosition(axis, first.point, space.layout) + getAxisPosition(axis, second.point, space.layout)) / 2, 0, 1))
    this.applyPinchResidual(raw)
    if (this.pan && this.lastCursor) this.applyPanShift(raw, this.pan, this.lastCursor)
    this.pan = null
    this.lastCursor = null
    this.wheel = null

    this.pinch = {
      gesture: new PinchGesture(
        first, second, space.layout, raw,
        { x: this.isXAxisEnabled(), y: this.isYAxisEnabled() },
        this.options.panDirection === 'all'
      ),
      ended: false,
      dirty: true,
      inertiaCanceled: false,
      updateTime: this.now(),
      lastSample: null,
      lastSampleTime: null,
      velocity: null,
    }

    return true
  }

  onTouchZoomUpdate(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace, composable: ComposableHover): boolean {
    if (!this.pinch) return false

    this.pinch.gesture.update(first, second)
    this.pinch.updateTime = this.now()
    this.pinch.dirty = true
    this.samplePinchVelocity(this.pinch)

    return true
  }

  onTouchZoomEnd(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace, composable: ComposableHover): boolean {
    if (!this.pinch) return false

    this.pinch.gesture.update(first, second)
    this.pinch.updateTime = this.now()
    this.pinch.dirty = true
    this.pinch.ended = true
    this.samplePinchVelocity(this.pinch)

    return true
  }

  //#endregion

  //#region Wheel Zoom

  onWheelZoom(cursor: Position, point: Point, space: ChartSpace, deltaY: number, deltaX: number, composable: ComposableHover): boolean {
    if (!this.isZoomEnabled()) return false
    if (this.pinch && !this.pinch.ended) return false // touch zoom has priority over wheel

    this.stopMotionsForWheel()

    if (!this.wheel) this.wheel = { pending: [], lastEventTime: 0, anchor: null }
    this.wheel.pending.push({ deltaY, point: { ...point }, layout: { ...space.layout } })
    this.wheel.lastEventTime = this.now()

    return true
  }

  //#endregion

  //#region Apply pipeline

  onBeforeLayout(space: ChartSpace, full: Size): void {
    const now = this.now()

    // the follow animation may outlive the input that started it, so it keeps us awake too
    const activeBusy = this.hasActiveInput() || this.hasAnyMotion()
    if (!activeBusy && !this.autoFollow) {
      this.raw = null
      return
    }

    const patch: BoundsPatch = {}

    if (activeBusy) {
      const raw = this.ensureRaw(space)

      const pinchApplied = this.processPinch(raw, space.layout, now)
      this.processPan(raw, space.layout, now)
      if (pinchApplied || this.pinch) this.wheel = null
      else this.processWheel(raw, space.layout, now)

      const motionMoved = this.stepMotions(raw, space.layout, now)
      if (motionMoved && this.pan && !this.pan.ended) this.pan.startBounds = raw.clone()

      Object.assign(patch, this.computeDisplayed(raw, space).toPatch(this.enabledBoundsAxes))
    }

    this.stepAutoFollow(space, patch, now, activeBusy)

    if (Bounds.isPatchValid(patch) && !space.bounds.isEqualToPatch(patch)) this.chart.setRenderBounds(patch, true)

    if (this.hasAnyMotion() || this.wheel !== null || this.autoFollow !== null) this.chart.scheduleRender()
    if (!this.hasActiveInput() && !this.hasAnyMotion() && this.autoFollow === null) this.raw = null
  }

  private processPinch(raw: Bounds, layout: LayoutValue, now: number): boolean {
    const pinch = this.pinch
    if (!pinch?.dirty) return false
    pinch.dirty = false

    const changed = this.applyPinchBounds(raw, pinch.gesture)

    if (pinch.ended) {
      this.pinch = null

      // the projection anchor returns to 0.5 with the gesture gone
      const gesture = pinch.gesture
      this.rebaseRawAnchor(raw, gesture.layout, axis => clamp(gesture.midAnchor(axis), 0, 1), () => 0.5)
      if (this.pan) this.pan.startBounds = raw.clone()

      if (!pinch.inertiaCanceled) this.releasePinch(raw, layout, pinch.velocity, now)
    }

    return changed
  }

  private processPan(raw: Bounds, layout: LayoutValue, now: number): void {
    const pan = this.pan
    if (!pan) return

    const cursor = this.lastCursor
    if (cursor) {
      this.lastCursor = null
      if (this.applyPanShift(raw, pan, cursor)) {
        pan.startClientX = cursor.clientX
        pan.startClientY = cursor.clientY
        pan.startBounds = raw.clone()
      }
    }

    if (pan.ended) {
      this.pan = null
      this.lastCursor = null
      this.releasePan(pan, raw, layout, now)
    }
  }

  private processWheel(raw: Bounds, layout: LayoutValue, now: number): void {
    const wheel = this.wheel
    if (!wheel) return

    this.applyPendingWheelZooms(wheel, raw)

    // only an elastic wheel batch has release logic: the spring may start after input stops
    if (!this.limits.elastic || !this.hasEnabledLimits() || this.pan || this.pinch) {
      this.wheel = null
      return
    }

    if ((now - wheel.lastEventTime) / 1000 > WHEEL_BATCH_TIMEOUT) {
      const anchor = wheel.anchor
      this.wheel = null
      if (anchor) this.rebaseRawAnchor(raw, layout, axis => anchor[axis], () => 0.5)

      for (const axis of this.activeAxes) {
        if (!this.axisLimits(axis).hasAny) continue
        const motions = this.motions[axis]
        this.releaseAxis(axis, raw, getAxisSize(axis, layout), {
          center: motions.center === null ? 0 : null,
          logRange: motions.logRange === null ? 0 : null,
        }, null, now)
      }
    }
  }

  private applyPendingWheelZooms(wheel: WheelBatch, raw: Bounds): void {
    if (wheel.pending.length === 0) return

    let changed = false

    for (const zoom of wheel.pending) {
      const zoomFactor = 1 + zoom.deltaY * 0.001
      if (!Number.isFinite(zoomFactor) || zoomFactor <= 0) continue

      // while the batch drives the display, its projection anchor follows the cursor
      if (!this.pan) {
        const previous = wheel.anchor
        const anchor = {
          x: clamp(getAxisPosition('x', zoom.point, zoom.layout), 0, 1),
          y: clamp(getAxisPosition('y', zoom.point, zoom.layout), 0, 1),
        }
        this.rebaseRawAnchor(raw, zoom.layout, axis => previous?.[axis] ?? 0.5, axis => anchor[axis])
        wheel.anchor = anchor
      }

      for (const axis of this.activeAxes) {
        if (!(getAxisSize(axis, zoom.layout) > 0)) continue

        const anchorT = getAxisPosition(axis, zoom.point, zoom.layout)
        const next = zoomAxisAboutAnchor(getAxisBounds(raw, axis), anchorT, zoomFactor)
        if (!next) continue

        setAxisBounds(raw, axis, this.hardClampAxis(next, axis, anchorT))
        changed = true
      }
    }

    wheel.pending = []
    if (changed && this.pan) this.pan.startBounds = raw.clone()
  }

  //#endregion

  //#region Auto-fit axis follow

  // Eases the auto-fitted axis toward its data-fit extent so it glides instead of snapping
  // each frame while the driven axis is panned or zoomed. Writes the animated bounds into
  // `patch`; once it catches up and no input remains it hands the axis back to the chart's
  // synchronous auto-fit and stops. Only input engages it — a data change outside interaction
  // never starts an animation and falls through to that synchronous path unchanged.
  private stepAutoFollow(space: ChartSpace, patch: BoundsPatch, now: number, activeBusy: boolean): void {
    const axis = this.autoFitAxis
    const omega = this.autoFitFollowOmega
    if (!axis || omega === null) return

    const fit = getAxisBounds(this.chart.autoFitBounds(this.drivenConstraint(space, patch)), axis)
    if (!Number.isFinite(fit.min) || !Number.isFinite(fit.max) || fit.min >= fit.max) {
      this.releaseAutoFit(false) // no usable fit (e.g. no data in range): let the chart's own fallback own the axis
      return
    }

    if (!this.autoFollow) {
      if (!activeBusy) return // engage from input only, never from a passive re-layout
      const current = getAxisBounds(space.bounds, axis)
      const start = Number.isFinite(current.min) && Number.isFinite(current.max) && current.min < current.max ? current : fit
      this.autoFollow = { min: new CriticalFollower(start.min, 0, omega), max: new CriticalFollower(start.max, 0, omega), lastTime: now }
    }

    const follow = this.autoFollow
    const dt = (now - follow.lastTime) / 1000
    follow.lastTime = now
    follow.min.step(fit.min, dt)
    follow.max.step(fit.max, dt)

    const layoutSize = getAxisSize(axis, space.layout)
    const pxPerUnit = layoutSize > 0 ? layoutSize / (fit.max - fit.min) : 0
    const settled = follow.min.settled(fit.min, pxPerUnit) && follow.max.settled(fit.max, pxPerUnit)

    // caught up and nothing is driving further change: return the axis to synchronous auto-fit
    if (settled && !activeBusy) {
      this.releaseAutoFit(false)
      return
    }

    if (settled) {
      follow.min.value = fit.min
      follow.max.value = fit.max
    }

    // min and max ease independently; on the off chance they cross mid-flight, hold this
    // frame rather than emit an inverted range (the next frame resolves it)
    if (follow.min.value >= follow.max.value) return

    if (axis === 'x') {
      patch.minX = follow.min.value
      patch.maxX = follow.max.value
    } else {
      patch.minY = follow.min.value
      patch.maxY = follow.max.value
    }
  }

  // The driven-axis bounds about to be rendered — from this frame's patch when the input
  // pipeline produced them, otherwise the resting bounds — as the constraint for querying
  // the other axis' auto-fit target.
  private drivenConstraint(space: ChartSpace, patch: BoundsPatch): BoundsConstraint {
    const constraint: BoundsConstraint = {}

    for (const axis of this.activeAxes) {
      const current = getAxisBounds(space.bounds, axis)
      if (axis === 'x') {
        constraint.minX = patch.minX ?? current.min
        constraint.maxX = patch.maxX ?? current.max
      } else {
        constraint.minY = patch.minY ?? current.min
        constraint.maxY = patch.maxY ?? current.max
      }
    }

    return constraint
  }

  // Ends the follow animation and clears the auto-fit axis' explicit bounds, so the chart
  // recomputes it from data on every layout again. No-op when nothing is being followed.
  private releaseAutoFit(immediate: boolean): void {
    if (!this.autoFollow) return
    this.autoFollow = null

    const axis = this.autoFitAxis
    if (!axis) return
    this.chart.setRenderBounds(axis === 'x' ? { minX: null, maxX: null } : { minY: null, maxY: null }, immediate)
  }

  //#endregion

  //#region Gesture application

  private applyPanShift(raw: Bounds, pan: PanState, cursor: Position): boolean {
    let changed = false

    for (const axis of this.activeAxes) {
      const size = axis === 'x' ? pan.layoutWidth : pan.layoutHeight
      if (!(size > 0)) continue

      const start = getAxisBounds(pan.startBounds, axis)
      const clientDelta = axis === 'x' ? cursor.clientX - pan.startClientX : cursor.clientY - pan.startClientY
      const shift = this.panAxisShift(axis, clientDelta, start, size)

      const next = orderedAxisBounds(start.min + shift, start.max + shift)
      if (!next) continue

      setAxisBounds(raw, axis, this.hardClampAxis(next, axis, 0.5))
      changed = true
    }

    return changed
  }

  // px -> chart units shift for a pan client delta along the axis (screen Y is inverted)
  private panAxisShift(axis: Axis, clientDelta: number, start: AxisBounds, layoutSize: number): number {
    return (axis === 'x' ? -clientDelta : clientDelta) * this.panConversionRange(axis, start, layoutSize) / layoutSize
  }

  private applyPinchBounds(raw: Bounds, gesture: PinchGesture): boolean {
    const solved = gesture.solve()
    let changed = false

    for (const axis of this.activeAxes) {
      const bounds = solved[axis]
      if (!bounds) continue

      setAxisBounds(raw, axis, this.hardClampAxis(bounds, axis, gesture.midAnchor(axis)))
      changed = true
    }

    return changed
  }

  // Merges the final state of an unprocessed pinch, so a pan starting right after
  // the pinch continues from the actual visible area without a jump
  private applyPinchResidual(raw: Bounds): void {
    if (this.pinch) this.applyPinchBounds(raw, this.pinch.gesture)
  }

  //#endregion

  //#region Release decisions

  private releasePan(pan: PanState, raw: Bounds, layout: LayoutValue, now: number): void {
    const inertia = pan.suppressInertia ? null : this.inertiaSpec(pan.isTouch ? 'touchPan' : 'mousePan')

    for (const axis of this.activeAxes) {
      const motions = this.motions[axis]
      const releaseCenter = !pan.suppressInertia || motions.center === null

      this.releaseAxis(axis, raw, getAxisSize(axis, layout), {
        center: releaseCenter ? pan.velocity?.[axis] ?? 0 : null,
        logRange: motions.logRange === null ? 0 : null,
      }, inertia, now)
    }
  }

  private releasePinch(raw: Bounds, layout: LayoutValue, velocity: PinchState['velocity'], now: number): void {
    const inertia = this.inertiaSpec('touchZoom')

    for (const axis of this.activeAxes) {
      const axisVelocity = velocity?.[axis]
      this.releaseAxis(axis, raw, getAxisSize(axis, layout), {
        center: axisVelocity?.center ?? 0,
        logRange: axisVelocity?.logRange ?? 0,
      }, inertia, now)
    }
  }

  // Per-channel release: inside limits (or with velocity enough to glide back inside)
  // a channel gets Apple-decay inertia, otherwise a spring carrying the release
  // velocity mapped into displayed space. A null channel velocity leaves that
  // channel's current motion untouched, a null inertia allows only springs.
  private releaseAxis(
    axis: Axis,
    raw: Bounds,
    layoutSize: number,
    velocity: { center: number | null, logRange: number | null },
    inertia: InertiaSpec | null,
    now: number
  ): void {
    const limits = this.axisLimits(axis)
    const elastic = this.isElasticAxis(limits)
    const motions = this.motions[axis]
    const rawBounds = getAxisBounds(raw, axis)
    const displayed = elastic ? applyElasticAxis(rawBounds, limits, layoutSize) : rawBounds
    const target = clampAxisToLimits(displayed, limits)
    const factor = elastic ? elasticVelocityFactor(rawBounds, limits, layoutSize) : { center: 1, logRange: 1 }

    if (velocity.logRange !== null) {
      const need = elastic ? Math.log(axisRange(target) / axisRange(rawBounds)) : 0
      // a pan never blocks the zoom return, only zoom inputs own this channel
      const springAllowed = this.pinch === null && this.wheel === null
      const motion = this.decideChannelRelease(need, velocity.logRange, Math.log(axisRange(displayed)), Math.log(axisRange(target)), factor.logRange, inertia, springAllowed, now)
      if (motion) motions.logRange = motion
    }

    if (velocity.center !== null) {
      const need = elastic ? axisCenter(target) - axisCenter(rawBounds) : 0
      const motion = this.decideChannelRelease(need, velocity.center, axisCenter(displayed), axisCenter(target), factor.center, inertia, !this.hasActiveInput(), now)
      if (motion) motions.center = motion
    }
  }

  private decideChannelRelease(
    need: number,
    velocity: number,
    displayedFrom: number,
    displayedTarget: number,
    velocityFactor: number,
    inertia: InertiaSpec | null,
    springAllowed: boolean,
    now: number
  ): ChannelMotion | null {
    const v = Number.isFinite(velocity) ? velocity : 0
    const travel = inertia ? totalDecayTravel(v, inertia.deceleration) : 0
    const sufficient = need === 0 || (Math.sign(travel) === Math.sign(need) && Math.abs(travel) >= Math.abs(need))

    if (sufficient) {
      if (!inertia || v === 0) return null
      return { kind: 'inertia', source: inertia.source, velocity: v, deceleration: inertia.deceleration, startTime: now, lastElapsed: 0 }
    }

    if (!springAllowed) return null
    return { kind: 'spring', spring: new ScalarSpring(displayedFrom, displayedTarget, v * velocityFactor), startTime: now }
  }

  //#endregion

  //#region Inertia and spring stepping

  private stepMotions(raw: Bounds, layout: LayoutValue, now: number): boolean {
    let changed = false

    for (const axis of this.activeAxes) {
      changed = this.stepAxisMotions(axis, raw, getAxisSize(axis, layout), now) || changed
    }

    return changed
  }

  private stepAxisMotions(axis: Axis, raw: Bounds, layoutSize: number, now: number): boolean {
    const motions = this.motions[axis]
    if (!motions.center && !motions.logRange) return false

    const limits = this.axisLimits(axis)
    const current = getAxisBounds(raw, axis)
    let center = axisCenter(current)
    let rawRange = axisRange(current)
    let changed = false

    // range first: the valid placement band depends on the resulting displayed range
    if (motions.logRange) {
      const step = this.stepLogRangeChannel(motions.logRange, rawRange, limits, layoutSize, now)
      motions.logRange = step.motion
      if (step.value !== rawRange && Number.isFinite(step.value) && step.value > 0) {
        rawRange = step.value
        changed = true
      }
    }

    if (motions.center) {
      const step = this.stepCenterChannel(motions.center, center, rawRange, limits, layoutSize, now)
      motions.center = step.motion
      if (step.value !== center && Number.isFinite(step.value)) {
        center = step.value
        changed = true
      }
    }

    if (changed) {
      const next = orderedAxisBounds(center - rawRange / 2, center + rawRange / 2)
      if (next) setAxisBounds(raw, axis, next)
      else {
        motions.center = null
        motions.logRange = null
        changed = false
      }
    }

    // nothing owns the axis anymore: never leave it stranded outside limits
    if (!motions.center && !motions.logRange && this.isElasticAxis(limits) && !this.hasActiveInput()) {
      this.releaseAxis(axis, raw, layoutSize, { center: 0, logRange: 0 }, null, now)
    }

    return changed
  }

  private stepLogRangeChannel(motion: ChannelMotion, rawRange: number, limits: AxisLimits, layoutSize: number, now: number): { value: number, motion: ChannelMotion | null } {
    const elastic = this.isElasticAxis(limits)
    const elapsed = Math.max(0, (now - motion.startTime) / 1000)

    if (motion.kind === 'spring') {
      const { value: logRange, settled } = motion.spring.sample(elapsed, layoutSize)
      const displayedRange = Math.exp(logRange)
      const value = elastic ? invertResistedAxisRange(displayedRange, limits, layoutSize) : displayedRange
      return { value, motion: settled ? null : motion }
    }

    if (elapsed <= motion.lastElapsed) return { value: rawRange, motion }

    const offsetDelta = decayOffset(motion.deceleration, elapsed) - decayOffset(motion.deceleration, motion.lastElapsed)
    const next = rawRange * Math.exp(motion.velocity * offsetDelta)
    if (!Number.isFinite(next) || next <= 0) return { value: rawRange, motion: null }

    if (limits.hasAny && !isRangeWithinLimits(next, limits)) {
      const boundary = clamp(next, limits.minDelta, effectiveMaxDelta(limits))
      // inertia may not overscroll while a real gesture is active: springs cannot start
      // here. A lingering wheel batch does not count, the next tick cancels springs anyway
      if (!elastic || this.hasActiveGesture()) return { value: boundary, motion: null }

      if (isRangeWithinLimits(rawRange, limits)) {
        return { value: boundary, motion: inertiaBounceMotion(motion, rawRange, next, boundary, elapsed, Math.log(boundary), now) }
      }
    }

    motion.lastElapsed = elapsed
    const remainingPx = Math.abs(Math.exp(motion.velocity * remainingDecayOffset(motion.deceleration, elapsed)) - 1) * layoutSize / 2
    return { value: next, motion: remainingPx < INERTIA_MIN_REMAINING_PIXELS ? null : motion }
  }

  private stepCenterChannel(motion: ChannelMotion, center: number, rawRange: number, limits: AxisLimits, layoutSize: number, now: number): { value: number, motion: ChannelMotion | null } {
    const elastic = this.isElasticAxis(limits)
    const displayedRange = elastic ? resistedAxisRange(rawRange, limits, layoutSize) : rawRange
    const elapsed = Math.max(0, (now - motion.startTime) / 1000)

    if (motion.kind === 'spring') {
      const { value: displayedCenter, settled } = motion.spring.sample(elapsed, layoutSize / displayedRange)

      let value = displayedCenter
      if (elastic) {
        const displayedMin = displayedCenter - displayedRange / 2
        value = invertResistedPlacement(displayedMin, displayedRange, limits, layoutSize) + displayedRange / 2
      }
      return { value, motion: settled ? null : motion }
    }

    if (elapsed <= motion.lastElapsed) return { value: center, motion }

    const offsetDelta = decayOffset(motion.deceleration, elapsed) - decayOffset(motion.deceleration, motion.lastElapsed)
    const next = center + motion.velocity * offsetDelta
    if (!Number.isFinite(next)) return { value: center, motion: null }

    if (limits.hasAny && !isPlacementWithinLimits(next - displayedRange / 2, displayedRange, limits)) {
      const band = placementBand(displayedRange, limits)
      const boundary = clamp(next - displayedRange / 2, band.lo, band.hi) + displayedRange / 2
      if (!elastic || this.hasActiveGesture()) return { value: boundary, motion: null }

      if (isPlacementWithinLimits(center - displayedRange / 2, displayedRange, limits)) {
        return { value: boundary, motion: inertiaBounceMotion(motion, center, next, boundary, elapsed, boundary, now) }
      }
    }

    motion.lastElapsed = elapsed
    const remainingPx = Math.abs(motion.velocity * remainingDecayOffset(motion.deceleration, elapsed)) * layoutSize / displayedRange
    return { value: next, motion: remainingPx < INERTIA_MIN_REMAINING_PIXELS ? null : motion }
  }

  private computeDisplayed(raw: Bounds, space: ChartSpace): Bounds {
    const displayed = space.bounds.clone()

    for (const axis of this.activeAxes) {
      const size = getAxisSize(axis, space.layout)
      setAxisBounds(displayed, axis, this.projectAxis(getAxisBounds(raw, axis), axis, size, this.currentAnchor(axis)))
    }

    return displayed
  }

  //#endregion

  //#region Raw / displayed space

  private ensureRaw(space: ChartSpace): Bounds {
    return this.raw ?? this.resetRawFrom(space)
  }

  // Starts raw space from the current visual state: the inverse of the elastic
  // projection, so a gesture picking up mid-overscroll continues without a jump.
  // The anchor must match the one the following frames will project with.
  private resetRawFrom(space: ChartSpace, anchorOf: (axis: Axis) => number = () => 0.5): Bounds {
    const raw = space.bounds.clone()

    if (this.limits.elastic) {
      for (const axis of this.activeAxes) {
        const limits = this.axisLimits(axis)
        if (!limits.hasAny) continue
        setAxisBounds(raw, axis, invertElasticAxis(getAxisBounds(raw, axis), limits, getAxisSize(axis, space.layout), anchorOf(axis)))
      }
    }

    this.raw = raw
    return raw
  }

  private projectAxis(bounds: AxisBounds, axis: Axis, layoutSize: number, anchorT: number = 0.5): AxisBounds {
    const limits = this.axisLimits(axis)
    if (!limits.hasAny) return bounds
    if (this.limits.elastic) return applyElasticAxis(bounds, limits, layoutSize, anchorT)
    return clampAxisToLimits(bounds, limits, 0.5)
  }

  // Screen fraction the elastic projection is anchored at: the pinch midpoint or the
  // wheel cursor while zooming, the window center otherwise. Keeping the anchor pinned
  // makes elastic overzoom stretch around the point the user is zooming at.
  private currentAnchor(axis: Axis): number {
    if (this.pinch) return clamp(this.pinch.gesture.midAnchor(axis), 0, 1)
    if (this.wheel?.anchor && !this.pan) return this.wheel.anchor[axis]
    return 0.5
  }

  // Re-derives raw so the displayed bounds stay identical when the projection anchor
  // changes (wheel cursor moved, zoom gesture ended)
  private rebaseRawAnchor(raw: Bounds, layout: LayoutValue, fromT: (axis: Axis) => number, toT: (axis: Axis) => number): void {
    if (!this.limits.elastic) return

    for (const axis of this.activeAxes) {
      const limits = this.axisLimits(axis)
      if (!limits.hasAny) continue

      const from = fromT(axis)
      const to = toT(axis)
      if (from === to) continue

      const size = getAxisSize(axis, layout)
      const displayed = applyElasticAxis(getAxisBounds(raw, axis), limits, size, from)
      setAxisBounds(raw, axis, invertElasticAxis(displayed, limits, size, to))
    }
  }

  // px -> chart units conversion for pan: uses the displayed (resisted) range so the
  // content keeps tracking the finger 1:1 even while the range is overzoomed
  private panConversionRange(axis: Axis, start: AxisBounds, layoutSize: number): number {
    const limits = this.axisLimits(axis)
    if (this.isElasticAxis(limits)) return resistedAxisRange(axisRange(start), limits, layoutSize)
    return axisRange(start)
  }

  // With hard limits raw is kept clamped at every application step, each gesture
  // supplying its own anchor. In elastic mode raw is left free on purpose.
  private hardClampAxis(bounds: AxisBounds, axis: Axis, anchorT: number): AxisBounds {
    const limits = this.axisLimits(axis)
    if (this.limits.elastic || !limits.hasAny) return bounds
    return clampAxisToLimits(bounds, limits, anchorT)
  }

  //#endregion

  //#region Velocity sampling

  private recordPanVelocity(cursor: Position): void {
    const pan = this.pan
    if (!pan) return

    const time = this.now()
    const dt = (time - pan.lastSampleTime) / 1000
    const dx = cursor.clientX - pan.lastSampleClientX
    const dy = cursor.clientY - pan.lastSampleClientY
    const moved = dx !== 0 || dy !== 0

    if (moved && isAcceptableSampleDt(dt, pan.averageSampleDt)) {
      const velocity: { x?: number, y?: number } = {}

      for (const axis of this.activeAxes) {
        const size = axis === 'x' ? pan.layoutWidth : pan.layoutHeight
        if (!(size > 0)) continue

        const shift = this.panAxisShift(axis, axis === 'x' ? dx : dy, getAxisBounds(pan.startBounds, axis), size)
        if (Number.isFinite(shift) && shift !== 0) velocity[axis] = shift / dt
      }

      pan.velocity = velocity.x !== undefined || velocity.y !== undefined ? velocity : null

      // pauses are not rate observations, only real move intervals feed the average
      if (dt <= INPUT_STOP_TIMEOUT) {
        pan.averageSampleDt = pan.averageSampleDt === null
          ? dt
          : pan.averageSampleDt + (dt - pan.averageSampleDt) * VELOCITY_SAMPLE_DT_SMOOTHING
      }
    } else if (dt > INPUT_STOP_TIMEOUT) {
      pan.velocity = null
    } else if (moved) {
      return // burst move: accumulate into the next sample, the baseline stays
    }

    pan.lastSampleClientX = cursor.clientX
    pan.lastSampleClientY = cursor.clientY
    pan.lastSampleTime = time
  }

  // Pinch velocity is decomposed into center + logRange channels of the raw solved
  // bounds: zoom inertia continues in zoom terms, not in bounds terms
  private samplePinchVelocity(pinch: PinchState): void {
    const solved = pinch.gesture.solve()
    const sample = {
      x: this.isXAxisEnabled() ? solved.x : null,
      y: this.isYAxisEnabled() ? solved.y : null,
    }
    const time = pinch.updateTime

    if (!pinch.lastSample || pinch.lastSampleTime === null) {
      pinch.lastSample = sample
      pinch.lastSampleTime = time
      return
    }

    const dt = (time - pinch.lastSampleTime) / 1000
    const changed = hasAxisBoundsDelta(pinch.lastSample, sample)

    if (changed && dt >= MIN_VELOCITY_SAMPLE_DT) {
      const velocity = {
        x: axisVelocityBetween(pinch.lastSample.x, sample.x, dt),
        y: axisVelocityBetween(pinch.lastSample.y, sample.y, dt),
      }
      pinch.velocity = velocity.x || velocity.y ? velocity : null
    } else if (dt > INPUT_STOP_TIMEOUT) {
      pinch.velocity = null
    } else if (changed) {
      return // burst update: accumulate into the next sample, the baseline stays
    }

    pinch.lastSample = sample
    pinch.lastSampleTime = time
  }

  //#endregion

  //#region Motion management

  private hasAnyMotion(): boolean {
    return this.motions.x.center !== null || this.motions.x.logRange !== null ||
      this.motions.y.center !== null || this.motions.y.logRange !== null
  }

  private stopAllMotions(): void {
    this.motions.x = { center: null, logRange: null }
    this.motions.y = { center: null, logRange: null }
    if (this.pinch?.ended) this.pinch.inertiaCanceled = true
  }

  // A pan takes over translation but must not interrupt the zoom: the zoom-return
  // spring always survives, zoom inertia survives a touch pan (a mouse pan interrupts
  // any inertia)
  private stopMotionsForPan(isTouch: boolean): void {
    for (const axis of this.activeAxes) {
      const motions = this.motions[axis]
      motions.center = null
      if (motions.logRange?.kind === 'inertia' && (!isTouch || motions.logRange.source !== 'touchZoom')) motions.logRange = null
    }
    if (!isTouch && this.pinch?.ended) this.pinch.inertiaCanceled = true
  }

  // Wheel is active zoom input: it takes over zoom motions (inertia and the zoom-return
  // spring) and center springs, but a pan inertia glide keeps running
  private stopMotionsForWheel(): void {
    for (const axis of this.activeAxes) {
      const motions = this.motions[axis]
      motions.logRange = null
      if (motions.center?.kind === 'spring') motions.center = null
    }
    if (this.pinch?.ended) this.pinch.inertiaCanceled = true
  }

  private hasActiveInput(): boolean {
    return this.pan !== null || this.pinch !== null || this.wheel !== null
  }

  private hasActiveGesture(): boolean {
    return this.pan !== null || this.pinch !== null
  }

  //#endregion

  //#region Utils

  // null when the configured deceleration disables inertia for this input kind
  private inertiaSpec(source: InertiaKind): InertiaSpec | null {
    const deceleration = this.options.deceleration?.[source] ??
      (source === 'touchZoom' ? DEFAULT_TOUCH_ZOOM_DECELERATION : DEFAULT_DECELERATION)
    if (!Number.isFinite(deceleration) || deceleration <= 0 || deceleration >= 1) return null
    return { source, deceleration }
  }

  private axisLimits(axis: Axis): AxisLimits {
    return axis === 'x' ? this.limits.x : this.limits.y
  }

  private isElasticAxis(limits: AxisLimits): boolean {
    return this.limits.elastic && limits.hasAny
  }

  private hasEnabledLimits(): boolean {
    return this.activeAxes.some(axis => this.axisLimits(axis).hasAny)
  }

  private isZoomEnabled(): boolean {
    return (this.options.zoom ?? false) && this.activeAxes.length > 0
  }

  private isXAxisEnabled(): boolean {
    return this.options.panDirection === 'horizontal' || this.options.panDirection === 'all'
  }

  private isYAxisEnabled(): boolean {
    return this.options.panDirection === 'vertical' || this.options.panDirection === 'all'
  }

  private now(): number {
    return performance.now()
  }

  //#endregion
}

// Move events tick at the input/display rate, but occasionally arrive in random bursts
// far more frequent than that, producing garbage velocities. Only intervals close to
// the running average rate are sampled; skipped moves accumulate into the next sample
// because the baseline is not advanced for them.
function isAcceptableSampleDt(dt: number, averageDt: number | null): boolean {
  if (dt < MIN_VELOCITY_SAMPLE_DT) return false
  return averageDt === null || dt >= averageDt * VELOCITY_SAMPLE_OUTLIER_RATIO
}

function zoomAxisAboutAnchor(bounds: AxisBounds, anchorT: number, zoomFactor: number): AxisBounds | null {
  const range = axisRange(bounds)
  const anchorValue = bounds.min + anchorT * range
  const nextRange = range * zoomFactor
  const min = anchorValue - anchorT * nextRange

  return orderedAxisBounds(min, min + nextRange)
}

// Inertia crossing a limit boundary outward hands off to a spring pinned at the
// boundary, carrying the decayed crossing velocity scaled by the rubber band slope
// so the displayed motion is seamless. `springValue` is the boundary expressed in
// the spring's displayed-space units (ln(range) or center).
function inertiaBounceMotion(motion: InertiaMotion, from: number, to: number, boundary: number, elapsed: number, springValue: number, now: number): ChannelMotion {
  const fraction = crossingFraction(from, to, boundary)
  const timeCross = motion.lastElapsed + (elapsed - motion.lastElapsed) * fraction
  const velocity = decayVelocityAt(motion.velocity, motion.deceleration, timeCross) * RUBBER_BAND_COEFF

  return { kind: 'spring', spring: new ScalarSpring(springValue, springValue, velocity), startTime: now }
}

// true or omitted enables the auto-fit follow with the default responsiveness, a
// positive number enables it with a custom natural frequency, false disables it
function normalizeAutoFitFollow(option: boolean | number | undefined): number | null {
  if (option === false) return null
  if (option === undefined || option === true) return DEFAULT_FOLLOW_OMEGA
  if (!Number.isFinite(option) || option <= 0) {
    console.warn(`ZoomChartComponent: autoFitFollow must be a positive number or a boolean, got ${option}, the default is used`)
    return DEFAULT_FOLLOW_OMEGA
  }
  return option
}

// Fraction of the from -> to segment at which the channel crosses the boundary
function crossingFraction(from: number, to: number, boundary: number): number {
  const delta = to - from
  if (!Number.isFinite(delta) || Math.abs(delta) < 1e-12) return 0
  return clamp((boundary - from) / delta, 0, 1)
}

function axisVelocityBetween(previous: AxisBounds | null, next: AxisBounds | null, dt: number): AxisVelocity | null {
  if (!previous || !next || dt <= 0) return null

  const previousRange = axisRange(previous)
  const nextRange = axisRange(next)
  if (!Number.isFinite(previousRange) || !Number.isFinite(nextRange) || previousRange <= 0 || nextRange <= 0) return null

  const center = (axisCenter(next) - axisCenter(previous)) / dt
  const logRange = Math.log(nextRange / previousRange) / dt
  if (!Number.isFinite(center) || !Number.isFinite(logRange)) return null
  if (center === 0 && logRange === 0) return null

  return { center, logRange }
}

function hasAxisBoundsDelta(previous: { x: AxisBounds | null, y: AxisBounds | null }, next: { x: AxisBounds | null, y: AxisBounds | null }): boolean {
  for (const axis of ['x', 'y'] as const) {
    const p = previous[axis]
    const n = next[axis]
    if (!p || !n) continue
    if (p.min !== n.min || p.max !== n.max) return true
  }

  return false
}
