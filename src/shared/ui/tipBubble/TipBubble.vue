<template>
  <component :is="bubble.Component" v-slot="{ direction }">
    <slot :direction></slot>
  </component>
</template>


<script setup lang="ts">
import { useTipBubble, type Options } from '@/shared/uiKit/tipBubble/useTipBubble'

const props = defineProps<{
  bubbleKey: string,
} & Omit<Options, 'key'>>()

const bubble = useTipBubble({
  ...props,
  direction: props.direction,
  pagePadding: props.pagePadding ?? '--content-page-margin',
  displayDelay: props.displayDelay ?? 0,
  showBubble: props.showBubble ?? 'always',
  autoExtend: props.autoExtend ?? { type: 'after-wrong', count: 7, interactSnooze: 20, hideSnooze: 'reset' },
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