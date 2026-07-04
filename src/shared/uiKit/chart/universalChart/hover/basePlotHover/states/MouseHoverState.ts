import { Position } from '../BasePlotHover'
import { BaseState } from './BaseState'
import { MousePanState } from './MousePanState'
import { StartState } from './StartState'

const CLASS_NAME = 'hover-active'

export class MouseHoverState extends BaseState {

  private readonly awaitingPointers = new Map<number, Position>()
  private activePointerId: number

  constructor(initialEvent: PointerEvent) {
    super()
    this.activePointerId = initialEvent.pointerId
    this.awaitingPointers.set(initialEvent.pointerId, this.event2Position(initialEvent))
    initialEvent.preventDefault()
    initialEvent.stopPropagation()
  }

  created() {
    const pos = this.awaitingPointers.get(this.activePointerId)!
    const point = this.offsetToChart(pos)
    if (this.delegate.onHoverBegin(pos, point, this.chart.space, false)) this.requestRender()
    this.toggleClass(CLASS_NAME, true)
  }

  onPointerEnter(event: PointerEvent): void {
    this.awaitingPointers.set(event.pointerId, this.event2Position(event))
  }

  onPointerDown(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId) return
    if ((event.buttons & 1) !== 1) return

    this.changeState(new MousePanState(event, this))
  }

  onPointerMove(event: PointerEvent): void {
    const pos = this.event2Position(event)
    this.awaitingPointers.set(event.pointerId, pos)

    if (event.pointerId !== this.activePointerId) return
    this.delegate.onHoverUpdate(pos, this.offsetToChart(pos), this.chart.space, false)
  }

  onPointerLeave(event: PointerEvent): void {

    this.awaitingPointers.delete(event.pointerId)

    if (event.pointerId !== this.activePointerId) return

    if (this.awaitingPointers.size > 0) {
      const [newActivePointerId, newPos] = this.awaitingPointers.entries().next().value!
      this.activePointerId = newActivePointerId

      this.delegate.onHoverUpdate(newPos, this.offsetToChart(newPos), this.chart.space, false)
    } else {
      const pos = this.event2Position(event)
      const point = this.offsetToChart(pos)

      this.delegate.onHoverEnd(pos, point, this.chart.space, false)
      this.toggleClass(CLASS_NAME, false)
      this.changeState(new StartState())
    }
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