import { InteractionComponent, InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'

// Тумблеры стенда идут из watchEffect и приходят повторно с тем же значением,
// поэтому нужен учёт уже подключённых: повторный addComponent добавил бы компонент дважды
export class ComponentToggle {

  private readonly present = new Set<InteractionComponent>()

  constructor(private readonly controller: InteractionController) { }

  set(component: InteractionComponent, enabled: boolean) {
    if (enabled === this.present.has(component)) return

    if (enabled) {
      this.controller.addComponent(component)
      this.present.add(component)
    } else {
      this.controller.removeComponent(component)
      this.present.delete(component)
    }
  }
}
