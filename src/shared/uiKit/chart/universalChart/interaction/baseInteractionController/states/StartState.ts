import { AwaitingTouchPanOrHover } from './AwaitingTouchPanOrHover'
import { BaseState } from './BaseState'
import { MouseHoverState } from './MouseHoverState'
import { isPrimaryPress } from './pointerMovement'


export class StartState extends BaseState {
  onPointerEnter(event: PointerEvent): void {
    if (event.pointerType !== 'touch') this.changeState(new MouseHoverState(event))
  }

  onPointerDown(event: PointerEvent): void {
    if (!isPrimaryPress(event)) return
    if (event.pointerType === 'touch') {
      const pos = this.event2Position(event)
      const point = this.offsetToChart(pos)
      const mayPan = this.delegate.mayPan(pos, point, this.chart.space, true)
      const mayHover = this.delegate.mayHover(pos, point, this.chart.space, true)
      this.changeState(new AwaitingTouchPanOrHover(this.createClickCandidate(event), mayPan, mayHover))
    }
    else {
      const hover = new MouseHoverState(event)
      this.changeState(hover)
      hover.onPointerDown(event)
    }
  }
}
