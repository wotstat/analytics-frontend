import { DEFAULT_SPRING, spring, SpringFollower, type Spring } from '../../../utils/spring'
import { isFinitePoint } from '../../../utils/Point'
import {
  createInteractionBinding, type InteractionBinding, type InteractionKey, type InteractionTarget,
  type InteractionTrajectory, type PresentedHit,
} from '../../core/InteractionBinding'
import type { InteractionFrame } from '../../core/InteractionFrame'
import type { InteractionHit } from '../../core/InteractionHit'
import type { InteractionResolver } from '../../core/InteractionResolver'
import type { InteractionComponent, InteractionController } from '../InteractionController'

export { spring, type Spring }

export type InteractionPresentationOptions = { motion?: Spring }

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
        const pxPerUnit = axis === 'x' ? scale.scaleX : scale.scaleY
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
    return createInteractionBinding(frame => {
      const value = coordinate.read(frame)
      if (value === null || !Number.isFinite(value)) return []

      return frame.resolve(selection).map(hit => {
        const position = { ...hit.geometry.anchor, [trajectory.axis]: value }
        const sampled = trajectory.sample(hit, position, frame)
        return { key: hit.sourceId, hit, anchor: sampled && isFinitePoint(sampled) ? sampled : null }
      })
    })
  }

  merge<THit extends InteractionHit>(...bindings: InteractionBinding<readonly PresentedHit<THit>[]>[]): InteractionBinding<readonly PresentedHit<THit>[]> {
    return createInteractionBinding(frame => bindings.flatMap(binding => binding.read(frame)))
  }
}
