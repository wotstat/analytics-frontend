import { SpringFollower, type Spring } from '../../../utils/spring'
import { axisCoordinate } from '../../../utils/Axis'
import { createInteractionBinding, type InteractionAxis, type InteractionBinding, type InteractionSpace } from '../../core/InteractionBinding'
import type { InteractionNavigation } from '../../core/InteractionNavigation'
import type { InteractionResolver } from '../../core/InteractionResolver'
import { selectionAxis } from '../../core/utils/selectionBindings'

type PresentationOwner = {
  isAttached: () => boolean
  revision: () => number
  scheduleRender: () => void
}

export function createNavigationBinding(selection: InteractionResolver, axis: InteractionAxis, navigation: InteractionNavigation,
  motion: Spring, owner: PresentationOwner): InteractionBinding<number | null> {
  const source = selectionAxis(selection, axis)
  const coordinateKey = axisCoordinate(axis)
  let follower: SpringFollower | null = null
  let cursorFollower: SpringFollower | null = null
  let previous: { time: number, position: number, space: InteractionSpace } | null = null
  let revision = owner.revision()

  const reset = () => {
    follower = null
    cursorFollower = null
    previous = null
  }

  return createInteractionBinding(frame => {
    if (revision !== owner.revision()) {
      reset()
      revision = owner.revision()
    }
    if (!owner.isAttached()) return source.read(frame)

    const anchor: { space: InteractionSpace, value: number } = { space: 'chart', value: NaN }
    const target = source.evaluate(frame, (_key, _axis, space, value) => {
      anchor.space = space
      anchor.value = value
      return value
    })
    if (target === null || !Number.isFinite(target) || !Number.isFinite(anchor.value)) {
      reset()
      return null
    }

    const { space } = frame
    const pointer = frame.input.pointer ?? frame.effectiveInputFor(selection)?.pointer ?? null
    const captureCursor = pointer !== null && navigation.anchorPolicy(axis, frame.time) === 'cursor'
    const elapsed = (frame.time - (previous?.time ?? frame.time)) / 1000
    const dt = Math.min(Math.max(0, elapsed), 0.05)

    const scale = space.chartToLocalScale()
    const chartScale = axis === 'horizontal' ? scale.scaleX : -scale.scaleY
    const pxPerUnit = anchor.space === 'chart' ? chartScale : 1
    const toChart = (value: number) => {
      if (anchor.space === 'layout') return value
      return axis === 'horizontal' ? space.layoutToChartX(value) : space.layoutToChartY(value)
    }
    const toLayout = (value: number) => {
      if (anchor.space === 'layout') return value
      return axis === 'horizontal' ? space.chartToLayoutX(value) : space.chartToLayoutY(value)
    }
    if (previous?.space !== anchor.space) follower = null
    follower ??= new SpringFollower(anchor.value, 0, motion)

    if (captureCursor && !cursorFollower) {
      // Start from the last visible position, before this frame's chart movement.
      cursorFollower = new SpringFollower(previous?.position ?? target, 0, motion)
    }
    if (!captureCursor) cursorFollower = null

    let position: number
    if (cursorFollower && pointer) {
      const target = pointer.point[coordinateKey]
      cursorFollower.step(target, dt)
      if (cursorFollower.settled(target, 1)) {
        cursorFollower.value = target
        cursorFollower.velocity = 0
      }

      const start = space.layout[coordinateKey]
      const size = axis === 'horizontal' ? space.layout.width : space.layout.height
      position = Math.max(start, Math.min(start + size, cursorFollower.value))
      if (position !== cursorFollower.value) {
        cursorFollower.value = position
        cursorFollower.velocity = 0
      }

      // Resume in the target's coordinate space from the visible position and velocity.
      follower.value = toChart(position)
      follower.velocity = cursorFollower.velocity / pxPerUnit
    } else {
      follower.step(anchor.value, dt)
      if (follower.settled(anchor.value, pxPerUnit)) {
        follower.value = anchor.value
        follower.velocity = 0
      } else owner.scheduleRender()
      position = toLayout(follower.value)
    }

    // Detect gesture completion even when input and chart motion have stopped.
    if (captureCursor) owner.scheduleRender()
    previous = { time: frame.time, position, space: anchor.space }
    return position
  })
}
