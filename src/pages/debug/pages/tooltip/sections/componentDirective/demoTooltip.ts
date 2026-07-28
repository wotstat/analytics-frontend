import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import { useTooltip } from '@/shared/uiKit/tooltip/useTooltip'
import DemoTooltip from '../../shared/DemoTooltip.vue'
import PropsProbe from '../../shared/PropsProbe.vue'


export const vDemoTooltip = useTooltip(DemoTooltip, {
  arrowSize: 7,
  offset: 8,
  placement: ['top-float', 'bottom-float'],
  viewportOffset: popoverViewportOffset,
})

export const vProbeTooltip = useTooltip(PropsProbe, {
  arrowSize: 7,
  offset: 8,
  placement: ['right', 'bottom-float'],
  viewportOffset: popoverViewportOffset,
})
