import { computed, defineComponent, h, ref, watch } from 'vue'
import TipBubble from './TipBubbleComponent.vue'
import { useLocalStorage } from '@vueuse/core'

export type Options = {
  key: string,
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

const TIP_BUBBLE_STORAGE_PREFIX = 'tip-bubble-storage'
const storageKey = (key: string) => `${TIP_BUBBLE_STORAGE_PREFIX}:${key}`

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

const EmptyComponent = {
  Component: defineComponent(() => () => null),
  setDisplayed: () => { },
  display: () => { },
  hide: () => { },
  accept: () => { },
  wrong: () => { },
}

export function useTipBubble(options: Options) {

  if (isAlwaysHidden(options.key)) return EmptyComponent

  const mayShowBubble = ref(false)

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
  }, { listenToStorageChanges: true, deep: true })

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

  const showBubble = computed(() => mayShowBubble.value && shouldShowBubble.value)
  const autoExtend = computed(() => mayAutoExtend.value)

  watch(mayShowBubble, (value, old) => { if (value && !old) state.value.openCount += 1 })
  watch(showBubble, (value, old) => { if (value && !old) state.value.showCount += 1 })
  watch(showBubble, (value, old) => { if (!value && old) state.value.lastHideWrong = state.value.visibleWrongCount })

  let changeDisplayedTimeout: ReturnType<typeof setTimeout> | null = null
  function changeDisplayed(display: boolean, force: boolean = false) {
    if (mayShowBubble.value === display) return
    if (state.value.accepted) return

    if (display && (!options.displayDelay || force)) {
      mayShowBubble.value = display
      return
    }

    if (!display) {
      mayShowBubble.value = false
      if (changeDisplayedTimeout) {
        clearTimeout(changeDisplayedTimeout)
        changeDisplayedTimeout = null
      }
      return
    }


    if (!changeDisplayedTimeout) {
      changeDisplayedTimeout = setTimeout(() => {
        mayShowBubble.value = true
        changeDisplayedTimeout = null
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
    console.log('accept')
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

  const Component = defineComponent((props, { attrs, slots }) => {
    return () => h(TipBubble, {
      direction: options.direction || 'auto',
      pagePadding: options.pagePadding,
      displayed: showBubble.value,
      autoExtend: autoExtend.value,
      accepted: state.value.accepted,
      forceExtend: options.autoExtend === 'force-extend',
      onInteract: (type) => interactReset()
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