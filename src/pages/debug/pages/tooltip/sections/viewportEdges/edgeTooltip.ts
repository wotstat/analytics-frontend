import { computed, ref } from 'vue'
import { useTooltip } from '@/shared/uiKit/tooltip/useTooltip'
import type { OffsetValue, PlacementWithModifiers } from '@/shared/uiKit/popover/utils'
import EdgeLabel from './EdgeLabel.vue'

export const placement = ref<PlacementWithModifiers[]>(['top-float', 'bottom-float'])
export const viewportOffset = ref<OffsetValue>(10)

export const vEdgeTooltip = useTooltip(EdgeLabel, {
  arrowSize: 7,
  offset: 7,
  placement: computed(() => placement.value),
  viewportOffset,
})
