import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import { useTooltip } from '@/shared/uiKit/tooltip/useTooltip'
import type { PlacementWithModifiers } from '@/shared/uiKit/popover/utils'
import PlayerCard from './PlayerCard.vue'

export type PlayerValue = {
  nick: string
  battles: number
  placement?: PlacementWithModifiers
  target?: HTMLElement | null
  disabled?: boolean
}

const base = {
  arrowSize: 7,
  offset: 8,
  placement: ['top-float', 'bottom-float'] as PlacementWithModifiers[],
  viewportOffset: popoverViewportOffset,
}

export const vAdaptedTooltip = useTooltip(PlayerCard, {
  ...base,
  valueAdapter: (value: PlayerValue) => ({
    contentProps: { nick: value.nick, battles: value.battles },
    tooltipProps: {
      placement: value.placement,
      target: value.target,
      disabled: value.disabled,
    },
  }),
})

export const vContentOnlyTooltip = useTooltip(PlayerCard, {
  ...base,
  valueAdapter: (value: PlayerValue) => ({
    contentProps: { nick: value.nick, battles: value.battles },
  }),
})
