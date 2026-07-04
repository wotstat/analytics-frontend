import { InteractionDirection } from '../BasePlotHover'
import { BaseState } from './BaseState'
import { StartState } from './StartState'
import { TouchHoverState } from './touch/TouchHoverState'
import { TouchPanState } from './touch/TouchPanState'
import { TouchZoomState } from './touch/TouchZoomState'

function allowDirection(direction: InteractionDirection, dx: number, dy: number): boolean {
  if (direction === 'all') return true
  if (direction === 'horizontal') return Math.abs(dx) > Math.abs(dy)
  if (direction === 'vertical') return Math.abs(dy) > Math.abs(dx)
  return false
}

const HOVER_BEGIN_TIMEOUT = 75
const PAN_BEGIN_TIMEOUT = 200
const PAN_BEGIN_DISTANCE = 0

export class AwaitingTouchPanOrHover extends BaseState {

  private hoverBeginTimeoutId: number
  private readonly initialEvent: PointerEvent

  constructor(private activeEvent: PointerEvent, private readonly mayPan: InteractionDirection) {
    super()
    this.initialEvent = activeEvent
    this.hoverBeginTimeoutId = setTimeout(() => this.hoverBeginTimeout(), mayPan ? PAN_BEGIN_TIMEOUT : HOVER_BEGIN_TIMEOUT)
  }

  hoverBeginTimeout() {
    this.hoverBeginTimeoutId = 0
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
    this.changeState(new TouchZoomState(this.activeEvent, event))
  }

  onPointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.activeEvent.pointerId) return
    this.activeEvent = event

    const dx = event.clientX - this.initialEvent.clientX
    const dy = event.clientY - this.initialEvent.clientY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (this.mayPan && distance > PAN_BEGIN_DISTANCE && allowDirection(this.mayPan, dx, dy)) {
      this.changeState(new TouchPanState(event))
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.activeEvent.pointerId) return
    this.changeState(new StartState())
  }

  onPointerCancel(event: PointerEvent): void {
    if (event.pointerId !== this.activeEvent.pointerId) return

    this.clearHoverBeginTimeout()
    this.changeState(new StartState())
  }
}