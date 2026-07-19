import { defineComponent, getCurrentScope, h, onScopeDispose, render, toValue } from 'vue'
import type {
  AllowedComponentProps,
  Component,
  ComponentCustomProps,
  ComponentInstance,
  MaybeRefOrGetter,
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

type ReactiveDefineTooltipProps = {
  [Key in keyof DefineTooltipProps]: MaybeRefOrGetter<DefineTooltipProps[Key]>
}

export type UseTooltipOptions<Value = never, ContentProps = never> = TooltipOptions & ReactiveDefineTooltipProps & {
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

  const TooltipDefinition = defineComponent({
    name: 'TooltipDefinition',

    setup() {
      return () => h(DefineTooltip, {
        offset: toValue(offset),
        placement: toValue(placement),
        arrowSize: toValue(arrowSize),
        viewportOffset: toValue(viewportOffset),
        class: toValue(className),
      }, {
        default: (value: Value) => h(component, valueAdapter ? valueAdapter(value).contentProps : value),
      })
    }
  })

  render(h(TooltipDefinition), definitionContainer)

  if (getCurrentScope()) onScopeDispose(() => render(null, definitionContainer))

  return vTooltipTarget
}
