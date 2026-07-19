import { getCurrentScope, h, onScopeDispose, render } from 'vue'
import type {
  AllowedComponentProps,
  Component,
  ComponentCustomProps,
  ComponentInstance,
  VNodeProps
} from 'vue'
import { defineTooltip } from './tooltip'
import type { TooltipOptions } from './tooltip'
import type { DefineTooltipProps, TooltipBindingProps } from './types'


type VuePublicProps = VNodeProps & AllowedComponentProps & ComponentCustomProps

export type TooltipComponentProps<T extends Component> = ComponentInstance<T> extends { $props: infer Props }
  ? Omit<Props, keyof VuePublicProps>
  : never

type ResolveTooltipComponentProps<Props, T extends Component> = [Props] extends [never]
  ? TooltipComponentProps<T>
  : Props

export type UseTooltipValueAdapter<Value, ContentProps> = (value: Value) => {
  contentProps: ContentProps
  tooltipProps?: TooltipBindingProps
}

export type UseTooltipOptions<Value = never, ContentProps = never> = TooltipOptions & DefineTooltipProps & {
  valueAdapter?: UseTooltipValueAdapter<Value, ContentProps>
}

export function useTooltip<
  ExplicitValue = never,
  T extends Component = Component,
  Value = ResolveTooltipComponentProps<ExplicitValue, T>,
>(component: T, options?: UseTooltipOptions<Value, TooltipComponentProps<T>>) {
  const {
    offset,
    placement,
    arrowSize,
    viewportOffset,
    class: className,
    valueAdapter,
    ...tooltipOptions
  } = options ?? {}

  const propsFromBindingValue = valueAdapter
    ? (value: Value) => valueAdapter(value).tooltipProps ?? {}
    : undefined

  const { DefineTooltip, vTooltipTarget } = defineTooltip<Value>(tooltipOptions, propsFromBindingValue)
  const definitionContainer = document.createElement('div')

  render(h(DefineTooltip, {
    offset,
    placement,
    arrowSize,
    viewportOffset,
    class: className,
  }, {
    default: (value: Value) => h(component, valueAdapter ? valueAdapter(value).contentProps : value),
  }), definitionContainer)

  if (getCurrentScope()) onScopeDispose(() => render(null, definitionContainer))

  return vTooltipTarget
}
