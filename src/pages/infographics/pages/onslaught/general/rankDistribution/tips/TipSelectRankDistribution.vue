<template>
  <TipBubble ref="bubble" bubble-key="onslaught-rank-distribution-selection" :display="true"
    :show-bubble="{ type: 'after-open', count: 0 }"
    :auto-extend="{ type: 'after-show-bubble', count: 2, interactSnooze: 20 }" v-slot="{ direction }">
    <p class="content">
      <span class="spacer" :class="`align-${direction}`"></span>
      Нажмите на название ранга, чтобы выбрать всю группу. Зажмите <span class="key">Shift</span> и кликайте
      по столбикам или группам для множественного выбора
    </p>
  </TipBubble>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'
import TipBubble from '@/shared/ui/tipBubble/TipBubble.vue'

const bubble = useTemplateRef<InstanceType<typeof TipBubble>>('bubble')

defineExpose({
  accept: () => bubble.value?.accept(),
})
</script>

<style lang="scss" scoped>
.content {
  max-width: 390px;
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

  .key {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 1px 5px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.6);
    border-radius: 2px;
    background-color: rgba(240, 240, 240, 0.3);
    box-shadow: 0 0 0 1px rgba(190, 190, 190, 0.3);
    font-size: 11px;
    font-weight: bold;
    line-height: 1;
  }
}
</style>
