import { DEFAULT_SPRING, spring, SpringFollower, type Spring } from '../../../utils/spring'
import { isFinitePoint, type Point } from '../../../utils/Point'
import { axisCoordinate } from '../../../utils/Axis'
import {
  createInteractionBinding, createInteractionTarget, type InteractionAxis, type InteractionBinding,
  type InteractionKey, type InteractionPivot, type InteractionTarget, type InteractionTrajectory, type PresentedHit,
} from '../../core/InteractionBinding'
import type { InteractionFrame } from '../../core/InteractionFrame'
import type { InteractionHit } from '../../core/InteractionHit'
import type { InteractionResolver } from '../../core/InteractionResolver'
import type { InteractionComponent, InteractionController } from '../InteractionController'
import type { InteractionNavigation } from '../../core/InteractionNavigation'
import { selectionAxis, selectionPivot } from '../../core/utils/selectionBindings'
import { createNavigationBinding } from './navigationBinding'

export { spring, type Spring }

export type InteractionPresentationOptions = { motion?: Spring }

export type AxisPresentationOptions = {
  motion?: Spring
  navigation?: InteractionNavigation
}

export interface PresentedAxis<THit extends InteractionHit = InteractionHit> extends InteractionBinding<number | null> {
  along: (trajectory: InteractionTrajectory) => InteractionBinding<readonly PresentedHit<THit>[]>
  pivot: (pivot?: InteractionPivot<THit>) => InteractionBinding<Point | null>
}

type Motion = { frame: InteractionFrame, follower: SpringFollower }

const MAX_STEP_SECONDS = 0.05

export class InteractionPresentation implements InteractionComponent {
  private readonly motion: Spring
  private controller: InteractionController | null = null
  private revision = 0

  constructor(options: InteractionPresentationOptions = {}) {
    this.motion = spring(options.motion ?? DEFAULT_SPRING)
  }

  attach(root: SVGGElement, controller: InteractionController): void {
    if (this.controller && this.controller !== controller) throw new Error('InteractionPresentation is already attached to another controller')
    this.controller = controller
  }

  detach(): void {
    this.revision++
    this.controller = null
  }

  axis<THit extends InteractionHit>(selection: InteractionResolver<THit>, axis: InteractionAxis,
    options: AxisPresentationOptions = {}): PresentedAxis<THit> {
    const motion = spring(options.motion ?? this.motion)
    const coordinateKey = axisCoordinate(axis)
    let coordinate: InteractionBinding<number | null>
    if (options.navigation) {
      coordinate = createNavigationBinding(selection, axis, options.navigation, motion, {
        isAttached: () => this.controller !== null,
        revision: () => this.revision,
        scheduleRender: () => this.controller?.scheduleRender(),
      })
    } else {
      coordinate = this.animate(selectionAxis(selection, axis), motion)
    }

    return {
      read: coordinate.read,
      along: trajectory => {
        if (trajectory.axis !== axis) throw new RangeError('Trajectory axis must match the presented axis')
        return this.project(selection, coordinate, trajectory)
      },
      pivot: (pivot = 'nearest') => {
        const target = selectionPivot(selection, pivot)
        const freeAxisTarget = createInteractionTarget((frame, follow) => target.evaluate(frame,
          (key, dimension, space, value) => {
            if (dimension === axis) return value
            return follow(key, dimension, space, value)
          }))
        const anchor = this.animate(freeAxisTarget, motion)

        return createInteractionBinding(frame => {
          const value = coordinate.read(frame)
          const point = anchor.read(frame)
          if (value === null || !point) return null
          return { ...point, [coordinateKey]: value }
        })
      },
    }
  }

  animate<T>(source: InteractionTarget<T>, profile: Spring = this.motion): InteractionBinding<T> {
    const motion = spring(profile)
    const states = new Map<InteractionKey, Map<string, Motion>>()
    let revision = this.revision

    return createInteractionBinding(frame => {
      if (revision !== this.revision) {
        states.clear()
        revision = this.revision
      }

      if (!this.controller) return source.read(frame)
      const active = new Map<InteractionKey, Set<string>>()

      const result = source.evaluate(frame, (key, axis, space, target) => {
        if (!Number.isFinite(target)) return target
        const dimension = space + ':' + axis
        let dimensions = active.get(key)
        if (!dimensions) { dimensions = new Set(); active.set(key, dimensions) }
        dimensions.add(dimension)

        let byDimension = states.get(key)
        if (!byDimension) {
          byDimension = new Map()
          states.set(key, byDimension)
        }

        let state = byDimension.get(dimension)
        if (!state) {
          state = { frame, follower: new SpringFollower(target, 0, motion) }
          byDimension.set(dimension, state)
        } else if (state.frame !== frame) {
          const dt = Math.min(Math.max(0, (frame.time - state.frame.time) / 1000), MAX_STEP_SECONDS)
          state.frame = frame
          state.follower.step(target, dt)
        }

        const scale = space === 'chart' ? frame.space.chartToLocalScale() : { scaleX: 1, scaleY: 1 }
        const pxPerUnit = axis === 'horizontal' ? scale.scaleX : scale.scaleY
        if (state.follower.settled(target, pxPerUnit)) {
          state.follower.value = target
          state.follower.velocity = 0
        } else this.controller?.scheduleRender()

        return state.follower.value
      })

      for (const [key, dimensions] of states) {
        const used = active.get(key)
        if (!used) { states.delete(key); continue }
        for (const dimension of dimensions.keys()) if (!used.has(dimension)) dimensions.delete(dimension)
      }
      return result
    })
  }

  project<THit extends InteractionHit>(selection: InteractionResolver<THit>,
    coordinate: InteractionBinding<number | null>, trajectory: InteractionTrajectory): InteractionBinding<readonly PresentedHit<THit>[]> {
    const coordinateKey = axisCoordinate(trajectory.axis)
    return createInteractionBinding(frame => {
      const value = coordinate.read(frame)
      if (value === null || !Number.isFinite(value)) return []

      return frame.resolve(selection).map(hit => {
        const position = { ...hit.geometry.anchor, [coordinateKey]: value }
        const sampled = trajectory.sample(hit, position, frame)
        return { key: hit.sourceId, hit, anchor: sampled && isFinitePoint(sampled) ? sampled : null }
      })
    })
  }

  merge<THit extends InteractionHit>(...bindings: InteractionBinding<readonly PresentedHit<THit>[]>[]): InteractionBinding<readonly PresentedHit<THit>[]> {
    return createInteractionBinding(frame => bindings.flatMap(binding => binding.read(frame)))
  }
}
