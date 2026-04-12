<template>
  <component :is="bubble.Component" v-slot="{ direction }">
    <slot :direction></slot>
  </component>
</template>


<script setup lang="ts">
import { watch } from 'vue'
import { useTipBubble, type Options } from './useTipBubble'

const props = withDefaults(defineProps<{
  bubbleKey: string,
  display?: boolean
} & Omit<Options, 'key'>>(), { display: undefined })

const bubble = useTipBubble({
  ...props,
  key: props.bubbleKey,
})

watch(() => props.display, (display) => {
  if (display === undefined) return

  if (display) bubble.display()
  else bubble.hide()
}, { immediate: true })

defineExpose({
  setDisplayed: bubble.setDisplayed,
  display: bubble.display,
  hide: bubble.hide,
  accept: bubble.accept,
  wrong: bubble.wrong,
})
</script>