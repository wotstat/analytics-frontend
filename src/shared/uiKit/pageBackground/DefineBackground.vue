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
  mode?: BackgroundMode
  placement?: BackgroundPlacement
  backgroundProps?: Record<string, unknown>
}>(), {
  mode: 'replace',
  placement: 'viewport',
})

const { update } = useBackground(props.component, {
  mode: props.mode,
  placement: props.placement,
  props: props.backgroundProps,
})

watch(() => [props.component, props.mode, props.placement, props.backgroundProps], () => {
  update(props.component, {
    mode: props.mode,
    placement: props.placement,
    props: props.backgroundProps,
  })
})
</script>
