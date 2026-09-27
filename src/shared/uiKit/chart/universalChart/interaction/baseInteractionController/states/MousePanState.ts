import { BaseState } from './BaseState'
import { ClickCandidate } from './ClickCandidate'
import { MouseHoverState } from './MouseHoverState'


const CLASS_NAME = 'pan-active'

export class MousePanState extends BaseState {
  constructor(private readonly click: ClickCandidate, private readonly previousState: MouseHoverState) {
    super()
  }

  created(): void {
    const { initialEvent } = this.click
    this.toggleClass(CLASS_NAME, true)
    this.capturePointer(initialEvent.pointerId)
    const pos = this.event2Position(initialEvent)
    const point = this.offsetToChart(pos)
    this.delegate.onPanBegin(pos, point, this.chart.space, false)
  }

  onTouchMove(event: TouchEvent): void {
    event.preventDefault()
    event.stopPropagation()
  }

  onPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.click.initialEvent.pointerId) return
    const clicked = this.click.finish(event)
    this.endPan(event)
    if (clicked) this.emitClick(event)
  }

  private endPan(event: PointerEvent) {
    this.click.cancel()
    this.releasePointer(this.click.initialEvent.pointerId)
    this.toggleClass(CLASS_NAME, false)
    this.delegate.onPanEnd(this.event2Position(event), this.offsetToChart(this.event2Position(event)), this.chart.space, false)
    this.returnToState(this.previousState)
  }

  onPointerCancel(event: PointerEvent): void {
    if (event.pointerId === this.click.initialEvent.pointerId) this.endPan(event)
  }

  onPointerDown(event: PointerEvent): void {
    this.click.cancel()
  }

  onPointerLeave(event: PointerEvent): void {
    if (event.pointerId === this.click.initialEvent.pointerId) this.click.cancel()
  }

  onPointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.click.initialEvent.pointerId) return
    this.click.move(event)

    event.preventDefault()
    event.stopPropagation()

    const pos = this.event2Position(event)
    const point = this.offsetToChart(pos)
    this.delegate.onPanUpdate(pos, point, this.chart.space, false)
    this.delegate.onHoverUpdate(pos, point, this.chart.space, false)
  }

  onContextmenu(event: PointerEvent): void {
    this.click.cancel()
    event.preventDefault()
    event.stopPropagation()
  }

  onWheel(event: WheelEvent): void {
    this.click.cancel()
    const pos = this.event2Position(event)
    const used = this.delegate.onWheelZoom(pos, this.offsetToChart(pos), this.chart.space, event.deltaY, event.deltaX, event.deltaMode)
    if (used) {
      event.stopPropagation()
      event.preventDefault()
    }
  }
}
