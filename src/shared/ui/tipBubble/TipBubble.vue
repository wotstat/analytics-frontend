<template>
  <component :is="bubble.Component" v-slot="{ direction }" v-if="!isAlwaysHidden(props.bubbleKey)">
    <slot :direction></slot>
  </component>
</template>


<script setup lang="ts">
import { isAlwaysHidden, useTipBubble, type Options } from '@/shared/uiKit/tipBubble/useTipBubble'
import { watch } from 'vue'

const props = withDefaults(defineProps<{
  bubbleKey: string,
  display?: boolean
} & Omit<Options, 'key'>>(), { display: undefined })

const bubble = useTipBubble({
  direction: props.direction,
  pagePadding: props.pagePadding ?? '--content-page-margin',
  displayDelay: props.displayDelay ?? 0,
  showBubble: props.showBubble ?? 'always',
  autoExtend: props.autoExtend ?? { type: 'after-wrong', count: 7, interactSnooze: 20, hideSnooze: 'reset' },
  key: props.bubbleKey,
  groupKey: props.groupKey,
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