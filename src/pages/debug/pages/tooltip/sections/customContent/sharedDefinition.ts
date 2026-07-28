import { defineTooltip } from '@/shared/uiKit/tooltip/tooltip'

export const {
  DefineTooltip: SharedDefineTooltip,
  vTooltipTarget: vSharedTarget
} = defineTooltip<string>({ delay: 0, hideDelay: 0 })
