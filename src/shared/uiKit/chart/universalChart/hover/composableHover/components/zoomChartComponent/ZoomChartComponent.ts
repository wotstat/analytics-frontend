import { Size, UniversalChart } from '../../../../UniversalChart'
import { Bounds, BoundsAxes } from '../../../../utils/Bounds'
import { ChartSpace } from '../../../../utils/ChartSpace'
import { Point } from '../../../../utils/Point'
import { InteractionDirection, Position, TouchZoomPoint } from '../../../basePlotHover/BasePlotHover'
import { ComposableHover, HoverComponent } from '../../ComposableHover'
import {
  AxisBounds, DEFAULT_DECELERATION, DEFAULT_TOUCH_ZOOM_DECELERATION, INERTIA_MIN_REMAINING_PIXELS, INPUT_STOP_TIMEOUT, LayoutValue,
  MIN_VELOCITY_SAMPLE_DT, TouchZoomAxis, VELOCITY_SAMPLE_DT_SMOOTHING, VELOCITY_SAMPLE_OUTLIER_RATIO,
  WHEEL_BATCH_TIMEOUT, axisCenter, axisRange, clamp,
  getAxisBounds, getAxisPosition, getAxisSize, orderedAxisBounds, setAxisBounds
} from './common'
import { applyElasticAxis, elasticVelocityFactor, invertElasticAxis } from './elastic'
import { AxisInertia, decayOffset, decayVelocityAt, inertiaRemainingPixels, totalDecayTravel } from './inertia'
import { AxisLimits, NormalizedLimits, clampAxisToLimits, effectiveMaxDelta, isAxisInsideLimits, nearestValidAxisTarget, normalizeLimits } from './limits'
import { AxisSpring, axisSpringBoundsAt, axisSpringTargetBounds, createAxisSpring, isAxisSpringSettled } from './spring'
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

type AxisVelocity = { center: number, logRange: number }

type AxisMotion =
  | ({ kind: 'inertia', source: InertiaKind } & AxisInertia)
  | { kind: 'spring', spring: AxisSpring }

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
  lastEventTime: number
}

type Options = {
  chart: UniversalChart
  zoom?: boolean
  panDirection?: InteractionDirection
  deceleration?: DecelerationOptions
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
// displayed bounds are a stateless projection of raw: identity inside limits, rubber
// band outside (elastic) or clamp (hard). Springs animate displayed bounds directly
// and only ever start after user input has ended.
export class ZoomChartComponent implements HoverComponent {

  protected readonly chart: UniversalChart

  private readonly limits: NormalizedLimits
  private readonly activeAxes: TouchZoomAxis[]
  private readonly enabledBoundsAxes: BoundsAxes

  private pan: PanState | null = null
  private lastCursor: Position | null = null
  private pinch: PinchState | null = null
  private wheel: WheelBatch | null = null
  private motions: { x: AxisMotion | null, y: AxisMotion | null } = { x: null, y: null }
  private raw: Bounds | null = null

  constructor(private readonly options: Options) {
    this.chart = options.chart
    this.limits = normalizeLimits(options.limits)

    this.activeAxes = []
    if (this.isXAxisEnabled()) this.activeAxes.push('x')
    if (this.isYAxisEnabled()) this.activeAxes.push('y')
    this.enabledBoundsAxes = { x: this.isXAxisEnabled(), y: this.isYAxisEnabled() }
  }

  //#region Pan

  mayPan(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): InteractionDirection {
    return this.options.panDirection ?? false
  }

  onPanBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean, composable: ComposableHover): boolean {
    const afterPinch = isTouch && (this.pinch?.ended ?? false)
    if (isTouch) this.stopMotionsForTouchPan()
    else this.stopAllMotions()
    this.lastCursor = null

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
    if (!isTouch) this.stopAllMotions()

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

    const raw = this.resetRawFrom(space)
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

    // wheel is active input: it takes over springs and zoom inertia, but pan inertia keeps running
    for (const axis of this.activeAxes) {
      const motion = this.motions[axis]
      if (!motion) continue
      if (motion.kind === 'spring') {
        this.motions[axis] = null
        this.raw = null
      } else if (motion.source === 'touchZoom') {
        this.motions[axis] = null
      }
    }
    if (this.pinch?.ended) this.pinch.inertiaCanceled = true

    if (!this.wheel) this.wheel = { pending: [], lastEventTime: 0 }
    this.wheel.pending.push({ deltaY, point: { ...point }, layout: { ...space.layout } })
    this.wheel.lastEventTime = this.now()

    return true
  }

  //#endregion

  //#region Apply pipeline

  onBeforeLayout(space: ChartSpace, full: Size): void {
    const now = this.now()

    const hasGesture = this.pan !== null || this.pinch !== null || this.wheel !== null
    const hasMotion = this.motions.x !== null || this.motions.y !== null
    if (!hasGesture && !hasMotion) {
      this.raw = null
      return
    }

    const raw = this.ensureRaw(space)

    const pinchApplied = this.processPinch(raw, space.layout, now)
    this.processPan(raw, space.layout, now)
    if (pinchApplied || this.pinch) this.wheel = null
    else this.processWheel(raw, space.layout, now)

    const inertiaMoved = this.stepInertias(raw, space.layout, now)
    if (inertiaMoved && this.pan && !this.pan.ended) this.pan.startBounds = raw.clone()

    const displayed = this.computeDisplayed(raw, space, now)
    const patch = displayed.toPatch(this.enabledBoundsAxes)
    if (Bounds.isPatchValid(patch) && !space.bounds.isEqualToPatch(patch)) this.chart.setRenderBounds(patch, true)

    if (this.motions.x !== null || this.motions.y !== null || this.wheel !== null) this.chart.scheduleRender()
    if (this.pan === null && this.pinch === null && this.wheel === null && this.motions.x === null && this.motions.y === null) this.raw = null
  }

  private processPinch(raw: Bounds, layout: LayoutValue, now: number): boolean {
    const pinch = this.pinch
    if (!pinch?.dirty) return false
    pinch.dirty = false

    const changed = this.applyPinchBounds(raw, pinch.gesture)

    if (pinch.ended) {
      this.pinch = null
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

    if (wheel.pending.length > 0) {
      let changed = false

      for (const zoom of wheel.pending) {
        const zoomFactor = 1 + zoom.deltaY * 0.001
        if (!Number.isFinite(zoomFactor) || zoomFactor <= 0) continue

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

    // only an elastic wheel batch has release logic: the spring may start after input stops
    if (!this.limits.elastic || !this.hasEnabledLimits() || this.pan || this.pinch) {
      this.wheel = null
      return
    }

    if ((now - wheel.lastEventTime) / 1000 > WHEEL_BATCH_TIMEOUT) {
      this.wheel = null

      for (const axis of this.activeAxes) {
        if (this.motions[axis]) continue
        const limits = this.axisLimits(axis)
        if (!limits.hasAny) continue

        const bounds = getAxisBounds(raw, axis)
        if (isAxisInsideLimits(bounds, limits)) continue

        const displayed = applyElasticAxis(bounds, limits, getAxisSize(axis, layout))
        this.motions[axis] = { kind: 'spring', spring: createAxisSpring(displayed, nearestValidAxisTarget(displayed, limits), 0, 0, now) }
      }
    }
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
      const shift = (axis === 'x' ? -clientDelta : clientDelta) * axisRange(start) / size

      const next = orderedAxisBounds(start.min + shift, start.max + shift)
      if (!next) continue

      setAxisBounds(raw, axis, this.hardClampAxis(next, axis, 0.5))
      changed = true
    }

    return changed
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
    const source: InertiaKind = pan.isTouch ? 'touchPan' : 'mousePan'
    const deceleration = pan.suppressInertia ? null : this.getDeceleration(source)

    for (const axis of this.activeAxes) {
      if (pan.suppressInertia && this.motions[axis]) continue

      const velocity = { center: pan.velocity?.[axis] ?? 0, logRange: 0 }
      const motion = this.decideAxisRelease(axis, getAxisBounds(raw, axis), velocity, deceleration, getAxisSize(axis, layout), source, now)
      if (motion) this.motions[axis] = motion
    }
  }

  private releasePinch(raw: Bounds, layout: LayoutValue, velocity: PinchState['velocity'], now: number): void {
    const deceleration = this.getDeceleration('touchZoom')

    for (const axis of this.activeAxes) {
      const axisVelocity = velocity?.[axis] ?? { center: 0, logRange: 0 }
      const motion = this.decideAxisRelease(axis, getAxisBounds(raw, axis), axisVelocity, deceleration, getAxisSize(axis, layout), 'touchZoom', now)
      if (motion) this.motions[axis] = motion
    }
  }

  // Inside limits: plain inertia. Outside (elastic): inertia when the release velocity
  // is enough to bring bounds back inside, otherwise an immediate spring carrying the
  // release velocity mapped into displayed space.
  private decideAxisRelease(
    axis: TouchZoomAxis,
    rawBounds: AxisBounds,
    velocity: AxisVelocity,
    deceleration: number | null,
    layoutSize: number,
    source: InertiaKind,
    now: number
  ): AxisMotion | null {
    const limits = this.axisLimits(axis)
    const outside = this.limits.elastic && limits.hasAny && !isAxisInsideLimits(rawBounds, limits)

    if (!outside) return createInertiaMotion(velocity, deceleration, source, now)

    const target = nearestValidAxisTarget(rawBounds, limits)
    const needCenter = axisCenter(target) - axisCenter(rawBounds)
    const needLogRange = Math.log(axisRange(target) / axisRange(rawBounds))
    const travelCenter = deceleration !== null ? totalDecayTravel(velocity.center, deceleration) : 0
    const travelLogRange = deceleration !== null ? totalDecayTravel(velocity.logRange, deceleration) : 0

    if (isTravelSufficient(needCenter, travelCenter) && isTravelSufficient(needLogRange, travelLogRange)) {
      return createInertiaMotion(velocity, deceleration, source, now)
    }

    // another input is still active (e.g. pan taking over an ended pinch): it owns the
    // bounds now and its own release will bring them back, springs may not start yet
    if (this.hasActiveInput()) return null

    const factor = elasticVelocityFactor(rawBounds, limits, layoutSize)
    const displayed = applyElasticAxis(rawBounds, limits, layoutSize)

    return {
      kind: 'spring',
      spring: createAxisSpring(
        displayed,
        nearestValidAxisTarget(displayed, limits),
        velocity.center * factor.center,
        velocity.logRange * factor.logRange,
        now
      ),
    }
  }

  //#endregion

  //#region Inertia and spring stepping

  private stepInertias(raw: Bounds, layout: LayoutValue, now: number): boolean {
    let changed = false

    for (const axis of this.activeAxes) {
      const motion = this.motions[axis]
      if (motion?.kind !== 'inertia') continue
      changed = this.stepInertiaAxis(axis, motion, raw, getAxisSize(axis, layout), now) || changed
    }

    return changed
  }

  private stepInertiaAxis(axis: TouchZoomAxis, motion: Extract<AxisMotion, { kind: 'inertia' }>, raw: Bounds, layoutSize: number, now: number): boolean {
    const elapsed = Math.max(0, (now - motion.startTime) / 1000)
    if (elapsed <= motion.lastElapsed) return false

    const offsetDelta = decayOffset(motion.deceleration, elapsed) - decayOffset(motion.deceleration, motion.lastElapsed)
    const current = getAxisBounds(raw, axis)
    const nextCenter = axisCenter(current) + motion.vCenter * offsetDelta
    const nextRange = axisRange(current) * Math.exp(motion.vLogRange * offsetDelta)
    const next = orderedAxisBounds(nextCenter - nextRange / 2, nextCenter + nextRange / 2)
    if (!next) {
      this.motions[axis] = null
      return false
    }

    const limits = this.axisLimits(axis)

    if (limits.hasAny && !this.limits.elastic) {
      const clamped = clampAxisToLimits(next, limits, 0.5)
      if (clamped.min !== next.min || clamped.max !== next.max) {
        setAxisBounds(raw, axis, clamped)
        this.motions[axis] = null
        return true
      }
    }

    if (limits.hasAny && this.limits.elastic && isAxisInsideLimits(current, limits) && !isAxisInsideLimits(next, limits)) {
      // inertia may not overscroll while a gesture is active: springs cannot start here.
      // A lingering wheel batch does not count, the next wheel tick cancels springs anyway
      if (this.hasActiveGesture()) {
        setAxisBounds(raw, axis, clampAxisToLimits(next, limits, 0.5))
        this.motions[axis] = null
        return true
      }

      const fraction = crossingFraction(current, next, limits)
      const timeCross = motion.lastElapsed + (elapsed - motion.lastElapsed) * fraction
      const crossBounds = lerpAxisBounds(current, next, fraction)
      const vCenter = decayVelocityAt(motion.vCenter, motion.deceleration, timeCross)
      const vLogRange = decayVelocityAt(motion.vLogRange, motion.deceleration, timeCross)

      setAxisBounds(raw, axis, crossBounds)
      this.motions[axis] = {
        kind: 'spring',
        spring: createAxisSpring(crossBounds, nearestValidAxisTarget(crossBounds, limits), vCenter, vLogRange, now),
      }
      return true
    }

    motion.lastElapsed = elapsed
    setAxisBounds(raw, axis, next)

    if (inertiaRemainingPixels(motion, next, layoutSize, elapsed) < INERTIA_MIN_REMAINING_PIXELS) {
      this.motions[axis] = null

      // safety net: never leave bounds stranded outside limits
      if (this.limits.elastic && limits.hasAny && !isAxisInsideLimits(next, limits) && !this.hasActiveGesture()) {
        const displayed = applyElasticAxis(next, limits, layoutSize)
        this.motions[axis] = { kind: 'spring', spring: createAxisSpring(displayed, nearestValidAxisTarget(displayed, limits), 0, 0, now) }
      }
    }

    return true
  }

  private computeDisplayed(raw: Bounds, space: ChartSpace, now: number): Bounds {
    const displayed = space.bounds.clone()

    for (const axis of this.activeAxes) {
      const size = getAxisSize(axis, space.layout)
      const motion = this.motions[axis]

      if (motion?.kind === 'spring') {
        const elapsed = Math.max(0, (now - motion.spring.startTime) / 1000)

        if (isAxisSpringSettled(motion.spring, elapsed, size)) {
          const target = axisSpringTargetBounds(motion.spring)
          setAxisBounds(displayed, axis, target)
          setAxisBounds(raw, axis, target)
          this.motions[axis] = null
        } else {
          setAxisBounds(displayed, axis, axisSpringBoundsAt(motion.spring, elapsed))
        }
        continue
      }

      setAxisBounds(displayed, axis, this.projectAxis(getAxisBounds(raw, axis), axis, size))
    }

    return displayed
  }

  //#endregion

  //#region Raw / displayed space

  private ensureRaw(space: ChartSpace): Bounds {
    return this.raw ?? this.resetRawFrom(space)
  }

  // Starts raw space from the current visual state: the inverse of the elastic
  // projection, so a gesture picking up mid-overscroll continues without a jump
  private resetRawFrom(space: ChartSpace): Bounds {
    const raw = space.bounds.clone()

    if (this.limits.elastic) {
      for (const axis of this.activeAxes) {
        const limits = this.axisLimits(axis)
        if (!limits.hasAny) continue
        setAxisBounds(raw, axis, invertElasticAxis(getAxisBounds(raw, axis), limits, getAxisSize(axis, space.layout)))
      }
    }

    this.raw = raw
    return raw
  }

  private projectAxis(bounds: AxisBounds, axis: TouchZoomAxis, layoutSize: number): AxisBounds {
    const limits = this.axisLimits(axis)
    if (!limits.hasAny) return bounds
    if (this.limits.elastic) return applyElasticAxis(bounds, limits, layoutSize)
    return clampAxisToLimits(bounds, limits, 0.5)
  }

  // With hard limits raw is kept clamped at every application step, each gesture
  // supplying its own anchor. In elastic mode raw is left free on purpose.
  private hardClampAxis(bounds: AxisBounds, axis: TouchZoomAxis, anchorT: number): AxisBounds {
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

        const clientDelta = axis === 'x' ? dx : dy
        const shift = (axis === 'x' ? -clientDelta : clientDelta) * axisRange(getAxisBounds(pan.startBounds, axis)) / size
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
      return
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
      return
    }

    pinch.lastSample = sample
    pinch.lastSampleTime = time
  }

  //#endregion

  //#region Motion management

  private stopAllMotions(): void {
    if (this.motions.x?.kind === 'spring' || this.motions.y?.kind === 'spring') this.raw = null
    this.motions.x = null
    this.motions.y = null
    if (this.pinch?.ended) this.pinch.inertiaCanceled = true
  }

  // Touch pan keeps zoom inertia running (it composes with the pan on top),
  // only pan inertia and springs are taken over
  private stopMotionsForTouchPan(): void {
    for (const axis of this.activeAxes) {
      const motion = this.motions[axis]
      if (!motion) continue

      if (motion.kind === 'spring') {
        this.motions[axis] = null
        this.raw = null
      } else if (motion.source !== 'touchZoom') {
        this.motions[axis] = null
      }
    }
  }

  private hasActiveInput(): boolean {
    return this.pan !== null || this.pinch !== null || this.wheel !== null
  }

  private hasActiveGesture(): boolean {
    return this.pan !== null || this.pinch !== null
  }

  //#endregion

  //#region Utils

  private getDeceleration(kind: InertiaKind): number | null {
    const deceleration = this.options.deceleration?.[kind] ??
      (kind == 'touchZoom' ? DEFAULT_TOUCH_ZOOM_DECELERATION : DEFAULT_DECELERATION)
    if (!Number.isFinite(deceleration) || deceleration <= 0 || deceleration >= 1) return null
    return deceleration
  }

  private axisLimits(axis: TouchZoomAxis): AxisLimits {
    return axis === 'x' ? this.limits.x : this.limits.y
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

function createInertiaMotion(velocity: AxisVelocity, deceleration: number | null, source: InertiaKind, now: number): AxisMotion | null {
  if (deceleration === null) return null

  const vCenter = Number.isFinite(velocity.center) ? velocity.center : 0
  const vLogRange = Number.isFinite(velocity.logRange) ? velocity.logRange : 0
  if (vCenter === 0 && vLogRange === 0) return null

  return { kind: 'inertia', source, vCenter, vLogRange, deceleration, startTime: now, lastElapsed: 0 }
}

// Move events tick at the input/display rate, but occasionally arrive in random bursts
// far more frequent than that, producing garbage velocities. Only intervals close to
// the running average rate are sampled; skipped moves accumulate into the next sample
// because the baseline is not advanced for them.
function isAcceptableSampleDt(dt: number, averageDt: number | null): boolean {
  if (dt < MIN_VELOCITY_SAMPLE_DT) return false
  return averageDt === null || dt >= averageDt * VELOCITY_SAMPLE_OUTLIER_RATIO
}

function isTravelSufficient(need: number, travel: number): boolean {
  if (need === 0) return true
  return Math.sign(travel) === Math.sign(need) && Math.abs(travel) >= Math.abs(need)
}

function zoomAxisAboutAnchor(bounds: AxisBounds, anchorT: number, zoomFactor: number): AxisBounds | null {
  const range = axisRange(bounds)
  const anchorValue = bounds.min + anchorT * range
  const nextRange = range * zoomFactor
  const min = anchorValue - anchorT * nextRange

  return orderedAxisBounds(min, min + nextRange)
}

// Fraction of the current -> next segment at which the first limit is crossed
function crossingFraction(current: AxisBounds, next: AxisBounds, limits: AxisLimits): number {
  let fraction = 1

  const consider = (from: number, to: number, boundary: number) => {
    const delta = to - from
    if (!Number.isFinite(delta) || Math.abs(delta) < 1e-12) return
    const f = (boundary - from) / delta
    if (f >= 0 && f < fraction) fraction = f
  }

  if (next.min < limits.min) consider(current.min, next.min, limits.min)
  if (next.max > limits.max) consider(current.max, next.max, limits.max)

  const currentRange = axisRange(current)
  const nextRange = axisRange(next)
  const maxDelta = effectiveMaxDelta(limits)
  if (nextRange > maxDelta) consider(currentRange, nextRange, maxDelta)
  if (nextRange < limits.minDelta) consider(currentRange, nextRange, limits.minDelta)

  return clamp(fraction, 0, 1)
}

function lerpAxisBounds(from: AxisBounds, to: AxisBounds, t: number): AxisBounds {
  return { min: from.min + (to.min - from.min) * t, max: from.max + (to.max - from.max) * t }
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
