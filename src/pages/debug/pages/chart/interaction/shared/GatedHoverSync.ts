import { ChartSpace } from '@/shared/uiKit/chart/universalChart/utils/ChartSpace'
import { HoverResolver, HoverSynchronizer } from '@/shared/uiKit/chart/universalChart/interaction/composable/sync/HoverSynchronizer'

// Тумблер hover-sync. Опция `hoverSync` задаётся в конструкторе компонента, поэтому
// вместо пересборки компонентов консьюмеры получают этот прокси: подписки всегда идут
// в настоящий хаб, гасится только `resolve`.
export class GatedHoverSync implements HoverResolver {

  enabled = false

  constructor(readonly hub: HoverSynchronizer) { }

  resolve(space: ChartSpace) {
    return this.enabled ? this.hub.resolve(space) : null
  }

  get isTouch() {
    return this.hub.isTouch
  }

  subscribeChange(callback: () => void) {
    return this.hub.subscribeChange(callback)
  }

  unsubscribeChange(callback: () => void) {
    this.hub.unsubscribeChange(callback)
  }
}
