<template>
  <div class="container" ref="container">
    <canvas ref="canvas"></canvas>
  </div>
</template>


<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useElementSize, useElementVisibility, watchOnce } from '@vueuse/core'

const emit = defineEmits<{
  'redraw': [ctx: CanvasRenderingContext2D, width: number, height: number],
}>()

defineExpose({
  redraw,
})

const canvas = ref<HTMLCanvasElement | null>(null);
const container = ref<HTMLElement | null>(null);
const containerSize = useElementSize(container);
const visible = useElementVisibility(container);

let context: CanvasRenderingContext2D | null = null;
let shouldRerenderAfterVisible = false;

function redraw() {
  const dpr = window.devicePixelRatio || 1;
  const canvasElement = canvas.value;
  if (!canvasElement) return;
  canvasElement.width = containerSize.width.value * dpr;
  canvasElement.height = containerSize.height.value * dpr;
  canvasElement.style.width = `${containerSize.width.value}px`;
  canvasElement.style.height = `${containerSize.height.value}px`;

  if (!context) context = canvasElement.getContext('2d');
  if (!context) return;
  context.scale(dpr, dpr);

  if (!visible.value) {
    shouldRerenderAfterVisible = true;
    return;
  }

  shouldRerenderAfterVisible = false;
  emit('redraw', context, containerSize.width.value, containerSize.height.value);
}

watch(visible, v => {
  if (v && shouldRerenderAfterVisible) redraw();
})

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