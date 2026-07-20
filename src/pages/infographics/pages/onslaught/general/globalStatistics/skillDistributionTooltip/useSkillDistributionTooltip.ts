import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import { useTooltip } from '@/shared/uiKit/tooltip/useTooltip'
import SkillDistributionTooltip from './SkillDistributionTooltip.vue'

export const vSkillDistributionTooltip = useTooltip(SkillDistributionTooltip, {
  arrowSize: 7,
  offset: 7,
  class: 'comp7-tooltip',
  viewportOffset: popoverViewportOffset,
})
