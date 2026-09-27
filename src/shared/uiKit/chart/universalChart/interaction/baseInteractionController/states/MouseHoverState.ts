import { BaseState } from './BaseState'
import { MousePressState } from './MousePressState'
import { MousePanState } from './MousePanState'
import { StartState } from './StartState'
import { isPrimaryPress } from './pointerMovement'

const CLASS_NAME = 'hover-active'


export class MouseHoverState extends BaseState {
  private activePointer: PointerEvent

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
    if (!isPrimaryPress(event)) return

    if (event.pointerType === 'touch') {
      this.endHover(this.activePointer)
      const start = new StartState()
      this.changeState(start)
      start.onPointerDown(event)
      return
    }

    const mayPan = this.delegate.mayPan(this.event2Position(event), this.offsetToChart(this.event2Position(event)), this.chart.space, false)
    const click = this.createClickCandidate(event)
    this.changeState(mayPan && event.pointerType !== 'pen'
      ? new MousePanState(click, this)
      : new MousePressState(click, this, mayPan))
  }

  onPointerMove(event: PointerEvent): void {
    if (this.activePointer.pointerId == event.pointerId) {
      const pos = this.event2Position(event)
      this.activePointer = event
      this.delegate.onHoverUpdate(pos, this.offsetToChart(pos), this.chart.space, false)
    }
  }

  onPointerLeave(event: PointerEvent): void {
    if (this.activePointer.pointerId !== event.pointerId) return
    this.endHover(event)
    this.changeState(new StartState())
  }

  private endHover(event: PointerEvent) {
    const pos = this.event2Position(event)
    const point = this.offsetToChart(pos)

    this.delegate.onHoverEnd(pos, point, this.chart.space, false)
    this.toggleClass(CLASS_NAME, false)
  }

  onWheel(event: WheelEvent): void {
    const pos = this.event2Position(event)
    const used = this.delegate.onWheelZoom(pos, this.offsetToChart(pos), this.chart.space, event.deltaY, event.deltaX, event.deltaMode)
    if (used) {
      event.stopPropagation()
      event.preventDefault()
    }
  }
}
