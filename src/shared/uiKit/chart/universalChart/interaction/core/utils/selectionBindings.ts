import { isFinitePoint, type Point } from '../../../utils/Point'
import {
  createInteractionTarget, type InteractionAxis, type InteractionFollow, type InteractionKey,
  type InteractionPivot, type InteractionSpace, type InteractionTarget, type PresentedCoordinate, type PresentedHit,
} from '../InteractionBinding'
import type { InteractionFrame } from '../InteractionFrame'
import type { InteractionHit } from '../InteractionHit'
import type { InteractionResolver } from '../InteractionResolver'

function coordinate(frame: InteractionFrame, follow: InteractionFollow, key: InteractionKey,
  axis: InteractionAxis, space: InteractionSpace, value: number): number {
  if (space === 'layout') return follow(key, axis, space, value)
  const target = axis === 'x' ? frame.space.layoutToChartX(value) : frame.space.layoutToChartY(value)
  const result = follow(key, axis, space, target)
  return axis === 'x' ? frame.space.chartToLayoutX(result) : frame.space.chartToLayoutY(result)
}

function point(frame: InteractionFrame, follow: InteractionFollow, key: InteractionKey,
  space: InteractionSpace, value: Point): Point | null {
  if (!isFinitePoint(value)) return null
  const result = {
    x: coordinate(frame, follow, key, 'x', space, value.x),
    y: coordinate(frame, follow, key, 'y', space, value.y),
  }
  return isFinitePoint(result) ? result : null
}

function nearest<THit extends InteractionHit>(hits: readonly [THit, ...THit[]]): THit {
  let result = hits[0]
  for (let i = 1; i < hits.length; i++) if (hits[i].distance <= result.distance) result = hits[i]
  return result
}

export function selectionAnchors<THit extends InteractionHit>(selection: InteractionResolver<THit>,
  keyForHit: (hit: THit) => InteractionKey = hit => hit.sourceId): InteractionTarget<readonly PresentedHit<THit>[]> {
  return createInteractionTarget((frame, follow) => frame.resolve(selection).map(hit => {
    const key = keyForHit(hit)
    return { key, hit, anchor: point(frame, follow, key, hit.anchorSpace ?? 'chart', hit.geometry.anchor) }
  }))
}

export function selectionCoordinates<THit extends InteractionHit>(selection: InteractionResolver<THit>,
  axis: InteractionAxis, keyForHit: (hit: THit) => InteractionKey = hit => hit.sourceId): InteractionTarget<readonly PresentedCoordinate[]> {
  return createInteractionTarget((frame, follow) => frame.resolve(selection).flatMap(hit => {
    const key = keyForHit(hit)
    const value = coordinate(frame, follow, key, axis, hit.anchorSpace ?? 'chart', hit.geometry.anchor[axis])
    return Number.isFinite(value) ? [{ key, value }] : []
  }))
}

export function selectionAxis(selection: InteractionResolver, axis: InteractionAxis): InteractionTarget<number | null> {
  return createInteractionTarget((frame, follow) => {
    const hits = frame.resolve(selection)
    if (!hits.length) return null
    const value = hits[0].geometry.anchor[axis]
    const space = hits[0].anchorSpace ?? 'chart'
    if (!Number.isFinite(value) || hits.some(hit =>
      hit.geometry.anchor[axis] !== value || (hit.anchorSpace ?? 'chart') !== space)) return null
    const result = coordinate(frame, follow, 'axis', axis, space, value)
    return Number.isFinite(result) ? result : null
  })
}

export function selectionCursor(selection: InteractionResolver): InteractionTarget<Point | null> {
  return createInteractionTarget((frame, follow) => {
    const hits = frame.resolve(selection)
    if (!hits.length) return null
    const pointer = frame.input.pointer ?? frame.effectiveInputFor(selection)?.pointer
    const anchor = pointer?.point ?? nearest(hits as readonly [InteractionHit, ...InteractionHit[]]).geometry.anchor
    return point(frame, follow, 'cursor', 'layout', anchor)
  })
}

export function selectionPivot<THit extends InteractionHit>(selection: InteractionResolver<THit>,
  pivot: InteractionPivot<THit>): InteractionTarget<Point | null> {
  if (pivot === 'cursor') return selectionCursor(selection)
  return createInteractionTarget((frame, follow) => {
    const hits = frame.resolve(selection)
    if (!hits.length) return null
    const nonEmpty = hits as readonly [THit, ...THit[]]
    const space = hits.every(hit => hit.anchorSpace === 'layout') ? 'layout' : 'chart'
    if (typeof pivot === 'function') return point(frame, follow, 'pivot', space, pivot(nonEmpty))
    if (pivot === 'nearest') {
      const hit = nearest(nonEmpty)
      return point(frame, follow, 'pivot', hit.anchorSpace ?? 'chart', hit.geometry.anchor)
    }

    let sumX = 0
    let sumY = 0
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const hit of hits) {
      const { x, y } = hit.geometry.anchor
      sumX += x
      sumY += y
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }

    let x = sumX / hits.length
    let y = sumY / hits.length
    if (pivot === 'max-x' || pivot === 'max') x = maxX
    if (pivot === 'min-x' || pivot === 'min') x = minX
    // Layout Y grows downwards.
    if (pivot === 'max-y' || pivot === 'max') y = minY
    if (pivot === 'min-y' || pivot === 'min') y = maxY
    return point(frame, follow, 'pivot', space, { x, y })
  })
}
