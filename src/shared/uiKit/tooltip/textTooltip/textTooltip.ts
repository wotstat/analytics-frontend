import { useTooltip } from '../useTooltip.ts'
import type { TextTooltipValue } from '../types.ts'
import TextTooltip from './TextTooltip.vue'

export const vTooltip = useTooltip(TextTooltip, {
  arrowSize: 7,
  offset: 7,
  valueAdapter: (value: TextTooltipValue) => ({
    contentProps: {
      text: typeof value === 'string' ? value : value.text
    },
    tooltipProps: typeof value === 'string' ? undefined : value
  })
})
