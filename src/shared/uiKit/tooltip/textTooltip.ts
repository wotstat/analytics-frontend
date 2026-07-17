import { defineComponent, h, render } from 'vue'
import { defineTooltip } from './tooltip'


const TextTooltip = defineComponent({
  name: 'TextTooltip',

  props: {
    text: {
      type: String,
      required: true
    }
  },

  setup(props) {
    return () => h('div', {
      style: {
        maxWidth: '320px',
        padding: '6px 8px',
        lineHeight: '1.2',
        whiteSpace: 'pre-wrap',
        fontSize: '14px',
      }
    }, props.text)
  }
})

const { DefineTooltip, vTooltipTarget } = defineTooltip<string>()
const definitionContainer = document.createElement('div')

render(h(DefineTooltip, { arrowSize: 7, offset: 7 }, {
  default: (text: string) => h(TextTooltip, { text })
}), definitionContainer)

export { vTooltipTarget as vTooltip }
