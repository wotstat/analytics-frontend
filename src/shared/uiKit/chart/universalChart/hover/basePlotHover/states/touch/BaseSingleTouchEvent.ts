import { Point } from '../../../../utils/Point'
import { Position } from '../../BasePlotHover'
import { BaseState } from '../BaseState'
import { StartState } from '../StartState'

export abstract class BaseSingleTouchEvent extends BaseState {

  constructor(private activeEvent: PointerEvent, private CLASS_NAME: string) {
    super()
  }

  abstract beginEvent(pos: Position, point: Point, space: any): void
  abstract updateEvent(pos: Position, point: Point, space: any): void
  abstract endEvent(pos: Position, point: Point, space: any): void
  abstract getZoomEvent(firstEvent: PointerEvent, secondEvent: PointerEvent): BaseState

  created(): void {
    const pos = this.event2Position(this.activeEvent)
    const point = this.offsetToChart(pos)
    this.beginEvent(pos, point, this.chart.space)
    this.toggleClass(this.CLASS_NAME, true)
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
    if (event.pointerId == this.activeEvent.pointerId) return

    const pos = this.event2Position(this.activeEvent)
    const point = this.offsetToChart(pos)
    this.endEvent(pos, point, this.chart.space)
    this.toggleClass(this.CLASS_NAME, false)

    this.changeState(this.getZoomEvent(this.activeEvent, event))
  }

  onPointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.activeEvent.pointerId) return
    this.activeEvent = event

    const pos = this.event2Position(event)
    const point = this.offsetToChart(pos)
    this.updateEvent(pos, point, this.chart.space)
  }

  onPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.activeEvent.pointerId) return

    const pos = this.event2Position(event)
    const point = this.offsetToChart(pos)
    this.endEvent(pos, point, this.chart.space)

    this.toggleClass(this.CLASS_NAME, false)
    this.releasePointer(this.activeEvent.pointerId)
    this.changeState(new StartState())
  }
}