import { defineComponent, h, ref } from 'vue'
import TipBubble from './TipBubble.vue'

type Options = {
  key: string,
  displayed?: boolean,
  direction?: 'left' | 'right' | 'auto',
}

type Duration = 'hour' | 'day' | 'week' | 'month' | 'infinity' | number

const openCountStorage = new Map<string, number>()

export function useTipBubble(options: Options) {

  const displayed = ref(options.displayed || false)
  const openCount = ref(openCountStorage.get(options.key) || 0)

  const setDisplayed = (displayed: boolean) => {
  }

  const display = (seconds: number = -1) => {
    displayed.value = true
    openCount.value += 1
    openCountStorage.set(options.key, openCount.value)
  }

  const hide = (duration: Duration = 'infinity') => {
    displayed.value = false
  }

  const accept = () => {
  }

  const Component = defineComponent((props) => {
    return () => h(TipBubble, {
      direction: options.direction || 'auto',
      displayed: displayed.value,
      autoExtend: openCount.value > 3,
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