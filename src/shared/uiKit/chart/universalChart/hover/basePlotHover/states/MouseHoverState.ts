import { InteractionDirection, Position } from '../BasePlotHover'
import { BaseState } from './BaseState'
import { MousePanState } from './MousePanState'
import { StartState } from './StartState'

const CLASS_NAME = 'hover-active'
const PAN_BEGIN_DISTANCE = 0

function allowDirection(direction: InteractionDirection, dx: number, dy: number): boolean {
  if (direction === 'all') return true
  if (direction === 'horizontal') return Math.abs(dx) > Math.abs(dy)
  if (direction === 'vertical') return Math.abs(dy) > Math.abs(dx)
  return false
}


export class MouseHoverState extends BaseState {
  private activePointer: PointerEvent
  private awaitingPenPan: {
    direction: InteractionDirection
    pointerId: number
  } | null = null

  constructor(initialEvent: PointerEvent) {
    super()
    this.activePointer = initialEvent
    initialEvent.preventDefault()
    initialEvent.stopPropagation()
  }

  created() {
    const pos = this.event2Position(this.activePointer)
    const point = this.offsetToChart(pos)
    this.delegate.onHoverBegin(pos, point, this.chart.space, false)
    this.toggleClass(CLASS_NAME, true)
  }

  onPointerDown(event: PointerEvent): void {
    if ((event.buttons & 1) !== 1) return

    const mayPan = this.delegate.mayPan(this.event2Position(event), this.offsetToChart(this.event2Position(event)), this.chart.space, false)
    if (!mayPan) return

    if (event.pointerType == 'pen') {
      this.awaitingPenPan = { direction: mayPan, pointerId: event.pointerId }
    } else {
      this.changeState(new MousePanState(event, this))
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (this.awaitingPenPan?.pointerId == event.pointerId) this.awaitingPenPan = null
  }

  onPointerMove(event: PointerEvent): void {
    if (this.activePointer.pointerId == event.pointerId) {
      const pos = this.event2Position(event)
      this.activePointer = event
      this.delegate.onHoverUpdate(pos, this.offsetToChart(pos), this.chart.space, false)
      return
    }

    if (this.awaitingPenPan && this.awaitingPenPan.pointerId == event.pointerId) {
      const dx = event.clientX - this.activePointer.clientX
      const dy = event.clientY - this.activePointer.clientY
      const distance = Math.sqrt(dx * dx + dy * dy)

      const pos = this.event2Position(event)
      this.delegate.onHoverUpdate(pos, this.offsetToChart(pos), this.chart.space, false)

      if (distance > PAN_BEGIN_DISTANCE) {
        if (allowDirection(this.awaitingPenPan.direction, dx, dy)) {
          this.awaitingPenPan = null
          this.changeState(new MousePanState(event, this))
        } else {
          this.awaitingPenPan = null
        }
      }
    }
  }

  onPointerLeave(event: PointerEvent): void {
    if (this.activePointer.pointerId !== event.pointerId) return

    const pos = this.event2Position(event)
    const point = this.offsetToChart(pos)

    this.delegate.onHoverEnd(pos, point, this.chart.space, false)
    this.toggleClass(CLASS_NAME, false)
    this.changeState(new StartState())
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