import { computed, defineComponent, h, ref, watch, watchEffect } from 'vue'
import TipBubble from './TipBubble.vue'
import { refDebounced, refThrottled, useDebounceFn } from '@vueuse/core'

type Options = {
  key: string,
  direction?: 'left' | 'right' | 'auto',
  displayDelay?: number,
  showBubble?: 'always' |
  { type: 'after-open', count: number } |
  { type: 'after-wrong', count: number }
  autoExtend?: 'always' |
  { type: 'always', interactSnooze?: number } |
  { type: 'after-open', count: number, deltaTime?: number, interactSnooze?: number } |
  { type: 'after-show-bubble', count: number, deltaTime?: number, interactSnooze?: number } |
  { type: 'after-wrong', count: number, deltaTime?: number, interactSnooze?: number }
}

const openCountStorage = new Map<string, number>()

export function useTipBubble(options: Options) {

  const mayShowBubble = ref(false)

  const openCount = ref(0)
  const showBubbleCount = ref(0)
  const wrongCount = ref(0)
  const lastInteractOpen = ref(0)
  const lastInteractShow = ref(0)
  const lastInteractWrong = ref(0)

  const shouldShowBubble = computed(() => {
    const showBubble = options.showBubble
    if (!showBubble) return true
    if (showBubble === 'always') return true

    if (showBubble.type === 'after-open') return openCount.value > showBubble.count
    if (showBubble.type === 'after-wrong') return wrongCount.value > showBubble.count
    return false
  })

  const mayAutoExtend = computed(() => {
    const autoExtend = options.autoExtend
    if (!autoExtend) return false
    if (autoExtend === 'always') return true
    if (autoExtend.type === 'always') return true

    const targetSnooze = autoExtend.interactSnooze || 1e10
    if (autoExtend.type === 'after-open')
      return openCount.value > autoExtend.count && (lastInteractOpen.value + targetSnooze < openCount.value || !lastInteractOpen.value)
    if (autoExtend.type === 'after-wrong')
      return wrongCount.value > autoExtend.count && (lastInteractWrong.value + targetSnooze < wrongCount.value || !lastInteractWrong.value)
    if (autoExtend.type === 'after-show-bubble')
      return showBubbleCount.value > autoExtend.count && (lastInteractShow.value + targetSnooze < showBubbleCount.value || !lastInteractShow.value)
    return false
  })

  const showBubble = computed(() => mayShowBubble.value && shouldShowBubble.value)
  const autoExtend = computed(() => mayAutoExtend.value)

  watch(mayShowBubble, (value, old) => { if (value && !old) openCount.value += 1 })
  watch(showBubble, (value, old) => { if (value && !old) showBubbleCount.value += 1 })

  watchEffect(() => console.log(`${options.key} open count: ${openCount.value}`))
  watchEffect(() => console.log(`${options.key} show bubble count: ${showBubbleCount.value}`))

  let changeDisplayedTimeout: ReturnType<typeof setTimeout> | null = null
  function changeDisplayed(display: boolean, force: boolean = false) {
    if (!options.displayDelay || force) {
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


  const setDisplayed = (visible: boolean, force: boolean = false) => {
    changeDisplayed(visible, force)
  }

  const display = (force: boolean = false) => { setDisplayed(true, force) }
  const hide = () => { setDisplayed(false) }

  const accept = () => {
  }

  const Component = defineComponent((props) => {
    return () => h(TipBubble, {
      direction: options.direction || 'auto',
      displayed: showBubble.value,
      autoExtend: autoExtend.value,
      onInteract: (type) => {
        lastInteractShow.value = showBubbleCount.value
        lastInteractOpen.value = openCount.value
        lastInteractWrong.value = wrongCount.value
      }
    })
  })

  return {
    Component,
    setDisplayed,
    display,
    hide,
    accept
  }
}