import { InteractionDirection } from '../BaseInteractionController'
import { BaseState } from './BaseState'
import { ClickCandidate } from './ClickCandidate'
import { StartState } from './StartState'
import { TouchHoverState } from './touch/TouchHoverState'
import { TouchPanState } from './touch/TouchPanState'
import { TouchZoomState } from './touch/TouchZoomState'
import { allowDirection } from './pointerMovement'

const HOVER_BEGIN_TIMEOUT = 75
const PAN_BEGIN_TIMEOUT = 200

export class AwaitingTouchPanOrHover extends BaseState {

  private hoverBeginTimeoutId: number
  private activeEvent: PointerEvent

  constructor(
    private readonly click: ClickCandidate,
    private readonly mayPan: InteractionDirection,
    mayHover: InteractionDirection
  ) {
    super()
    this.activeEvent = click.initialEvent
    this.hoverBeginTimeoutId = mayHover
      ? setTimeout(() => this.hoverBeginTimeout(), mayPan ? PAN_BEGIN_TIMEOUT : HOVER_BEGIN_TIMEOUT)
      : 0
  }

  hoverBeginTimeout() {
    this.hoverBeginTimeoutId = 0
    this.click.cancel()
    this.changeState(new TouchHoverState(this.activeEvent))
  }

  disposed(): void {
    this.clearHoverBeginTimeout()
  }

  private clearHoverBeginTimeout() {
    if (this.hoverBeginTimeoutId) {
      clearTimeout(this.hoverBeginTimeoutId)
      this.hoverBeginTimeoutId = 0
    }
  }

  onPointerDown(event: PointerEvent): void {
    if (event.pointerId == this.activeEvent.pointerId) return
    this.click.cancel()

    const first = this.event2TouchZoomPoint(this.activeEvent)
    const second = this.event2TouchZoomPoint(event)
    if (!this.delegate.mayTouchZoom(first, second, this.chart.space)) return

    this.changeState(new TouchZoomState(this.activeEvent, event))
  }

  onPointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.activeEvent.pointerId) return
    this.activeEvent = event
    this.click.move(event)
    if (event.buttons !== 1) {
      this.changeState(new StartState())
      return
    }

    const { initialEvent } = this.click
    const dx = event.clientX - initialEvent.clientX
    const dy = event.clientY - initialEvent.clientY

    if (this.mayPan && (dx !== 0 || dy !== 0) && allowDirection(this.mayPan, dx, dy)) {
      const pan = new TouchPanState(initialEvent, this.click)
      this.changeState(pan)
      pan.onPointerMove(event)
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.activeEvent.pointerId) return
    const clicked = this.click.finish(event)
    this.changeState(new StartState())
    if (clicked) this.emitClick(event)
  }

  onPointerCancel(event: PointerEvent): void {
    if (event.pointerId !== this.activeEvent.pointerId) return
    this.click.cancel()
    this.changeState(new StartState())
  }

  onPointerLeave(event: PointerEvent): void {
    if (event.pointerId === this.activeEvent.pointerId) this.click.cancel()
  }

  onContextmenu(event: PointerEvent): void {
    this.click.cancel()
  }

  onWheel(event: WheelEvent): void {
    this.click.cancel()
  }
}
