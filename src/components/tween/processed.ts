import { spaceProcessor } from "@/composition/processors/useSpaceProcessor"
import { TweenOptions, useTweenComputed, useTweenRef } from "@/composition/tween/useTweenRef"
import { computed } from "vue"


export function useProcessed<T>(props: {
  value: number
  tag?: string
  options?: TweenOptions
  processor?: (value: number) => T
  raw?: boolean
  space?: boolean
  precision?: number
}) {
  const tweenValue = useTweenComputed(() => props.value, props.options)

  return computed(() => {

    if (props.processor) return props.processor(tweenValue.value)

    const space = 'space' in props && props.space

    if ('precision' in props && Number.isInteger(props.precision)) {
      const val = tweenValue.value.toFixed(props.precision)
      return space ? spaceProcessor(val) : val
    }

    if (props.raw) return tweenValue.value

    const val = Math.round(tweenValue.value)
    return space ? spaceProcessor(val.toString()) : val
  })
}