<template>
  <slot />
</template>

<script setup lang="ts">
import { type Component, watch } from 'vue'
import {
  useBackground,
  type BackgroundMode,
  type BackgroundPlacement,
} from './useBackground'

const props = withDefaults(defineProps<{
  component: Component
  backgroundKey?: string | symbol
  mode?: BackgroundMode
  placement?: BackgroundPlacement
  backgroundProps?: Record<string, unknown>
}>(), {
  mode: 'replace',
  placement: 'viewport',
})

const { update } = useBackground(props.component, {
  backgroundKey: props.backgroundKey,
  mode: props.mode,
  placement: props.placement,
  props: props.backgroundProps,
})

watch(() => [props.component, props.backgroundKey, props.mode, props.placement, props.backgroundProps], () => {
  update(props.component, {
    backgroundKey: props.backgroundKey,
    mode: props.mode,
    placement: props.placement,
    props: props.backgroundProps,
  })
})
</script>
