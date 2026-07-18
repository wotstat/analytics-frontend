type TextTooltipValue = import('./shared/uiKit/tooltip/types').TextTooltipValue
type TooltipModifier = import('./shared/uiKit/tooltip/types').TooltipModifier

type TextTooltipDirectiveBinding = {
  instance: unknown
  value: TextTooltipValue
  oldValue: TextTooltipValue | null
  arg?: string
  modifiers: Partial<Record<TooltipModifier, boolean>>
  dir: unknown
}

// A structural hook keeps template value/modifier checks strict without broadening
// generic component inference through Vue's full ObjectDirective type.
type TextTooltipDirective = {
  mounted: (
    el: HTMLElement,
    binding: TextTooltipDirectiveBinding,
    vnode: unknown,
    prevVNode: null
  ) => void
}

declare module 'vue' {
  interface GlobalDirectives {
    vTooltip: TextTooltipDirective
  }
}

export { }
