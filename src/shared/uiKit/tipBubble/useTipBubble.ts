import { computed, defineComponent, h, onMounted, onUnmounted, Ref, ref, watch, watchEffect } from 'vue'
import TipBubble from './TipBubbleComponent.vue'
import { useLocalStorage } from '@vueuse/core'

declare global {
  interface Window {
    resetTipBubbles?: () => void
  }
}


export type Options = {
  key: string,
  groupKey?: string,
  direction?: 'left' | 'right' | 'auto',
  pagePadding?: number | string,
  displayDelay?: number,
  showBubble?: 'always' |
  { type: 'after-open', count: number } |
  { type: 'after-wrong', count: number }
  autoExtend?: 'always' | 'force-extend' |
  { type: 'always', interactSnooze?: number } |
  { type: 'after-open', count: number, interactSnooze?: number } |
  { type: 'after-show-bubble', count: number, interactSnooze?: number } |
  { type: 'after-wrong', count: number, interactSnooze?: number, hideSnooze?: number | 'reset' }
}

type BubbleState = {
  openCount: number
  showCount: number
  wrongCount: number
  visibleWrongCount: number
  lastInteractOpen: number
  lastInteractShow: number
  lastInteractWrong: number
  lastHideWrong: number
  accepted: boolean
}

export const debugInfo = ref({
  bubbles: new Map<string, {
    state: BubbleState | null,
    alwaysHidden: boolean,
    props: { mayDisplay: boolean, displayed: boolean, autoExtend: boolean, shouldDisplay: boolean } | null
  }>(),
  groups: new Map<string, { displayedBubble: string | null, waitingQueue: string[] }>()
})

function useDebugInfo(key: string, state: Ref<BubbleState | null>,
  showBubble: Ref<boolean>, shouldShowBubble: Ref<boolean>, autoExtend: Ref<boolean>, mayShowBubble: Ref<boolean>) {
  onMounted(() => debugInfo.value.bubbles.set(key, {
    state: state.value,
    alwaysHidden: false,
    props: { displayed: showBubble.value, autoExtend: autoExtend.value, mayDisplay: mayShowBubble.value, shouldDisplay: shouldShowBubble.value }
  }))
  onUnmounted(() => debugInfo.value.bubbles.delete(key))
  watch([showBubble, shouldShowBubble, autoExtend, mayShowBubble], () => {
    const info = debugInfo.value.bubbles.get(key)
    if (!info || !info.props) return
    info.props.displayed = showBubble.value
    info.props.autoExtend = autoExtend.value
    info.props.mayDisplay = mayShowBubble.value
    info.props.shouldDisplay = shouldShowBubble.value
  })
}

const GROUP_SWITCH_DELAY = 400 // time to wait before allowing to show another bubble in the same group after one is hidden
export const TIP_BUBBLE_STORAGE_PREFIX = 'tip-bubble-storage'
const storageKey = (key: string) => `${TIP_BUBBLE_STORAGE_PREFIX}:${key}`

const EmptyComponent = {
  Component: defineComponent(() => () => null),
  setDisplayed: () => { },
  display: () => { },
  hide: () => { },
  accept: () => { },
  wrong: () => { },
}

class Group {
  private displayedBubble = null as string | null
  private readonly waitingQueue = new Map<string, () => void>()

  constructor(public readonly key: string) {
    debugInfo.value.groups.set(key, { displayedBubble: this.displayedBubble, waitingQueue: Array.from(this.waitingQueue.keys()) })
  }

  setDisplayed(key: string, displayed: boolean) {
    if (displayed) {
      if (this.displayedBubble === key) return
      if (this.displayedBubble !== null) {
        console.warn(`Trying to display bubble ${key} in group ${this.key} while ${this.displayedBubble} is already displayed`)
        return
      }
      this.displayedBubble = key
    }
    else {
      this.displayedBubble = null
    }
    this.update()
  }

  addToWaitingQueue(key: string, onAllowed: () => void) {
    if (this.waitingQueue.has(key)) return
    if (this.displayedBubble === key) return onAllowed()
    this.waitingQueue.set(key, onAllowed)
    this.update()
  }

  removeFromWaitingQueue(key: string) {
    this.waitingQueue.delete(key)
    this.update()
  }

  private update() {
    if (this.displayedBubble === null && this.waitingQueue.size == 0) debugInfo.value.groups.delete(this.key)
    else debugInfo.value.groups.set(this.key, { displayedBubble: this.displayedBubble, waitingQueue: Array.from(this.waitingQueue.keys()) })

    const allowed = this.displayedBubble === null
    if (!allowed) return
    if (this.waitingQueue.size == 0) return

    const firstKey = this.waitingQueue.keys().next().value
    if (!firstKey) return

    const onAllowed = this.waitingQueue.get(firstKey)
    if (!onAllowed) return

    onAllowed()
    this.displayedBubble = firstKey
    this.waitingQueue.delete(firstKey)
    this.update()
  }
}

class GroupController {
  private groups = new Map<string, Group>()

  getGroup(key: string) {
    if (!this.groups.has(key)) this.groups.set(key, new Group(key))
    return this.groups.get(key)!
  }
}

const groupController = new GroupController()

export function isAlwaysHidden(key: string) {
  const item = localStorage.getItem(storageKey(key))
  if (!item) return false

  try {
    const state = JSON.parse(item) as BubbleState
    return state.accepted
  } catch {
    return false
  }
}

export function useTipBubble(options: Options) {
  debugInfo.value.bubbles.set(options.key, { state: null, alwaysHidden: true, props: null })
  if (isAlwaysHidden(options.key)) return EmptyComponent

  const mayShowBubble = ref(false)
  const allowGroupedShow = ref(!options.groupKey)

  const group = options.groupKey ? groupController.getGroup(options.groupKey) : null

  const state = useLocalStorage<BubbleState>(storageKey(options.key), {
    openCount: 0,
    showCount: 0,
    wrongCount: 0,
    visibleWrongCount: 0,
    lastInteractOpen: 0,
    lastInteractShow: 0,
    lastInteractWrong: 0,
    lastHideWrong: 0,
    accepted: false
  }, { listenToStorageChanges: true, deep: true, flush: 'post' })

  const shouldShowBubble = computed(() => {
    const showBubble = options.showBubble
    if (!showBubble) return true
    if (showBubble === 'always') return true

    if (showBubble.type === 'after-open') return state.value.openCount >= showBubble.count
    if (showBubble.type === 'after-wrong') return state.value.wrongCount >= showBubble.count
    return false
  })

  const mayAutoExtend = computed(() => {
    const autoExtend = options.autoExtend

    if (autoExtend === 'force-extend') return true
    if (!autoExtend) return false
    if (autoExtend === 'always') return true
    if (autoExtend.type === 'always') return true

    const { openCount, showCount, visibleWrongCount, lastInteractOpen, lastInteractShow, lastInteractWrong, lastHideWrong } = state.value

    const targetSnooze = autoExtend.interactSnooze || 1e10
    if (autoExtend.type === 'after-open') {
      if (openCount <= autoExtend.count) return false

      if (lastInteractOpen)
        if (lastInteractOpen + targetSnooze > openCount) return false

      return true
    }

    if (autoExtend.type === 'after-wrong') {

      if (visibleWrongCount < autoExtend.count) return false

      if (lastHideWrong && autoExtend.hideSnooze) {
        const snooze = autoExtend.hideSnooze === 'reset' ? autoExtend.count : autoExtend.hideSnooze
        if (lastHideWrong + snooze > visibleWrongCount) return false
      }

      if (lastInteractWrong)
        if (lastInteractWrong + targetSnooze > visibleWrongCount) return false

      return true
    }

    if (autoExtend.type === 'after-show-bubble') {
      if (showCount < autoExtend.count) return false

      if (lastInteractShow) {
        if (lastInteractShow + targetSnooze > showCount) return false
      }

      return true
    }

    return false
  })

  const showBubble = computed(() => mayShowBubble.value && shouldShowBubble.value && allowGroupedShow.value)
  const autoExtend = computed(() => mayAutoExtend.value)

  watch(mayShowBubble, (value, old) => { if (value && !old) state.value.openCount += 1 })
  watch(showBubble, (value, old) => { if (value && !old) state.value.showCount += 1 })
  watch(showBubble, (value, old) => { if (!value && old) state.value.lastHideWrong = state.value.visibleWrongCount })
  watch(showBubble, (value) => { if (value) group?.setDisplayed(options.key, true) })
  watch(() => mayShowBubble.value && shouldShowBubble.value, ready => {
    if (!group) return
    if (ready) group?.addToWaitingQueue(options.key, () => allowGroupedShow.value = true)
    else {
      group?.removeFromWaitingQueue(options.key)
      allowGroupedShow.value = false
    }
  }, { immediate: true })

  let displayBubbleTimeout: ReturnType<typeof setTimeout> | null = null
  function changeDisplayed(display: boolean, force: boolean = false) {
    if (display && mayShowBubble.value) return
    if (!display && !mayShowBubble.value && !displayBubbleTimeout) return
    if (state.value.accepted) return

    if (!display && displayBubbleTimeout) {
      clearTimeout(displayBubbleTimeout)
      displayBubbleTimeout = null
      return
    }

    if (display && (!options.displayDelay || force)) {
      mayShowBubble.value = display
      return
    }

    if (!display) {
      mayShowBubble.value = false
      if (displayBubbleTimeout) {
        clearTimeout(displayBubbleTimeout)
        displayBubbleTimeout = null
      }
      return
    }

    if (!displayBubbleTimeout) {
      displayBubbleTimeout = setTimeout(() => {
        mayShowBubble.value = true
        displayBubbleTimeout = null
      }, options.displayDelay || 0)
    }
  }

  const setDisplayed = (visible: boolean, force: boolean = false) => changeDisplayed(visible, force)
  const display = (force: boolean = false) => { setDisplayed(true, force) }
  const hide = () => { setDisplayed(false) }

  function interactReset() {
    state.value.lastInteractShow = state.value.showCount
    state.value.lastInteractOpen = state.value.openCount
    state.value.lastInteractWrong = state.value.visibleWrongCount
  }

  const accept = () => {
    state.value.accepted = true
  }

  const wrong = () => {
    // await for accept to br processed in case interact and wrong happen in the same tick
    setTimeout(() => {
      if (state.value.accepted) return
      if (showBubble.value) state.value.visibleWrongCount += 1
      state.value.wrongCount += 1
    }, 0)
  }

  let groupHideTimeout: ReturnType<typeof setTimeout> | null = null
  function onCloseAnimationEnd() {
    groupHideTimeout = setTimeout(() => group?.setDisplayed(options.key, false), GROUP_SWITCH_DELAY)
  }

  watch(showBubble, () => {
    if (!groupHideTimeout) return
    clearTimeout(groupHideTimeout)
    groupHideTimeout = null
  })

  useDebugInfo(options.key, state, showBubble, shouldShowBubble, autoExtend, mayShowBubble)

  const Component = defineComponent((props, { attrs, slots }) => {
    return () => h(TipBubble, {
      direction: options.direction || 'auto',
      pagePadding: options.pagePadding,
      displayed: showBubble.value,
      autoExtend: autoExtend.value,
      accepted: state.value.accepted,
      forceExtend: options.autoExtend === 'force-extend',
      onInteract: (type) => interactReset(),
      onCloseAnimationEnd: () => onCloseAnimationEnd()
    }, slots)
  })

  return {
    Component,
    setDisplayed,
    display,
    hide,
    accept,
    wrong
  }
}

window.resetTipBubbles = function () {
  for (const key in localStorage) {
    if (key.startsWith(TIP_BUBBLE_STORAGE_PREFIX)) localStorage.removeItem(key)
  }
}