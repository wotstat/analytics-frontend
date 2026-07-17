import { cloneVNode, DefineComponent, defineComponent, Directive, h, markRaw, onBeforeUnmount, onMounted, onScopeDispose, onUnmounted, ref, shallowRef, Slot } from 'vue'



type TooltipOptions = {
  delay?: number
  hideDelay?: number
  interactive?: boolean
}

const DEFAULT_TOOLTIP_OPTIONS: Required<TooltipOptions> = {
  delay: 300,
  hideDelay: 100,
  interactive: false,
}

export type TooltipDefinition = {
  render: Slot
  options: TooltipOptions
}

const registeredTooltips = new Map<Symbol, TooltipDefinition>()
export type DisplayedTooltip = { target: HTMLElement, component: DefineComponent }
export const displayedTooltips = ref(new Map<string, DisplayedTooltip>())


const awaitingShowTooltipsTimeoutId = new Map<HTMLElement, number>()
const awaitingHideTooltipsTimeoutId = new Map<string, number>()

function onPointerEnter(target: HTMLElement, tooltipId: Symbol, group: string, bindingValue: any, options: Required<TooltipOptions>) {

  const displayed: DisplayedTooltip = markRaw({
    target,
    component: defineComponent({
      setup: () => {
        const element = shallowRef<HTMLElement | null>(null)

        onMounted(() => {
          console.log('mounted element:', element.value)
          console.log('mounted', tooltipId, group, bindingValue)
        })

        onBeforeUnmount(() => {
          console.log('unmounting element:', element.value)
        })

        return () => h('div', { ref: element }, [
          registeredTooltips
            .get(tooltipId)!
            .render(bindingValue),
        ])
      }
    }),
  })

  const hideTimeoutId = awaitingHideTooltipsTimeoutId.get(group)
  if (hideTimeoutId) {
    clearTimeout(hideTimeoutId)
    awaitingHideTooltipsTimeoutId.delete(group)
  }

  if (displayedTooltips.value.get(group)) {
    displayedTooltips.value.set(group, displayed)
  } else {
    const timeoutId = setTimeout(() => { displayedTooltips.value.set(group, displayed) }, options.delay)
    awaitingShowTooltipsTimeoutId.set(target, timeoutId)
  }

}

function onPointerLeave(target: HTMLElement, tooltipId: Symbol, group: string, bindingValue: any, options: Required<TooltipOptions>) {
  if (displayedTooltips.value.get(group)?.target === target) {
    const timeoutId = setTimeout(() => { displayedTooltips.value.delete(group) }, options.hideDelay)
    awaitingHideTooltipsTimeoutId.set(group, timeoutId)
  }

  const showTimeoutId = awaitingShowTooltipsTimeoutId.get(target)
  if (showTimeoutId) {
    clearTimeout(showTimeoutId)
    awaitingShowTooltipsTimeoutId.delete(target)
  }
}


const handlers = new WeakMap<HTMLElement, { enter: () => void, leave: () => void }>()

export function defineTooltip<T>(options: TooltipOptions) {

  const tooltipId = Symbol('tooltipId')

  const DefineTooltip = defineComponent({
    name: 'DefineTooltip',

    setup(_, { attrs, slots }) {
      const tooltipDefinition: TooltipDefinition = {
        render: props => slots.default?.(props) ?? [],
        options,
      }

      registeredTooltips.set(tooltipId, tooltipDefinition)
      onScopeDispose(() => registeredTooltips.delete(tooltipId))

      return () => null
    },
  }) as DefineComponent & { new(): { $slots: { default(props: T): any } } }

  const requiredOptions: Required<TooltipOptions> = {
    delay: options.delay ?? DEFAULT_TOOLTIP_OPTIONS.delay,
    hideDelay: options.hideDelay ?? DEFAULT_TOOLTIP_OPTIONS.hideDelay,
    interactive: options.interactive ?? DEFAULT_TOOLTIP_OPTIONS.interactive,
  }

  const vUseTooltip: Directive<HTMLElement, T, 'hover'> = {
    mounted(el, binding) {
      const enter = () => onPointerEnter(el, tooltipId, binding.arg, binding.value, requiredOptions)
      const leave = () => onPointerLeave(el, tooltipId, binding.arg, binding.value, requiredOptions)

      el.addEventListener('pointerenter', enter)
      el.addEventListener('pointerleave', leave)

      handlers.set(el, { enter, leave })
    },
    unmounted(el) {
      const handler = handlers.get(el)
      if (handler) {
        el.removeEventListener('pointerenter', handler.enter)
        el.removeEventListener('pointerleave', handler.leave)
        handlers.delete(el)
      }
    }
  }

  return { DefineTooltip, vUseTooltip }
}