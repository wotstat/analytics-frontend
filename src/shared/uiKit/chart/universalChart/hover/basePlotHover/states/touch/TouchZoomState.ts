import { TouchZoomPoint } from '../../BasePlotHover'
import { BaseState } from '../BaseState'
import { TouchPanState } from './TouchPanState'

const CLASS_NAME = 'zoom-active'

export class TouchZoomState extends BaseState {

  private readonly activePointers = new Map<number, TouchZoomPoint>()
  private readonly potentiallyActivePointers = new Map<number, TouchZoomPoint>()

  private readonly capturedEvents = new Map<number, PointerEvent>()

  constructor(private readonly firstEvent: PointerEvent, private readonly secondEvent: PointerEvent) {
    super()
  }

  created(): void {
    this.toggleClass(CLASS_NAME, true)

    this.capturePointerEvent(this.firstEvent)
    this.capturePointerEvent(this.secondEvent)

    this.activePointers.set(this.firstEvent.pointerId, this.eventToZoomPoint(this.firstEvent))
    this.activePointers.set(this.secondEvent.pointerId, this.eventToZoomPoint(this.secondEvent))

    const [first, second] = this.activePointers.values()
    this.delegate.onTouchZoomBegin(first, second, this.chart.space)
  }

  onTouchMove(event: TouchEvent): void {
    event.preventDefault()
    event.stopPropagation()
  }

  onContextmenu(event: PointerEvent): void {
    event.preventDefault()
    event.stopPropagation()
  }

  onPointerDown(event: PointerEvent): void {
    if (this.activePointers.has(event.pointerId)) return

    this.capturePointerEvent(event)
    this.potentiallyActivePointers.set(event.pointerId, this.eventToZoomPoint(event))
  }

  onPointerMove(event: PointerEvent): void {
    this.capturedEvents.set(event.pointerId, event)

    if (this.activePointers.has(event.pointerId)) {
      this.activePointers.set(event.pointerId, this.eventToZoomPoint(event))
      this.updateZoomEvent()
      return
    }

    if (this.potentiallyActivePointers.has(event.pointerId)) {
      this.potentiallyActivePointers.set(event.pointerId, this.eventToZoomPoint(event))
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (this.potentiallyActivePointers.has(event.pointerId)) {
      this.releasePointerEvent(event)
      this.potentiallyActivePointers.delete(event.pointerId)
      return
    }

    if (!this.activePointers.has(event.pointerId)) return

    const [first, second] = this.activePointers.values()
    this.delegate.onTouchZoomEnd(first, second, this.chart.space)

    this.activePointers.delete(event.pointerId)
    this.releasePointerEventById(event.pointerId)

    if (this.potentiallyActivePointers.size > 0) {
      const [newId, newEvent] = this.potentiallyActivePointers.entries().next().value!
      this.potentiallyActivePointers.delete(newId)
      this.activePointers.set(newId, newEvent)

      const [first, second] = this.activePointers.values()
      this.delegate.onTouchZoomBegin(first, second, this.chart.space)
      return
    }

    this.toggleClass(CLASS_NAME, false)
    this.changeState(new TouchPanState(this.capturedEvents.values().next().value!))
  }

  onPointerCancel(event: PointerEvent): void {
    this.onPointerUp(event)
  }

  private updateZoomEvent() {
    if (this.activePointers.size < 2) return

    const [first, second] = this.activePointers.values()
    this.delegate.onTouchZoomUpdate(first, second, this.chart.space)
  }

  private eventToZoomPoint(event: PointerEvent): TouchZoomPoint {
    const cursor = this.event2Position(event)
    const point = this.offsetToChart(cursor)
    return { cursor, point }
  }

  private capturePointerEvent(event: PointerEvent): void {
    this.capturePointer(event.pointerId)
    this.capturedEvents.set(event.pointerId, event)
  }

  private releasePointerEvent(event: PointerEvent): void {
    this.releasePointer(event.pointerId)
    this.capturedEvents.delete(event.pointerId)
  }

  private releasePointerEventById(pointerId: number): void {
    this.releasePointer(pointerId)
    this.capturedEvents.delete(pointerId)
  }

}