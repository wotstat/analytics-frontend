<template>
  <div class="mod card" ref="card" :style="targetStyleThrottled" @click="isChecked = !isChecked">

    <div class="content-container">
      <div class="image">
        <img :src="image">
      </div>

      <div class="info">
        <slot name="info" v-if="slots.info"></slot>
        <template v-else>
          <div class="header">
            <h5>{{ title }}</h5>
            <Github class="github" />
          </div>
          <p>{{ description }}</p>
        </template>
      </div>
    </div>

    <div class="checkbox-container" :class="{ checked: isChecked }">
      <div class="line"></div>
      <button>
        <CheckMark class="checkmark" />
      </button>
    </div>

    <div class="blink-container">
      <div class="back"></div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { computed, ref, useSlots } from 'vue';
import Github from './assets/github.svg'
import { useMouseInElement, useThrottle, useThrottleFn } from '@vueuse/core';
import { useCardRotation } from '@/composition/useCardRotation';
import CheckMark from './assets/checkmark-bold.svg'
import { useNextAnimationFrameThrottle } from '@/composition/utils/useNextAnimationFrameThrottle';

const card = ref<HTMLElement | null>(null)

const isChecked = defineModel({
  type: Boolean,
  required: true,
})

const props = defineProps<{
  image: string
  title?: string
  description?: string
}>()

const slots = useSlots()

const rot = useCardRotation(card, {})

const { elementX, elementY } = useMouseInElement(card)

const targetStyle = computed(() => {
  const x = rot.x.value
  const y = rot.y.value

  const MULTIPLIER = 1
  return {
    '--x-rotation': `${-y * MULTIPLIER}deg`,
    '--y-rotation': `${x * MULTIPLIER}deg`,
    '--x-offset': `${x * 1.5}px`,
    '--y-offset': `${y * 1.5}px`,
    '--element-x': `${elementX.value}px`,
    '--element-y': `${elementY.value}px`,
    '--shadow-opacity': `${Math.min(0.2, Math.max(0.1, Math.max(Math.abs(x), Math.abs(y))))}`
  }
})

// to prevent multiple layout recalculation
const targetStyleThrottled = useNextAnimationFrameThrottle(targetStyle)
</script>


<style lang="scss" scoped>
$content-border: 2px;
$image-border-radius: calc(15px - $content-border);

.mod {
  flex: 1;
  padding: 0;
  position: relative;
  z-index: 5;
  cursor: pointer;
  user-select: none;
  container: mod-container / inline-size;

  transform: perspective(400px) rotateX(var(--x-rotation)) rotateY(var(--y-rotation));
  box-shadow: calc(var(--x-offset) * -2) calc(var(--y-offset) * -2) 10px 0 rgba(0, 0, 0, var(--shadow-opacity));

  .content-container {
    display: flex;
    flex-direction: column;
    padding-bottom: 10px;

    .image {
      img {
        transform: translate(var(--x-offset), var(--y-offset));
      }
    }

    .image {
      height: 200px;
      border-top-left-radius: $image-border-radius;
      border-top-right-radius: $image-border-radius;
      overflow: hidden;
      margin: $content-border;

      img {
        display: block;
        width: 100%;
        height: 100%;
        scale: 1.04;
        object-fit: cover;
        user-select: none;
        pointer-events: none;
      }
    }

    .info {
      padding: 1em;

      .header {
        display: flex;
        align-items: center;

        h5 {
          margin: 0;
          font-size: 1em;
          flex: 1;
        }

        .github {
          display: block;
          width: 20px;
          height: 20px;
        }
      }
    }
  }

  .checkbox-container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;

    .line {
      position: absolute;
      left: 50%;
      bottom: 0;
      transform: translate(-50%, 0);
      border-radius: 1px;

      width: 0%;
      transition: width 0.2s ease-out;
      background-color: rgb(31, 229, 93);
      height: 2px;
    }

    button {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);

      border: 1.5px solid rgb(31, 229, 93);
      width: 30px;
      height: 30px;
      padding: 0;
      border-radius: 50%;

      display: flex;
      align-items: center;
      justify-content: center;


      transition: filter 0.2s ease-out, border-color 0.2s ease-out;

      &:hover {
        background-color: rgb(29, 29, 29);
        filter: drop-shadow(0 0 10px rgba(24, 254, 97, 0.05));
        border-color: rgb(24, 254, 97);
      }

      .checkmark {
        width: 20px;
        height: 20px;
        display: block;
        fill: rgb(31, 229, 93);
        transform: translateX(-2%);
        opacity: 0;
      }
    }

    &.checked {
      .checkmark {
        opacity: 1;
      }

      .line {
        width: 70%;
      }
    }
  }

  .blink-container {
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: 15px;
    overflow: hidden;

    .back {
      position: absolute;
      inset: 2px;
      background: #353535;
      border-radius: $image-border-radius;

      &::before {
        content: '';
        position: absolute;
        width: 100px;
        height: 100px;
        z-index: -1;
        top: calc(var(--element-y) - 50px);
        left: calc(var(--element-x) - 50px);
        background: rgba(255, 255, 255, 0.204);
        filter: blur(20px);
      }
    }
  }


  @container mod-container (min-width: 450px) {
    .content-container {
      flex-direction: row;
      padding-bottom: 0px;

      .image {
        border-top-right-radius: 0px;
        border-bottom-left-radius: $image-border-radius;

        min-width: 40%;
        max-width: 40%;


        img {
          transform: translate(calc(var(--x-offset) / 0.4), var(--y-offset));
        }
      }
    }
  }

}
</style>