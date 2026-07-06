import { Bounds } from '../../../../utils/Bounds'
import { TouchZoomPoint } from '../../../basePlotHover/BasePlotHover'
import {
  AxisBounds, LayoutValue, TOUCH_ZOOM_ACTIVATE_AXIS_DISTANCE, TOUCH_ZOOM_MIN_AXIS_DISTANCE, TOUCH_ZOOM_MIN_DISTANCE,
  TouchZoomAxis, getAxisPosition, getAxisSize, getTouchDistance, orderedAxisBounds
} from './common'

// Pinch axis behavior:
// - 'projection': fingers are separated enough along the axis, both finger chart values track finger positions
// - 'distance': single enabled axis with fingers nearly perpendicular to it, scale by total finger distance
// - 'locked': both axes enabled but fingers too close along this one, pan by midpoint until fingers separate
type TouchZoomAxisMode = 'projection' | 'distance' | 'locked'

type AxisGestureState = {
  mode: TouchZoomAxisMode
  startMin: number
  startMax: number
  startFirstPosition: number
  startSecondPosition: number
  startFirstValue: number
  startSecondValue: number
  startMidValue: number
}

// Solves pinch gesture bounds from the start geometry. Operates purely in raw
// (unresisted) space and knows nothing about limits: they are applied by the component.
export class PinchGesture {

  readonly layout: LayoutValue
  private readonly startTouchDistance: number
  private readonly states: { x: AxisGestureState | null, y: AxisGestureState | null }
  private first: TouchZoomPoint
  private second: TouchZoomPoint

  constructor(
    first: TouchZoomPoint,
    second: TouchZoomPoint,
    layout: LayoutValue,
    startBounds: Bounds,
    axes: { x: boolean, y: boolean },
    lockable: boolean
  ) {
    this.layout = { ...layout }
    this.first = first
    this.second = second
    this.startTouchDistance = getTouchDistance(first.point, second.point)
    this.states = {
      x: axes.x ? this.createAxisState('x', startBounds.minX, startBounds.maxX, lockable) : null,
      y: axes.y ? this.createAxisState('y', startBounds.minY, startBounds.maxY, lockable) : null,
    }
  }

  update(first: TouchZoomPoint, second: TouchZoomPoint): void {
    this.first = first
    this.second = second
  }

  // Current midpoint screen fraction, used as the hard-clamp anchor
  midAnchor(axis: TouchZoomAxis): number {
    return (getAxisPosition(axis, this.first.point, this.layout) + getAxisPosition(axis, this.second.point, this.layout)) / 2
  }

  solve(): { x: AxisBounds | null, y: AxisBounds | null } {
    return { x: this.solveAxis('x'), y: this.solveAxis('y') }
  }

  private createAxisState(axis: TouchZoomAxis, min: number, max: number, lockable: boolean): AxisGestureState | null {
    const size = getAxisSize(axis, this.layout)
    if (!(size > 0) || !Number.isFinite(max - min) || max - min === 0) return null

    const p1 = getAxisPosition(axis, this.first.point, this.layout)
    const p2 = getAxisPosition(axis, this.second.point, this.layout)
    const separated = Math.abs(p2 - p1) * size >= minAxisDistance(size)

    return buildAxisState(separated ? 'projection' : lockable ? 'locked' : 'distance', min, max, p1, p2)
  }

  private solveAxis(axis: TouchZoomAxis): AxisBounds | null {
    const state = this.states[axis]
    if (!state) return null

    const currentDistance = getTouchDistance(this.first.point, this.second.point)
    if (this.startTouchDistance < TOUCH_ZOOM_MIN_DISTANCE || currentDistance < TOUCH_ZOOM_MIN_DISTANCE) return null

    const size = getAxisSize(axis, this.layout)
    const p1 = getAxisPosition(axis, this.first.point, this.layout)
    const p2 = getAxisPosition(axis, this.second.point, this.layout)

    if (state.mode === 'locked') {
      const startMidPosition = (state.startFirstPosition + state.startSecondPosition) / 2
      const bounds = solvePanAxisBounds(state.startMin, state.startMax, startMidPosition, (p1 + p2) / 2)

      if (Math.abs(p2 - p1) * size >= activateAxisDistance(size)) this.activateAxis(axis, state, bounds, p1, p2)
      return bounds
    }

    if (state.mode === 'projection') {
      const [firstValue, secondValue] = state.startFirstPosition <= state.startSecondPosition
        ? [state.startFirstValue, state.startSecondValue]
        : [state.startSecondValue, state.startFirstValue]
      const [lowPosition, highPosition] = p1 <= p2 ? [p1, p2] : [p2, p1]
      const startPositionDelta = Math.abs(state.startSecondPosition - state.startFirstPosition)
      const [q1, q2] = clampAxisPositions(lowPosition, highPosition, minAxisDistance(size) / size, startPositionDelta)

      return solveProjectionAxisBounds(firstValue, secondValue, q1, q2)
    }

    return solveDistanceAxisBounds(state.startMin, state.startMax, state.startMidValue, (p1 + p2) / 2, this.startTouchDistance, currentDistance)
  }

  // A locked axis becomes a regular projection pinch once the fingers separate enough,
  // rebased from the current (pan-shifted) bounds so there is no jump
  private activateAxis(axis: TouchZoomAxis, state: AxisGestureState, current: AxisBounds | null, p1: number, p2: number): void {
    const min = current?.min ?? state.startMin
    const max = current?.max ?? state.startMax
    if (!Number.isFinite(max - min) || max - min === 0) return

    this.states[axis] = buildAxisState('projection', min, max, p1, p2)
  }
}

function buildAxisState(mode: TouchZoomAxisMode, min: number, max: number, p1: number, p2: number): AxisGestureState {
  const range = max - min
  return {
    mode,
    startMin: min,
    startMax: max,
    startFirstPosition: p1,
    startSecondPosition: p2,
    startFirstValue: min + p1 * range,
    startSecondValue: min + p2 * range,
    startMidValue: min + ((p1 + p2) / 2) * range,
  }
}

function minAxisDistance(axisSize: number): number {
  return Math.min(TOUCH_ZOOM_MIN_AXIS_DISTANCE, axisSize / 4)
}

function activateAxisDistance(axisSize: number): number {
  return Math.min(TOUCH_ZOOM_ACTIVATE_AXIS_DISTANCE, axisSize / 3)
}

// Bounds such that both start chart values land at the given screen fractions
function solveProjectionAxisBounds(firstValue: number, secondValue: number, firstPosition: number, secondPosition: number): AxisBounds | null {
  const positionDelta = secondPosition - firstPosition
  if (!Number.isFinite(positionDelta) || Math.abs(positionDelta) < 0.0001) return null

  const range = (secondValue - firstValue) / positionDelta
  const min = firstValue - firstPosition * range

  return orderedAxisBounds(min, min + range)
}

function solvePanAxisBounds(startMin: number, startMax: number, startPosition: number, currentPosition: number): AxisBounds | null {
  const range = startMax - startMin
  const positionDelta = currentPosition - startPosition
  if (!Number.isFinite(range) || !Number.isFinite(positionDelta) || range === 0) return null

  const shift = -positionDelta * range

  return orderedAxisBounds(startMin + shift, startMax + shift)
}

function solveDistanceAxisBounds(
  startMin: number,
  startMax: number,
  startMidValue: number,
  currentMidPosition: number,
  startDistance: number,
  currentDistance: number
): AxisBounds | null {
  const zoomFactor = currentDistance / startDistance
  if (!Number.isFinite(zoomFactor) || zoomFactor <= 0) return null

  const range = (startMax - startMin) / zoomFactor
  const min = startMidValue - currentMidPosition * range

  return orderedAxisBounds(min, min + range)
}

// Fingers projected too close on the axis would explode the projection solve,
// spread them symmetrically to the minimum allowed separation instead
function clampAxisPositions(first: number, second: number, minPositionDelta: number, fallbackPositionDelta: number): [number, number] {
  const positionDelta = second - first
  if (!Number.isFinite(positionDelta) || !Number.isFinite(minPositionDelta) || minPositionDelta <= 0) return [first, second]
  if (Math.abs(positionDelta) >= minPositionDelta) return [first, second]

  const midpoint = (first + second) / 2
  if (!Number.isFinite(midpoint)) return [first, second]

  const sign = Math.sign(positionDelta) || Math.sign(fallbackPositionDelta) || 1
  const halfDelta = minPositionDelta / 2

  return [midpoint - sign * halfDelta, midpoint + sign * halfDelta]
}
