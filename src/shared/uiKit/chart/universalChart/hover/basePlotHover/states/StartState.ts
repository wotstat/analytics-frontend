import { BaseState } from './BaseState'
import { MouseHoverState } from './MouseHoverState'


export class StartState extends BaseState {
  onPointerEnter(event: PointerEvent): void {
    if (event.pointerType == 'touch') return
    this.changeState(new MouseHoverState(event))
  }
}