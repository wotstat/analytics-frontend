import { inject, markRaw, onActivated, onDeactivated, onMounted, onUnmounted, provide, shallowRef, type Component, type InjectionKey } from 'vue'

export type BackgroundMode = 'replace' | 'overlay'
export type BackgroundPlacement = 'viewport' | 'page'
export type BackgroundOptions = {
  mode?: BackgroundMode
  placement?: BackgroundPlacement
  props?: Record<string, unknown>
}

export type BackgroundEntry = {
  id: number
  renderId: number
  component: Component
  props?: Record<string, unknown>
  mode: BackgroundMode
  placement: BackgroundPlacement
  depth: number
  order: number
}

export function createBackgroundController() {
  const entries = shallowRef<BackgroundEntry[]>([])
  const heldEntries = shallowRef<BackgroundEntry[]>([])
  let nextId = 0
  let nextRenderId = 0
  let nextOrder = 0
  let holdTimeout: ReturnType<typeof setTimeout> | undefined

  function finishHandoff() {
    if (holdTimeout) clearTimeout(holdTimeout)
    holdTimeout = undefined
    heldEntries.value = []
  }

  return {
    entries,
    heldEntries,
    createId: () => ++nextId,
    beginHandoff() {
      finishHandoff()
      heldEntries.value = entries.value
      if (heldEntries.value.length) holdTimeout = setTimeout(finishHandoff, 10000)
    },
    finishHandoff,
    register(id: number, component: Component, options: BackgroundOptions, depth: number) {
      const previous = entries.value.find(entry => entry.id === id)
      const placement = options.placement ?? 'viewport'
      const changed = !previous || previous.component !== component || previous.placement !== placement
      const entry: BackgroundEntry = {
        id,
        renderId: changed ? ++nextRenderId : previous.renderId,
        component: markRaw(component),
        props: options.props,
        mode: options.mode ?? 'replace',
        placement,
        depth,
        order: changed ? ++nextOrder : previous.order,
      }

      entries.value = [...entries.value.filter(item => item.id !== id), entry]
      finishHandoff()
    },
    unregister(id: number) {
      if (!entries.value.some(entry => entry.id === id)) return
      entries.value = entries.value.filter(entry => entry.id !== id)
    },
  }
}

export type BackgroundController = ReturnType<typeof createBackgroundController>

const backgroundControllerKey: InjectionKey<BackgroundController> = Symbol('backgroundController')
const backgroundDepthKey: InjectionKey<number> = Symbol('backgroundDepth')

export function provideBackgroundController() {
  const controller = createBackgroundController()
  provide(backgroundControllerKey, controller)
  return controller
}

export function useBackgroundController() {
  const controller = inject(backgroundControllerKey)
  if (!controller) throw new Error('Не найден провайдер BackgroundRoot')
  return controller
}

export function useBackground(component: Component, options: BackgroundOptions = {}) {
  const controller = useBackgroundController()
  const depth = inject(backgroundDepthKey, 0) + 1
  provide(backgroundDepthKey, depth)

  const id = controller.createId()
  let active = false
  let currentComponent = component
  let currentOptions = options

  function activate() {
    if (active) return
    active = true
    controller.register(id, currentComponent, currentOptions, depth)
  }

  function deactivate() {
    if (!active) return
    active = false
    controller.unregister(id)
  }

  function update(nextComponent: Component, nextOptions: BackgroundOptions = {}) {
    currentComponent = nextComponent
    currentOptions = nextOptions
    if (active) controller.register(id, currentComponent, currentOptions, depth)
  }

  onMounted(activate)
  onActivated(activate)
  onDeactivated(deactivate)
  onUnmounted(deactivate)

  return { update }
}
