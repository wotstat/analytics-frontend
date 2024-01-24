<template>
  <div class="container" ref="container">
    <canvas ref="canvas"></canvas>
  </div>
</template>


<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useElementSize } from '@vueuse/core'

const emit = defineEmits<{
  'redraw': [ctx: CanvasRenderingContext2D, width: number, height: number],
}>()

defineExpose({
  redraw,
})

const canvas = ref<HTMLCanvasElement | null>(null);
const container = ref<HTMLElement | null>(null);
const containerSize = useElementSize(container);

function redraw() {
  const dpr = window.devicePixelRatio || 1;
  const canvasElement = canvas.value;
  if (!canvasElement) return;
  canvasElement.width = containerSize.width.value * dpr;
  canvasElement.height = containerSize.height.value * dpr;
  canvasElement.style.width = `${containerSize.width.value}px`;
  canvasElement.style.height = `${containerSize.height.value}px`;

  const ctx = canvasElement.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  emit('redraw', ctx, containerSize.width.value, containerSize.height.value);
}

watch(() => containerSize.width.value, () => {
  redraw();
});

onMounted(() => {
  redraw();
});



</script>


<style lang="scss" scoped>
.container {
  position: relative;
  aspect-ratio: 1;

  canvas {
    position: absolute;
    top: 0;
    left: 0;
  }
}
</style>