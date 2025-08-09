<template>
  <DefineTemplate>
    <slot :value="processed" v-if="slots.default"></slot>
    <template v-else>{{ processed }}</template>
  </DefineTemplate>

  <component :is="tag" v-if="tag">
    <ReuseTemplate />
  </component>
  <ReuseTemplate v-else />
</template>


<script setup lang="ts" generic="T">
import { TweenOptions } from '@/composition/tween/useTweenRef'
import { useSlots } from 'vue'
import { createReusableTemplate } from '@vueuse/core'
import { useProcessed } from './processed'

const [DefineTemplate, ReuseTemplate] = createReusableTemplate()

const props = defineProps<{
  value: number
  tag?: string
  options?: TweenOptions
  processor?: (value: number) => T
  raw?: boolean
  space?: boolean
  precision?: number
  class?: string | string[] | Record<string, boolean>
}>()

const slots = useSlots()
const processed = useProcessed(props)
</script>
