import { defineComponent, h, render } from 'vue'
import { defineTooltip, DefineTooltipProps } from './tooltip'


type TextTooltipValue = string | DefineTooltipProps & {
  text: string
}


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

const { DefineTooltip, vTooltipTarget } = defineTooltip<TextTooltipValue>(
  undefined,
  value => typeof value === 'string' ? {} : value
)
const definitionContainer = document.createElement('div')

render(h(DefineTooltip, { arrowSize: 7, offset: 7 }, {
  default: (value: TextTooltipValue) => h(TextTooltip, {
    text: typeof value === 'string' ? value : value.text
  })
}), definitionContainer)

export { vTooltipTarget as vTooltip }
