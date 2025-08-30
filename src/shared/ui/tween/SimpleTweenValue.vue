<template>
{{ processed }}
</template>


<script setup lang="ts" generic="T">
import { spaceProcessor } from '@/shared/processors/useSpaceProcessor'
import { TweenOptions, useTweenRef } from '@/shared/ui/tween/useTweenRef'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  value: number
  options?: TweenOptions
  processor?: (value: number) => T
  raw?: boolean
  space?: boolean
  precision?: number
  startAnimationInPreview?: boolean
}>()

const value = ref(!props.startAnimationInPreview ? props.value : 0)
const tweenValue = useTweenRef(value, props.options)

watch(() => props.value, t => value.value = t, { immediate: true })

const processed = computed(() => {
  if ('processor' in props && props.processor)
    return props.processor(tweenValue.value)

  const space = 'space' in props && props.space

  if ('precision' in props && Number.isInteger(props.precision)) {
    const val = tweenValue.value.toFixed(props.precision)
    return space ? spaceProcessor(val) : val
  }

  if (props.raw) return tweenValue.value

  const val = Math.round(tweenValue.value)
  return space ? spaceProcessor(val.toString()) : val
})
</script>
