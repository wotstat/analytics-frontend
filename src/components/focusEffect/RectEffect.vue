<template>
  <div class="effect" :style="effectStyle" v-if="effectStyle">
    <div class="rect r0"></div>
    <div class="rect r1"></div>
    <div class="rect r2"></div>
  </div>
</template>


<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef } from 'vue';

const { element } = defineProps<{
  element: HTMLElement;
}>()

const borderRadius = element.computedStyleMap().get('border-radius')?.toString();


const rect = shallowRef<{ top: number; left: number; width: number; height: number } | null>(null)

const effectStyle = computed(() => (rect.value ? {
  top: `${rect.value.top}px`,
  left: `${rect.value.left}px`,
  width: `${rect.value.width}px`,
  height: `${rect.value.height}px`,
  ['--border-radius']: borderRadius || '0px',
} : null));

let animationFrameHandle: ReturnType<typeof requestAnimationFrame> | null = null;
function animationFrame() {
  if (!element.isConnected) return rect.value = null;
  animationFrameHandle = requestAnimationFrame(animationFrame);

  const bounding = element.getBoundingClientRect();
  if (bounding.width === 0 || bounding.height === 0) {
    rect.value = null;
    return;
  }

  rect.value = {
    top: bounding.top,
    left: bounding.left,
    width: bounding.width,
    height: bounding.height,
  };
}


onMounted(() => { animationFrame() });
onUnmounted(() => {
  if (animationFrameHandle) {
    cancelAnimationFrame(animationFrameHandle);
    animationFrameHandle = null;
  }
});

</script>


<style lang="scss" scoped>
.effect {
  position: fixed;

  .rect {
    position: absolute;
    border-radius: var(--border-radius, 0px);
    border: 2px solid rgb(255, 255, 0);
    box-shadow: 0 0 10px rgba(255, 255, 0, 0.5);
    pointer-events: none;
    inset: 0px;
    opacity: 0;

    animation: fade-in 0.6s ease-in-out forwards;

    &.r0 {
      animation-delay: 0s;
    }

    &.r1 {
      animation-delay: 0.1s;
    }

    &.r2 {
      animation-delay: 0.2s;
    }
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      inset: -100px;
    }

    90% {
      opacity: 1;
      inset: 0px;
    }

    to {
      opacity: 0;
    }
  }
}
</style>