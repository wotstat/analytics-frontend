<template>
  <component :is="bubble.Component" v-slot="{ direction }">
    <p class="tip-content">
      <span class="spacer" :class="`align-${direction}`"></span>
      {{ props.text }}
    </p>
  </component>
</template>


<script setup lang="ts">
import { watch } from 'vue'
import { useTipBubble, type Options } from './useTipBubble'

const props = withDefaults(defineProps<{
  bubbleKey: string,
  text: string,
  display?: boolean
} & Omit<Options, 'key'>>(), {
  display: undefined
})

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

<style lang="scss" scoped>
.tip-content {
  padding: 1.2px 5px 1.2px 5px;

  color: #fff;
  font-size: 13px;
  line-height: 1.2;

  .spacer {
    &.align-left {
      float: left;
    }

    &.align-right {
      float: right;
    }

    width: 13px;
    height: 10px;
  }
}
</style>