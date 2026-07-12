import { ChartSpace } from '../../../../utils/ChartSpace'
import { Point } from '../../../../utils/Point'
import { Position, TouchZoomPoint } from '../../../basePlotHover/BasePlotHover'
import { HoverComponent } from '../../ComposableHover'

export type PointerEvent = {
  cursor: Position
  point: Point
  space: ChartSpace
  isTouch: boolean
}

export type TouchZoomEvent = {
  first: TouchZoomPoint
  second: TouchZoomPoint
  space: ChartSpace
}

export type WheelZoomEvent = {
  cursor: Position
  point: Point
  space: ChartSpace
  deltaY: number
  deltaX: number
}

export type CallbackComponentEvents = {
  hoverBegin: PointerEvent
  hoverUpdate: PointerEvent
  hoverEnd: PointerEvent

  panBegin: PointerEvent
  panUpdate: PointerEvent
  panEnd: PointerEvent

  touchZoomBegin: TouchZoomEvent
  touchZoomUpdate: TouchZoomEvent
  touchZoomEnd: TouchZoomEvent

  wheelZoom: WheelZoomEvent
}


export class CallbackComponent implements HoverComponent {

  private listeners = new Map<keyof CallbackComponentEvents, Set<(data: never) => void>>()

  private setFor<E extends keyof CallbackComponentEvents>(event: E) {
    let set = this.listeners.get(event)
    if (!set) this.listeners.set(event, set = new Set())
    return set as Set<(data: CallbackComponentEvents[E]) => void>
  }

  on<E extends keyof CallbackComponentEvents>(event: E, listener: (data: CallbackComponentEvents[E]) => void): () => void {
    const set = this.setFor(event)
    set.add(listener)
    return () => set.delete(listener)
  }

  off<E extends keyof CallbackComponentEvents>(event: E, listener: (data: CallbackComponentEvents[E]) => void): void {
    this.setFor(event).delete(listener)
  }

  private emit<E extends keyof CallbackComponentEvents>(event: E, data: CallbackComponentEvents[E]): void {
    for (const listener of this.setFor(event)) listener(data)
  }

  onHoverBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean {
    this.emit('hoverBegin', { cursor, point, space, isTouch })
    return false
  }

  onHoverUpdate(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean {
    this.emit('hoverUpdate', { cursor, point, space, isTouch })
    return false
  }

  onHoverEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean {
    this.emit('hoverEnd', { cursor, point, space, isTouch })
    return false
  }

  onPanBegin(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean {
    this.emit('panBegin', { cursor, point, space, isTouch })
    return false
  }

  onPanUpdate(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean {
    this.emit('panUpdate', { cursor, point, space, isTouch })
    return false
  }

  onPanEnd(cursor: Position, point: Point, space: ChartSpace, isTouch: boolean): boolean {
    this.emit('panEnd', { cursor, point, space, isTouch })
    return false
  }

  onTouchZoomBegin(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace): boolean {
    this.emit('touchZoomBegin', { first, second, space })
    return false
  }

  onTouchZoomUpdate(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace): boolean {
    this.emit('touchZoomUpdate', { first, second, space })
    return false
  }

  onTouchZoomEnd(first: TouchZoomPoint, second: TouchZoomPoint, space: ChartSpace): boolean {
    this.emit('touchZoomEnd', { first, second, space })
    return false
  }

  onWheelZoom(cursor: Position, point: Point, space: ChartSpace, deltaY: number, deltaX: number): boolean {
    this.emit('wheelZoom', { cursor, point, space, deltaY, deltaX })
    return false
  }

}
