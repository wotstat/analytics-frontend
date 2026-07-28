<template>
  <svg class="icon-guides" :viewBox="`0 0 ${size} ${size}`">
    <circle class="g-circle" :cx="size / 2" :cy="size / 2" :r="size / 2" />
    <circle class="g-circle" :cx="size / 2" :cy="size / 2" :r="size * 12 / 32" />
    <circle class="g-circle" :cx="size / 2" :cy="size / 2" :r="size * 10 / 32" />
    <circle class="g-circle" :cx="size / 2" :cy="size / 2" :r="size * 9 / 32" />
    <rect class="g-square" :x="size / 2 - squareHalf" :y="size / 2 - squareHalf" :width="squareSide"
      :height="squareSide" />
  </svg>
</template>


<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ size: number }>()

const squareSide = computed(() => props.size * (20 / 32) / Math.SQRT2)
const squareHalf = computed(() => squareSide.value / 2)
</script>


<style scoped lang="scss">
.icon-guides {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: visible;

  .g-circle {
    fill: none;
    stroke: #ff5c5c;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .g-square {
    fill: none;
    stroke: #4da6ff;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }
}
</style>
