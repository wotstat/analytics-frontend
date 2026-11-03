import { computed, inject, markRaw, onActivated, onDeactivated, onMounted, onUnmounted, provide, shallowRef, type Component, type InjectionKey } from 'vue'

export type BackgroundMode = 'replace' | 'overlay'
export type BackgroundPlacement = 'viewport' | 'page'
export type BackgroundOptions = {
  backgroundKey?: string | symbol
  mode?: BackgroundMode
  placement?: BackgroundPlacement
  props?: Record<string, unknown>
}

export type BackgroundEntry = {
  id: number
  renderId: number
  backgroundKey?: string | symbol
  component: Component
  props?: Record<string, unknown>
  mode: BackgroundMode
  placement: BackgroundPlacement
  depth: number
  order: number
}

function selectVisibleEntries(entries: BackgroundEntry[]) {
  const sorted = [...entries].sort((left, right) => left.depth - right.depth || left.order - right.order)
  const lastReplace = sorted.findLastIndex(entry => entry.mode === 'replace')
  return sorted.slice(Math.max(0, lastReplace))
}

export function createBackgroundController() {
  const entries = shallowRef<BackgroundEntry[]>([])
  const heldEntries = shallowRef<BackgroundEntry[] | null>(null)
  const visibleEntries = computed(() => heldEntries.value ?? selectVisibleEntries(entries.value))
  let nextId = 0
  let nextRenderId = 0
  let nextOrder = 0
  let holdTimeout: ReturnType<typeof setTimeout> | undefined

  function finishHandoff() {
    if (holdTimeout) clearTimeout(holdTimeout)
    holdTimeout = undefined
    if (!heldEntries.value) return

    const held = heldEntries.value
    const visible = selectVisibleEntries(entries.value)
    const available = held.filter(previous => !visible.some(entry => entry.renderId === previous.renderId))

    entries.value = entries.value.map(entry => {
      if (entry.backgroundKey === undefined || !visible.includes(entry)) return entry
      if (held.some(previous => previous.renderId === entry.renderId)) return entry
      const index = available.findIndex(previous => previous.backgroundKey === entry.backgroundKey
        && previous.component === entry.component && previous.placement === entry.placement && previous.mode === entry.mode)
      if (index === -1) return entry
      const [previous] = available.splice(index, 1)
      return { ...entry, renderId: previous.renderId }
    })

    heldEntries.value = null
  }

  return {
    entries,
    visibleEntries,
    createId: () => ++nextId,
    beginHandoff: () => {
      if (holdTimeout) clearTimeout(holdTimeout)
      heldEntries.value = visibleEntries.value
      holdTimeout = setTimeout(finishHandoff, 10000)
    },
    finishHandoff,
    register: (id: number, component: Component, options: BackgroundOptions, depth: number) => {
      const previous = entries.value.find(entry => entry.id === id)
      const placement = options.placement ?? 'viewport'
      const mode = options.mode ?? 'replace'
      const changed = !previous || previous.component !== component || previous.placement !== placement
        || previous.mode !== mode || previous.backgroundKey !== options.backgroundKey
      const entry: BackgroundEntry = {
        id,
        renderId: changed ? ++nextRenderId : previous.renderId,
        backgroundKey: options.backgroundKey,
        component: markRaw(component),
        props: options.props,
        mode,
        placement,
        depth,
        order: changed ? ++nextOrder : previous.order,
      }

      entries.value = [...entries.value.filter(item => item.id !== id), entry]
    },
    unregister: (id: number) => {
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
  if (!controller) throw new Error('BackgroundRoot provider not found')
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
