import { computed, ref } from 'vue'
import { useTooltip } from '@/shared/uiKit/tooltip/useTooltip'
import type { PlacementWithModifiers } from '@/shared/uiKit/popover/utils'
import DemoTooltip from '../../shared/DemoTooltip.vue'
import type { CardClass } from '../../shared/cardClasses'

// Опции и директива живут в модуле, потому что цель обязана сидеть в компоненте, который
// не перерисовывается от контролов: иначе директива пересоздала бы карточку на каждый чих
// и «жив N мс» ничего бы не доказывал.
export const placement = ref<PlacementWithModifiers | null>('top')
export const offset = ref(8)
export const arrowSize = ref(7)
export const cardClass = ref<CardClass>('')
export const viewportOffset = ref(10)

export const vReactiveTooltip = useTooltip(DemoTooltip, {
  placement: computed(() => placement.value ?? undefined),
  offset: () => offset.value,
  arrowSize,
  viewportOffset,
  class: computed(() => cardClass.value || undefined),
})
