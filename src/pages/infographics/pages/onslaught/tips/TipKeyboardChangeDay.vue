<template>
  <TipBubble ref="bubble" :bubbleKey="'onslaught-day-chart-keyboard'" :displayDelay="800" v-slot="{ direction }">
    <p class="content">
      <span class="spacer" :class="`align-${direction}`"></span>
      Используйте клавиши
      <span class="no-wrap">
        <span class="key">
          <LeftArrowIcon />
        </span> и <span class="key">
          <RightArrowIcon />
        </span>
      </span> для переключения между днями
    </p>
  </TipBubble>
</template>


<script setup lang="ts">
import TipBubble from '@/shared/uiKit/tipBubble/TipBubble.vue'
import LeftArrowIcon from '@/assets/icons/keyboard/left-arrow.svg'
import RightArrowIcon from '@/assets/icons/keyboard/right-arrow.svg'
import { ref } from 'vue'

const bubble = ref<InstanceType<typeof TipBubble> | null>(null)
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

    svg {
      display: block;
      height: 9px;
      filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.3));
    }
  }
}
</style>