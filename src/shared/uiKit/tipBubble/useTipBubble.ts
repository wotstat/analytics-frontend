import { defineComponent, h, ref } from 'vue'
import TipBubble from './TipBubble.vue'

type Options = {
  key: string,
  displayed?: boolean,
  closable?: boolean,
  extendOnHover?: boolean,
  direction?: 'left' | 'right' | 'auto',
}

type Duration = 'hour' | 'day' | 'week' | 'month' | 'infinity' | number

export function useTipBubble(options: Options) {

  const displayed = ref(options.displayed || false)

  const setDisplayed = (displayed: boolean) => {
  }

  const display = (seconds: number = -1) => {
    displayed.value = true
  }

  const hide = (duration: Duration = 'infinity') => {
    displayed.value = false
  }

  const accept = () => {
  }

  const Component = defineComponent((props) => {
    return () => h(TipBubble, {
      direction: options.direction || 'auto',
      closable: options.closable || false,
      extendOnHover: options.extendOnHover || false,
      displayed: displayed.value
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