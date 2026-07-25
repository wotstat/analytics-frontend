import { BaseState } from './BaseState'
import { MouseHoverState } from './MouseHoverState'


const CLASS_NAME = 'pan-active'

export class MousePanState extends BaseState {
  constructor(private readonly initialEvent: PointerEvent, private readonly previousState: MouseHoverState) {
    super()
  }

  created(): void {
    this.toggleClass(CLASS_NAME, true)
    this.capturePointer(this.initialEvent.pointerId)
    const pos = this.event2Position(this.initialEvent)
    const point = this.offsetToChart(pos)
    this.delegate.onPanBegin(pos, point, this.chart.space, false)
  }

  onTouchMove(event: TouchEvent): void {
    event.preventDefault()
    event.stopPropagation()
  }

  onPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.initialEvent.pointerId) return

    this.releasePointer(this.initialEvent.pointerId)
    this.toggleClass(CLASS_NAME, false)
    this.delegate.onPanEnd(this.event2Position(event), this.offsetToChart(this.event2Position(event)), this.chart.space, false)
    this.returnToState(this.previousState)
  }

  onPointerCancel(event: PointerEvent): void {
    this.onPointerUp(event)
  }

  onPointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.initialEvent.pointerId) return

    event.preventDefault()
    event.stopPropagation()

    const pos = this.event2Position(event)
    const point = this.offsetToChart(pos)
    this.delegate.onPanUpdate(pos, point, this.chart.space, false)
    this.delegate.onHoverUpdate(pos, point, this.chart.space, false)
  }

  onContextmenu(event: PointerEvent): void {
    event.preventDefault()
    event.stopPropagation()
  }

  onWheel(event: WheelEvent): void {
    const pos = this.event2Position(event)
    const used = this.delegate.onWheelZoom(pos, this.offsetToChart(pos), this.chart.space, event.deltaY, event.deltaX)
    if (used) {
      event.stopPropagation()
      event.preventDefault()
    }
  }
}