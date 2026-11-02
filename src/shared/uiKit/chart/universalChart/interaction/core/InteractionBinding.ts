import type { Point } from '../../utils/Point'
import type { Axis } from '../../utils/Axis'
import type { InteractionFrame } from './InteractionFrame'
import type { InteractionHit } from './InteractionHit'

export type InteractionKey = string | number | symbol
export type InteractionAxis = Axis
export type InteractionSpace = 'chart' | 'layout'

export interface InteractionBinding<T> {
  read(frame: InteractionFrame): T
}

export type InteractionFollow = (
  key: InteractionKey, axis: InteractionAxis, space: InteractionSpace, value: number
) => number

export interface InteractionTarget<T> extends InteractionBinding<T> {
  evaluate(frame: InteractionFrame, follow: InteractionFollow): T
}

export type PresentedHit<THit extends InteractionHit = InteractionHit> = {
  readonly key: InteractionKey
  readonly hit: THit
  readonly anchor: Point | null
}

export type PresentedCoordinate = {
  readonly key: InteractionKey
  readonly value: number
}

export type InteractionTrajectory = {
  readonly axis: InteractionAxis
  sample: (hit: InteractionHit, point: Point, frame: InteractionFrame) => Point | null
}

export type InteractionPivot<THit extends InteractionHit = InteractionHit> =
  | 'cursor' | 'nearest' | 'avg'
  | 'max-x' | 'min-x' | 'max-y' | 'min-y' | 'max' | 'min'
  | ((hits: readonly [THit, ...THit[]]) => Point)

export function createInteractionBinding<T>(read: (frame: InteractionFrame) => T): InteractionBinding<T> {
  const cache = new WeakMap<InteractionFrame, { value: T }>()
  return {
    read: frame => {
      const cached = cache.get(frame)
      if (cached) return cached.value
      const value = read(frame)
      cache.set(frame, { value })
      return value
    },
  }
}

export function createInteractionTarget<T>(evaluate: InteractionTarget<T>['evaluate']): InteractionTarget<T> {
  const binding = createInteractionBinding(frame => evaluate(frame, (_key, _axis, _space, value) => value))
  return { read: binding.read, evaluate }
}
