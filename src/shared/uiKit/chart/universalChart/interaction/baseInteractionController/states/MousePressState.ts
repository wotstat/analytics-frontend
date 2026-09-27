import { InteractionDirection } from '../BaseInteractionController'
import { BaseState } from './BaseState'
import { ClickCandidate } from './ClickCandidate'
import { MouseHoverState } from './MouseHoverState'
import { MousePanState } from './MousePanState'
import { allowDirection } from './pointerMovement'

export class MousePressState extends BaseState {
  constructor(
    private readonly click: ClickCandidate,
    private readonly previousState: MouseHoverState,
    private readonly mayPan: InteractionDirection,
  ) {
    super()
  }

  created(): void {
    this.capturePointer(this.click.initialEvent.pointerId)
  }

  onPointerMove(event: PointerEvent): void {
    const { initialEvent } = this.click
    if (event.pointerId !== initialEvent.pointerId) return
    this.click.move(event)
    if (event.buttons !== 1) {
      this.previousState.onPointerMove(event)
      this.endPress()
      return
    }
    const dx = event.clientX - initialEvent.clientX
    const dy = event.clientY - initialEvent.clientY
    if (this.mayPan && (dx !== 0 || dy !== 0) && allowDirection(this.mayPan, dx, dy)) {
      const pan = new MousePanState(this.click, this.previousState)
      this.changeState(pan)
      pan.onPointerMove(event)
    } else {
      this.previousState.onPointerMove(event)
      if (!this.click.isActive) this.endPress()
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.click.initialEvent.pointerId) return
    const clicked = this.click.finish(event)
    this.previousState.onPointerMove(event)
    this.endPress()
    if (clicked) this.emitClick(event)
  }

  onPointerDown(event: PointerEvent): void {
    this.endPress()
  }

  onPointerLeave(event: PointerEvent): void {
    if (event.pointerId !== this.click.initialEvent.pointerId) return
    this.endPress()
    this.previousState.onPointerLeave(event)
  }

  onPointerCancel(event: PointerEvent): void {
    if (event.pointerId === this.click.initialEvent.pointerId) this.endPress()
  }

  onContextmenu(event: PointerEvent): void {
    this.endPress()
  }

  onWheel(event: WheelEvent): void {
    this.endPress()
    this.previousState.onWheel(event)
  }

  private endPress() {
    this.click.cancel()
    this.releasePointer(this.click.initialEvent.pointerId)
    this.returnToState(this.previousState)
  }
}
