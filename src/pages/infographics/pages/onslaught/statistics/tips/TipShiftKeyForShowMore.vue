<template>
  <TipBubble ref="bubble" :bubbleKey="'onslaught-battle-history-shift-key'" :display :displayDelay="800"
    :direction="'right'" :showBubble="{ type: 'after-wrong', count: 2 }"
    :autoExtend="{ type: 'after-wrong', count: 4, interactSnooze: 20, hideSnooze: 'reset' }" v-slot="{ direction }">
    <p class="content">
      <span class="spacer" :class="`align-${direction}`"></span>
      Зажмите <span class="key">Shift</span> чтобы загрузить больше боёв за раз
    </p>
  </TipBubble>
</template>


<script setup lang="ts">
import TipBubble from '@/shared/ui/tipBubble/TipBubble.vue'
import { ref } from 'vue'

const bubble = ref<InstanceType<typeof TipBubble> | null>(null)

const props = withDefaults(defineProps<{
  display?: boolean
}>(), { display: undefined })

defineExpose({
  setDisplayed: (visible: boolean, force: boolean = false) => bubble.value?.setDisplayed(visible, force),
  display: (force: boolean = false) => bubble.value?.display(force),
  hide: () => bubble.value?.hide(),
  accept: () => bubble.value?.accept(),
  wrong: () => bubble.value?.wrong(),
})
</script>


<style lang="scss" scoped>
.content {
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

  .no-wrap {
    white-space: nowrap;
  }

  .key {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 1px 5px;
    background-color: rgba(240, 240, 240, 0.3);
    border-bottom: 1px solid rgba(0, 0, 0, 0.6);
    box-shadow: 0 0 0 1px rgba(190, 190, 190, 0.3);
    border-radius: 2px;
    font-weight: bold;
    line-height: 1;
    font-size: 11px;
  }
}
</style>