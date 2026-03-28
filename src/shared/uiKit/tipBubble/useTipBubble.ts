import { h, ref } from 'vue'
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

  const component = h(TipBubble, {
    direction: options.direction || 'auto',
    closable: options.closable || false,
    extendOnHover: options.extendOnHover || false,
    displayed: displayed.value
  })

  const setDisplayed = (displayed: boolean) => {
  }

  const display = (seconds: number = -1) => {
  }

  const hide = (duration: Duration = 'infinity') => {
  }

  const accept = () => {
  }

  return {
    Component: component,
    setDisplayed,
    display,
    hide,
    accept
  }
}