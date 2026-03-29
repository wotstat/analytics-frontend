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
  position: relative;
  z-index: 7;
  width: 18px;
  height: 18px;
  display: flex;

  .icon {
    width: 10px;
    height: 10px;
    fill: #fff1b1;
    margin: 4px;
    display: block;
    z-index: 1;
    position: relative;
  }

  &:hover {
    .content-container {
      width: var(--content-width);
      height: var(--content-height);

      .content {
        opacity: 1;
        filter: blur(0);
        transition-delay: 0s;
        transition-duration: 0.1s;
      }
    }
  }

  .content-container {
    top: 0;
    left: 0;
    border-radius: 9px;
    position: absolute;
    background-color: var(--tip-background-color, var(--dark-blue-color, #4d4d4d));
    overflow: hidden;


    min-width: 18px;
    min-height: 18px;
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
      transition: opacity 0.2s linear, filter 0.2s linear;
      transition-delay: 0.1s;

      .spacer {
        width: 10px;
        height: 10px;
        float: left;
      }

    }
  }
}

.fade-enter-active,
.fade-leave-active {
  // transition: scale-easeOutElastic 1s linear;
  animation: scale-easeOutElasticReverse 1s;
}

.fade-enter-from,
.fade-leave-to {
  // opacity: 0;
  // filter: blur(4px);
  // transform: scale(0);
}

@keyframes scale-easeOutElastic {
  0% {
    transform: scale(1);
  }

  16% {
    transform: scale(-0.32);
  }

  28% {
    transform: scale(0.13);
  }

  44% {
    transform: scale(-0.05);
  }

  59% {
    transform: scale(0.02);
  }

  73% {
    transform: scale(-0.01);
  }

  88% {
    transform: scale(0);
  }

  100% {
    transform: scale(0);
  }

}

@keyframes scale-easeOutElasticReverse {
  0% {
    transform: scale(0);
  }

  16% {
    transform: scale(-0.32);
  }

  28% {
    transform: scale(0.13);
  }

  44% {
    transform: scale(-0.05);
  }

  59% {
    transform: scale(0.02);
  }

  73% {
    transform: scale(-0.01);
  }

  88% {
    transform: scale(1.2);
  }

  100% {
    transform: scale(1);
  }

}
</style>