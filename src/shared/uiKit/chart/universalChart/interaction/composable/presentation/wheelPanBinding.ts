import { SpringFollower, type Spring } from '../../../utils/spring'
import { createInteractionBinding, type InteractionBinding, type InteractionSpace } from '../../core/InteractionBinding'
import type { InteractionResolver } from '../../core/InteractionResolver'
import { selectionAxis } from '../../core/utils/selectionBindings'
import type { ZoomChartComponent } from '../components/zoomChartComponent/ZoomChartComponent'

type PresentationOwner = {
  isAttached: () => boolean
  revision: () => number
  scheduleRender: () => void
}

export function createWheelPanBinding(selection: InteractionResolver, zoom: ZoomChartComponent,
  motion: Spring, owner: PresentationOwner): InteractionBinding<number | null> {
  const source = selectionAxis(selection, 'horizontal')
  let follower: SpringFollower | null = null
  let cursorFollower: SpringFollower | null = null
  let previous: { time: number, x: number, space: InteractionSpace } | null = null
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
    const panning = pointer !== null && !pointer.isTouch && zoom.isWheelPanning(frame.time)
    const elapsed = (frame.time - (previous?.time ?? frame.time)) / 1000
    const dt = Math.min(Math.max(0, elapsed), 0.05)

    const pxPerUnit = anchor.space === 'chart' ? space.chartToLocalScale().scaleX : 1
    if (previous?.space !== anchor.space) follower = null
    follower ??= new SpringFollower(anchor.value, 0, motion)

    if (panning && !cursorFollower) {
      // Start from the last visible X, before this frame's chart movement.
      cursorFollower = new SpringFollower(previous?.x ?? target, 0, motion)
    }
    if (!panning) cursorFollower = null

    let x: number
    if (cursorFollower && pointer) {
      cursorFollower.step(pointer.point.x, dt)
      if (cursorFollower.settled(pointer.point.x, 1)) {
        cursorFollower.value = pointer.point.x
        cursorFollower.velocity = 0
      }

      x = Math.max(space.layout.x, Math.min(space.layout.x + space.layout.width, cursorFollower.value))
      if (x !== cursorFollower.value) {
        cursorFollower.value = x
        cursorFollower.velocity = 0
      }

      // Resume in the target's coordinate space from the visible position and velocity.
      follower.value = anchor.space === 'chart' ? space.layoutToChartX(x) : x
      follower.velocity = cursorFollower.velocity / pxPerUnit
    } else {
      follower.step(anchor.value, dt)
      if (follower.settled(anchor.value, pxPerUnit)) {
        follower.value = anchor.value
        follower.velocity = 0
      } else owner.scheduleRender()
      x = anchor.space === 'chart' ? space.chartToLayoutX(follower.value) : follower.value
    }

    // Detect gesture completion even when input and chart motion have stopped.
    if (panning) owner.scheduleRender()
    previous = { time: frame.time, x, space: anchor.space }
    return x
  })
}
