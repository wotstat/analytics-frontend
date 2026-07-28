import { InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { BaseState } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/states/BaseState'
import { Classes } from '@/shared/uiKit/chart/universalChart/utils/utils'

// Хука на смену состояния у движка нет, а опрос по кадрам пропускает переходы короче
// кадра. Оборачиваем методы StateMachine на конкретном экземпляре — движок не трогаем.
export class ObservableInteractionController extends InteractionController {

  private readonly listeners = new Set<(state: BaseState) => void>()

  constructor(classes: Classes = []) {
    super(classes)

    const machine = this.stateMachine
    const changeState = machine.changeState.bind(machine)
    const returnToState = machine.returnToState.bind(machine)

    machine.changeState = state => {
      changeState(state)
      this.emit(state)
    }

    machine.returnToState = state => {
      returnToState(state)
      this.emit(state)
    }
  }

  onStateChange(listener: (state: BaseState) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(state: BaseState) {
    for (const listener of this.listeners) listener(state)
  }
}
