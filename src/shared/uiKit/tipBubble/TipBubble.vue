<template>
  <Transition name="fade">
    <div class="tip-bubble" v-if="props.displayed" ref="bubble" :style="{
      '--left': `${left}px`,
      '--content-width': `${contentWidth}px`,
      '--content-height': `${contentHeight}px`
    }" :class="{
      displayed: props.displayed && false,
    }">
      <LightbulbIcon class="icon" />
      <div class="content-container">
        <div class="content" ref="content">
          <div class="spacer"></div>
          Используйте стрелочки ← и → для переключения дней
        </div>
      </div>
    </div>
  </Transition>
</template>


<script setup lang="ts">

import { ref } from 'vue'
import LightbulbIcon from './assets/lightbulb.svg'
import { useElementBounding } from '@vueuse/core'

const props = defineProps<{
  direction: 'left' | 'right' | 'auto'
  extendOnHover: boolean
  closable: boolean
  displayed: boolean
}>()

const bubble = ref<HTMLDivElement | null>(null)
const content = ref<HTMLDivElement | null>(null)
const { left } = useElementBounding(bubble)
const { width: contentWidth, height: contentHeight } = useElementBounding(content)
</script>


<style lang="scss" scoped>
.tip-bubble {
  background-color: var(--tip-background-color, var(--dark-blue-color, #4d4d4d));
  border-radius: 10px;
  z-index: 1000;
  position: relative;

  .icon {
    width: 10px;
    height: 10px;
    fill: #fff;
    margin: 4px;
    display: block;
    z-index: 20;
    position: relative;
  }


  &:hover {
    .content-container {
      width: var(--content-width);
      height: var(--content-height);

      .content {
        opacity: 1;
        filter: blur(0);
      }
    }
  }


  .content-container {
    top: 0;
    left: 0;
    border-radius: 10px;
    position: absolute;
    background-color: var(--tip-background-color, var(--dark-blue-color, #4d4d4d));
    overflow: hidden;


    width: 18px;
    height: 18px;
    transition: width 0.3s ease, height 0.3s ease;

    .content {
      position: absolute;
      color: #fff;
      font-size: 13px;
      line-height: 1.2;
      padding: 1.2px 8px 1.2px 8px;
      width: max-content;
      max-width: calc(100vw - var(--left) - 40px);

      opacity: 0;
      filter: blur(5px);
      transition: opacity 0.3s ease, filter 0.3s ease;

      .spacer {
        width: 10px;
        height: 10px;
        float: left;
      }

    }
  }
}
</style>