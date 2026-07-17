import { DefineComponent, defineComponent, Directive, h, markRaw, onBeforeUnmount, onMounted, onScopeDispose, ref, shallowRef, Slot } from 'vue'
import { OffsetValue, PlacementParam, PlacementWithModifiers, placementWithModifiersVariants } from '../popover/utils'
import { objectEntries } from '@vueuse/core'


type TooltipOptions = {
  delay?: number
  hideDelay?: number
  interactive?: boolean
  interactiveDelay?: number
  interactiveHideDelay?: number
  touchBehavior?: 'toggle' | 'disabled'
}

type DefineTooltipProps = {
  offset?: OffsetValue
  placement?: PlacementParam
  arrowSize?: number,
  viewportOffset?: OffsetValue
  class?: string | Record<string, boolean> | (string | Record<string, boolean>)[]
}

const DEFAULT_TOOLTIP_OPTIONS: Required<TooltipOptions> = {
  delay: 300,
  hideDelay: 100,
  interactive: false,
  interactiveDelay: 300,
  interactiveHideDelay: 300,
  touchBehavior: 'toggle',
}

export type TooltipDefinition = {
  render: Slot
  options: TooltipOptions
  props: DefineTooltipProps
}

const registeredTooltips = new Map<Symbol, TooltipDefinition>()
export type DisplayedTooltip = {
  target: HTMLElement,
  component: DefineComponent,
  options: Required<TooltipOptions>,
  props: DefineTooltipProps
}
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

export function closeTooltip(group: string) {
  const displayed = displayedTooltips.value.get(group)
  if (!displayed) return

  cancelAwaitingShowTooltip(displayed.target)
  cancelAwaitingHideTooltip(group)
  displayedTooltips.value.delete(group)
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
  propsOverrides: DefineTooltipProps,
  isTargetActive: () => boolean,
) {
  let displayed: DisplayedTooltip
  let pointerInside = false
  let focusInside = false

  const tooltipDefinition = registeredTooltips.get(tooltipId)
  if (!tooltipDefinition) throw new Error('Tooltip definition not found')

  const Component = defineComponent({
    setup: () => {
      const element = shallowRef<HTMLElement | null>(null)
      let mountedElement: HTMLElement | null = null

      const requestHide = () => {
        if (pointerInside || focusInside || isTargetActive()) return
        scheduleTooltipHide(group, displayed, options.interactiveHideDelay)
      }

      const pointerEnter = (event: PointerEvent) => {
        if (event.pointerType === 'touch') return

        pointerInside = true
        keepTooltipOpen(group, displayed)
      }

      const pointerLeave = (event: PointerEvent) => {
        if (event.pointerType === 'touch') return

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

      return () => h('div', { ref: element }, [tooltipDefinition.render(bindingValue)])
    }
  }) as DefineComponent & { new(): { $slots: { default(props: any): any } } }

  displayed = markRaw({
    target,
    options: options,
    props: {
      ...tooltipDefinition.props,
      ...propsOverrides
    },
    component: Component,
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
  propsOverrides: DefineTooltipProps,
  isTargetActive: () => boolean,
) {
  const displayed = createDisplayedTooltip(target, tooltipId, group, bindingValue, options, propsOverrides, isTargetActive)

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

function toggleTouchTooltip(
  target: HTMLElement,
  tooltipId: Symbol,
  group: string,
  bindingValue: any,
  options: Required<TooltipOptions>,
  propsOverrides: DefineTooltipProps,
  isTargetActive: () => boolean,
) {
  cancelAwaitingShowTooltip(target)

  const current = displayedTooltips.value.get(group)
  if (current?.target === target) {
    closeTooltip(group)
    return
  }

  const displayed = createDisplayedTooltip(target, tooltipId, group, bindingValue, options, propsOverrides, isTargetActive)
  showTooltip(group, displayed)
}

function cleanupTrigger(target: HTMLElement, group: string) {
  cancelAwaitingShowTooltip(target)

  const displayed = displayedTooltips.value.get(group)
  if (displayed?.target !== target) return

  cancelAwaitingHideTooltip(group, displayed)
  displayedTooltips.value.delete(group)
}


type TooltipHandlers = {
  pointerEnter: (event: PointerEvent) => void
  pointerLeave: (event: PointerEvent) => void
  pointerDown: (event: PointerEvent) => void
  pointerMove: (event: PointerEvent) => void
  pointerUp: (event: PointerEvent) => void
  pointerCancel: (event: PointerEvent) => void
  keyDown: () => void
  focusIn: () => void
  focusOut: (event: FocusEvent) => void
  cleanup: () => void
}

const handlers = new WeakMap<HTMLElement, TooltipHandlers>()
let defaultGroupCounter = 0
const TOUCH_MOVE_THRESHOLD = 8

export function defineTooltip<T>(options?: TooltipOptions) {

  const tooltipId = Symbol('tooltipId')

  const DefineTooltip = defineComponent({
    name: 'DefineTooltip',

    props: {
      offset: Object,
      placement: [String, Array],
      arrowSize: Number,
      viewportOffset: Object,
      class: [String, Object, Array]
    },

    setup(props, { slots }) {
      const tooltipDefinition: TooltipDefinition = {
        render: props => slots.default?.(props) ?? [],
        options: options ?? {},
        props
      }

      registeredTooltips.set(tooltipId, tooltipDefinition)
      onScopeDispose(() => registeredTooltips.delete(tooltipId))

      return () => null
    },
  }) as DefineComponent<DefineTooltipProps> & { new(): { $slots: { default(props: T): any } } }

  const requiredOptions: Required<TooltipOptions> = {
    ...DEFAULT_TOOLTIP_OPTIONS,
    ...options
  }

  const vTooltipTarget: Directive<HTMLElement, T, 'instant' | 'interactive' | PlacementWithModifiers> = {
    mounted(el, binding) {
      let pointerInside = false
      let focusInside = false
      let suppressTouchFocus = false
      let touchPointerId: number | null = null
      let touchStart = { x: 0, y: 0 }
      let touchMoved = false

      const group = binding.arg ?? `default-${defaultGroupCounter++}`

      const overrides = {
        ...requiredOptions,
        interactive: binding.modifiers.interactive ?? requiredOptions.interactive,
        delay: binding.modifiers.instant ? 0 : requiredOptions.delay,
        hideDelay: binding.modifiers.instant ? 0 : requiredOptions.hideDelay,
      }

      const propsOverrides: DefineTooltipProps = Object.fromEntries(objectEntries({
        placement: (() => {
          for (const variant of placementWithModifiersVariants) if (binding.modifiers[variant]) return variant
          return undefined
        })()
      }).filter(([_, value]) => value !== undefined))

      const isActive = () => pointerInside || focusInside
      const activate = () => onTriggerEnter(el, tooltipId, group, binding.value, overrides, propsOverrides, isActive)
      const deactivate = () => onTriggerLeave(el, group, overrides)

      const pointerEnter = (event: PointerEvent) => {
        if (event.pointerType === 'touch') return

        const wasActive = pointerInside || focusInside
        pointerInside = true
        if (!wasActive) activate()
      }

      const pointerLeave = (event: PointerEvent) => {
        if (event.pointerType === 'touch') return

        pointerInside = false
        if (!focusInside) deactivate()
      }

      const pointerDown = (event: PointerEvent) => {
        if (event.pointerType !== 'touch') return

        suppressTouchFocus = true
        if (overrides.touchBehavior === 'disabled') return

        touchPointerId = event.pointerId
        touchStart = { x: event.clientX, y: event.clientY }
        touchMoved = false
      }

      const pointerMove = (event: PointerEvent) => {
        if (event.pointerType !== 'touch' || event.pointerId !== touchPointerId) return

        const distance = Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y)
        if (distance > TOUCH_MOVE_THRESHOLD) touchMoved = true
      }

      const resetTouch = () => {
        touchPointerId = null
        touchMoved = false
      }

      const pointerUp = (event: PointerEvent) => {
        if (event.pointerType !== 'touch' || event.pointerId !== touchPointerId) return

        const shouldToggle = !touchMoved && overrides.touchBehavior === 'toggle'
        resetTouch()

        if (shouldToggle) {
          toggleTouchTooltip(el, tooltipId, group, binding.value, overrides, propsOverrides, isActive)
        }
      }

      const pointerCancel = (event: PointerEvent) => {
        if (event.pointerType === 'touch' && event.pointerId === touchPointerId) resetTouch()
      }

      const keyDown = () => {
        suppressTouchFocus = false
      }

      const focusIn = () => {
        if (suppressTouchFocus) return

        const wasActive = pointerInside || focusInside
        focusInside = true
        if (!wasActive) activate()
      }

      const focusOut = (event: FocusEvent) => {
        if (suppressTouchFocus) {
          suppressTouchFocus = false
          return
        }

        if (event.relatedTarget instanceof Node && el.contains(event.relatedTarget)) return

        focusInside = false
        if (!pointerInside) deactivate()
      }

      const cleanup = () => cleanupTrigger(el, group)

      el.addEventListener('pointerenter', pointerEnter)
      el.addEventListener('pointerleave', pointerLeave)
      el.addEventListener('pointerdown', pointerDown)
      el.addEventListener('pointermove', pointerMove)
      el.addEventListener('pointerup', pointerUp)
      el.addEventListener('pointercancel', pointerCancel)
      el.addEventListener('keydown', keyDown)
      el.addEventListener('focusin', focusIn)
      el.addEventListener('focusout', focusOut)

      handlers.set(el, {
        pointerEnter,
        pointerLeave,
        pointerDown,
        pointerMove,
        pointerUp,
        pointerCancel,
        keyDown,
        focusIn,
        focusOut,
        cleanup,
      })
    },
    unmounted(el) {
      const handler = handlers.get(el)
      if (handler) {
        el.removeEventListener('pointerenter', handler.pointerEnter)
        el.removeEventListener('pointerleave', handler.pointerLeave)
        el.removeEventListener('pointerdown', handler.pointerDown)
        el.removeEventListener('pointermove', handler.pointerMove)
        el.removeEventListener('pointerup', handler.pointerUp)
        el.removeEventListener('pointercancel', handler.pointerCancel)
        el.removeEventListener('keydown', handler.keyDown)
        el.removeEventListener('focusin', handler.focusIn)
        el.removeEventListener('focusout', handler.focusOut)
        handler.cleanup()
        handlers.delete(el)
      }
    }
  }

  return { DefineTooltip, vTooltipTarget }
}
