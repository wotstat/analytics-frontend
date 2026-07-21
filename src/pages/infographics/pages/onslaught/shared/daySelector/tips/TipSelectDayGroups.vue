<template>
  <TipBubble ref="bubble" bubble-key="onslaught-day-selector-group-selection" direction="left" :display
    :show-bubble="{ type: 'after-open', count: 0 }"
    :auto-extend="{ type: 'after-show-bubble', count: 100, interactSnooze: 20 }" v-slot="{ direction }">
    <p class="content">
      <span class="spacer" :class="`align-${direction}`"></span>
      {{ text }}
    </p>
  </TipBubble>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import TipBubble from '@/shared/ui/tipBubble/TipBubble.vue'

const props = defineProps<{
  display: boolean
  selectionMode: 'arbitrary' | 'interval'
}>()

const bubble = useTemplateRef<InstanceType<typeof TipBubble>>('bubble')
const text = computed(() => props.selectionMode === 'arbitrary'
  ? 'Нажмите на номер недели, чтобы выбрать её целиком, или на день недели в заголовке, чтобы выбрать этот день во всех неделях'
  : 'Нажмите на номер недели, чтобы выбрать её целиком'
)

defineExpose({
  accept: () => bubble.value?.accept(),
})
</script>

<style lang="scss" scoped>
.content {
  box-sizing: border-box;
  width: max-content;
  max-width: calc(var(--day-selector-popup-width, 340px) - 26px);
  margin: 0;
  padding: 1.2px 5px;
  color: #fff;
  font-size: 13px;
  line-height: 1.2;

  .spacer {
    width: 13px;
    height: 10px;

    &.align-left {
      float: left;
    }

    &.align-right {
      float: right;
    }
  }
}
</style>
