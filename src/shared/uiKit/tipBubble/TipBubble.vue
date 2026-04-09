<template>
  <component :is="bubble.Component" v-slot="{ direction }">
    <slot :direction></slot>
  </component>
</template>


<script setup lang="ts">
import { useTipBubble, type Options } from './useTipBubble'

const props = defineProps<{
  bubbleKey: string,
} & Omit<Options, 'key'>>()

const bubble = useTipBubble({
  ...props,
  key: props.bubbleKey,
})

defineExpose({
  setDisplayed: bubble.setDisplayed,
  display: bubble.display,
  hide: bubble.hide,
  accept: bubble.accept,
  wrong: bubble.wrong,
})
</script>