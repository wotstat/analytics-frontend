import { useTooltip } from '@/shared/uiKit/tooltip/useTooltip'
import RankDistributionTooltip from './RankDistributionTooltip.vue'
import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight.ts'

export const vRankDistributionTooltip = useTooltip(RankDistributionTooltip, {
  arrowSize: 7,
  offset: 8,
  class: 'comp7-tooltip',
  viewportOffset: popoverViewportOffset,
  valueAdapter: value => ({
    contentProps: value,
    tooltipProps: { target: value.target },
  }),
})
