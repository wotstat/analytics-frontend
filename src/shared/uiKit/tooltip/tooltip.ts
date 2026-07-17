import { DefineComponent, defineComponent, Directive, h, markRaw, onBeforeUnmount, onMounted, onScopeDispose, ref, shallowRef, Slot } from 'vue'



type TooltipOptions = {
  delay?: number
  hideDelay?: number
  interactive?: boolean
  interactiveDelay?: number
  interactiveHideDelay?: number
}

const DEFAULT_TOOLTIP_OPTIONS: Required<TooltipOptions> = {
  delay: 300,
  hideDelay: 100,
  interactive: false,
  interactiveDelay: 300,
  interactiveHideDelay: 300,
}

export type TooltipDefinition = {
  render: Slot
  options: TooltipOptions
}

const registeredTooltips = new Map<Symbol, TooltipDefinition>()
export type DisplayedTooltip = { target: HTMLElement, component: DefineComponent }
export const displayedTooltips = ref(new Map<string, DisplayedTooltip>())


type AwaitingShowTooltip = {
  timeoutId: number
  displayed: DisplayedTooltip
}

type AwaitingHideTooltip = {
  timeoutId: number
  displayed: DisplayedTooltip
}

const awaitingShowTooltips = new Map<HTMLElement, AwaitingShowTooltip>()
const awaitingHideTooltips = new Map<string, AwaitingHideTooltip>()
const tooltipPopupActivity = new WeakMap<DisplayedTooltip, () => boolean>()

function cancelAwaitingShowTooltip(target: HTMLElement) {
  const awaiting = awaitingShowTooltips.get(target)
  if (!awaiting) return

  clearTimeout(awaiting.timeoutId)
  awaitingShowTooltips.delete(target)
}

function cancelAwaitingHideTooltip(group: string, displayed?: DisplayedTooltip) {
  const awaiting = awaitingHideTooltips.get(group)
  if (!awaiting || displayed && awaiting.displayed !== displayed) return

  clearTimeout(awaiting.timeoutId)
  awaitingHideTooltips.delete(group)
}

function showTooltip(group: string, displayed: DisplayedTooltip) {
  cancelAwaitingHideTooltip(group)
  displayedTooltips.value.set(group, displayed)
}

function scheduleTooltipShow(target: HTMLElement, group: string, displayed: DisplayedTooltip, delay: number) {
  cancelAwaitingShowTooltip(target)

  const timeoutId = setTimeout(() => {
    const awaiting = awaitingShowTooltips.get(target)
    if (!awaiting || awaiting.timeoutId !== timeoutId || awaiting.displayed !== displayed) return

    awaitingShowTooltips.delete(target)
    showTooltip(group, displayed)
  }, delay)

  awaitingShowTooltips.set(target, { timeoutId, displayed })
}

function scheduleTooltipHide(group: string, displayed: DisplayedTooltip, delay: number) {
  if (displayedTooltips.value.get(group) !== displayed) return

  cancelAwaitingHideTooltip(group)

  const timeoutId = setTimeout(() => {
    const awaiting = awaitingHideTooltips.get(group)
    if (!awaiting || awaiting.timeoutId !== timeoutId) return

    awaitingHideTooltips.delete(group)
    if (displayedTooltips.value.get(group) === displayed) displayedTooltips.value.delete(group)
  }, delay)

  awaitingHideTooltips.set(group, { timeoutId, displayed })
}

function keepTooltipOpen(group: string, displayed: DisplayedTooltip) {
  if (!displayed.target.isConnected) return

  const current = displayedTooltips.value.get(group)
  if (current && current !== displayed) return

  cancelAwaitingHideTooltip(group, displayed)
  if (!current) displayedTooltips.value.set(group, displayed)
}

function createDisplayedTooltip(
  target: HTMLElement,
  tooltipId: Symbol,
  group: string,
  bindingValue: any,
  options: Required<TooltipOptions>,
  isTargetActive: () => boolean,
) {
  let displayed: DisplayedTooltip
  let pointerInside = false
  let focusInside = false

  displayed = markRaw({
    target,
    component: defineComponent({
      setup: () => {
        const element = shallowRef<HTMLElement | null>(null)
        let mountedElement: HTMLElement | null = null

        const requestHide = () => {
          if (pointerInside || focusInside || isTargetActive()) return
          scheduleTooltipHide(group, displayed, options.interactiveHideDelay)
        }

        const pointerEnter = () => {
          pointerInside = true
          keepTooltipOpen(group, displayed)
        }

        const pointerLeave = () => {
          pointerInside = false
          if (focusInside) return

          scheduleTooltipHide(group, displayed, options.interactiveHideDelay)
        }

        const focusIn = () => {
          focusInside = true
          keepTooltipOpen(group, displayed)
        }

        const focusOut = (event: FocusEvent) => {
          if (event.relatedTarget instanceof Node && mountedElement?.contains(event.relatedTarget)) return

          focusInside = false
          requestHide()
        }

        onMounted(() => {
          if (!options.interactive || !element.value) return

          mountedElement = element.value
          mountedElement.addEventListener('pointerenter', pointerEnter)
          mountedElement.addEventListener('pointerleave', pointerLeave)
          mountedElement.addEventListener('focusin', focusIn)
          mountedElement.addEventListener('focusout', focusOut)
        })

        onBeforeUnmount(() => {
          if (!mountedElement) return

          mountedElement.removeEventListener('pointerenter', pointerEnter)
          mountedElement.removeEventListener('pointerleave', pointerLeave)
          mountedElement.removeEventListener('focusin', focusIn)
          mountedElement.removeEventListener('focusout', focusOut)
          mountedElement = null
        })

        return () => h('div', { ref: element }, [
          registeredTooltips
            .get(tooltipId)!
            .render(bindingValue),
        ])
      }
    }),
  })

  tooltipPopupActivity.set(displayed, () => pointerInside || focusInside)
  return displayed
}

function onTriggerEnter(
  target: HTMLElement,
  tooltipId: Symbol,
  group: string,
  bindingValue: any,
  options: Required<TooltipOptions>,
  isTargetActive: () => boolean,
) {
  const displayed = createDisplayedTooltip(target, tooltipId, group, bindingValue, options, isTargetActive)

  cancelAwaitingShowTooltip(target)
  cancelAwaitingHideTooltip(group)

  if (displayedTooltips.value.has(group)) {
    showTooltip(group, displayed)
  } else {
    scheduleTooltipShow(target, group, displayed, options.delay)
  }
}

function onTriggerLeave(target: HTMLElement, group: string, options: Required<TooltipOptions>) {
  cancelAwaitingShowTooltip(target)

  const displayed = displayedTooltips.value.get(group)
  if (displayed?.target !== target) return
  if (options.interactive && tooltipPopupActivity.get(displayed)?.()) return

  const delay = options.interactive ? options.interactiveDelay : options.hideDelay
  scheduleTooltipHide(group, displayed, delay)
}

function cleanupTrigger(target: HTMLElement, group: string) {
  cancelAwaitingShowTooltip(target)

  const displayed = displayedTooltips.value.get(group)
  if (displayed?.target !== target) return

  cancelAwaitingHideTooltip(group, displayed)
  displayedTooltips.value.delete(group)
}


type TooltipHandlers = {
  pointerEnter: () => void
  pointerLeave: () => void
  focusIn: () => void
  focusOut: (event: FocusEvent) => void
  cleanup: () => void
}

const handlers = new WeakMap<HTMLElement, TooltipHandlers>()

export function defineTooltip<T>(options: TooltipOptions) {

  const tooltipId = Symbol('tooltipId')

  const DefineTooltip = defineComponent({
    name: 'DefineTooltip',

    setup(_, { slots }) {
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
    interactiveDelay: options.interactiveDelay ?? DEFAULT_TOOLTIP_OPTIONS.interactiveDelay,
    interactiveHideDelay: options.interactiveHideDelay ?? DEFAULT_TOOLTIP_OPTIONS.interactiveHideDelay,
  }

  const vUseTooltip: Directive<HTMLElement, T, 'hover'> = {
    mounted(el, binding) {
      let pointerInside = false
      let focusInside = false

      const isActive = () => pointerInside || focusInside
      const activate = () => onTriggerEnter(el, tooltipId, binding.arg, binding.value, requiredOptions, isActive)
      const deactivate = () => onTriggerLeave(el, binding.arg, requiredOptions)

      const pointerEnter = () => {
        const wasActive = pointerInside || focusInside
        pointerInside = true
        if (!wasActive) activate()
      }

      const pointerLeave = () => {
        pointerInside = false
        if (!focusInside) deactivate()
      }

      const focusIn = () => {
        const wasActive = pointerInside || focusInside
        focusInside = true
        if (!wasActive) activate()
      }

      const focusOut = (event: FocusEvent) => {
        if (event.relatedTarget instanceof Node && el.contains(event.relatedTarget)) return

        focusInside = false
        if (!pointerInside) deactivate()
      }

      const cleanup = () => cleanupTrigger(el, binding.arg)

      el.addEventListener('pointerenter', pointerEnter)
      el.addEventListener('pointerleave', pointerLeave)
      el.addEventListener('focusin', focusIn)
      el.addEventListener('focusout', focusOut)

      handlers.set(el, { pointerEnter, pointerLeave, focusIn, focusOut, cleanup })
    },
    unmounted(el) {
      const handler = handlers.get(el)
      if (handler) {
        el.removeEventListener('pointerenter', handler.pointerEnter)
        el.removeEventListener('pointerleave', handler.pointerLeave)
        el.removeEventListener('focusin', handler.focusIn)
        el.removeEventListener('focusout', handler.focusOut)
        handler.cleanup()
        handlers.delete(el)
      }
    }
  }

  return { DefineTooltip, vUseTooltip }
}
