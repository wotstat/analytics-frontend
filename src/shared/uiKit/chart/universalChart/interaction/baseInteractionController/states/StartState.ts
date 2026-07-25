import { AwaitingTouchPanOrHover } from './AwaitingTouchPanOrHover'
import { BaseState } from './BaseState'
import { MouseHoverState } from './MouseHoverState'


export class StartState extends BaseState {
  onPointerEnter(event: PointerEvent): void {
    if (event.pointerType == 'touch') {
      const pos = this.event2Position(event)
      const point = this.offsetToChart(pos)
      const mayPan = this.delegate.mayPan(pos, point, this.chart.space, true)
      const mayHover = this.delegate.mayHover(pos, point, this.chart.space, true)
      if (mayPan || mayHover)
        this.changeState(new AwaitingTouchPanOrHover(event, mayPan))
    }
    else {
      this.changeState(new MouseHoverState(event))
    }
  }
}