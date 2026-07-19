import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import { vTooltip } from '@/shared/uiKit/tooltip/textTooltip/textTooltip'
import type { TextTooltipValue } from '@/shared/uiKit/tooltip/types'


function withDefaultViewportOffset(value: TextTooltipValue): TextTooltipValue {
  if (typeof value === 'string') {
    return {
      text: value,
      viewportOffset: popoverViewportOffset.value
    }
  }

  return {
    ...value,
    viewportOffset: value.viewportOffset ?? popoverViewportOffset.value
  }
}

export const vTextTooltip: typeof vTooltip = {
  ...vTooltip,

  mounted(el, binding, vnode, prevVNode) {
    vTooltip.mounted?.(el, {
      ...binding,
      value: withDefaultViewportOffset(binding.value)
    }, vnode, prevVNode)
  },

  updated(el, binding, vnode, prevVNode) {
    vTooltip.updated?.(el, {
      ...binding,
      value: withDefaultViewportOffset(binding.value)
    }, vnode, prevVNode)
  }
}
