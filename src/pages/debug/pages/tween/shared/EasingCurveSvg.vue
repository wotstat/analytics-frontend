<template>
  <svg class="easing-curve" viewBox="0 0 100 56" preserveAspectRatio="none">
    <line x1="0" :y1="zeroY" x2="100" :y2="zeroY" class="zero-line" />
    <polyline :points="linearPoints" class="guide" />
    <polyline :points="curvePoints" class="curve" />
  </svg>
</template>


<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  fn: (x: number) => number
}>()

const SAMPLES = 48
const TOP = 4
const BOTTOM = 52

// Back/elastic-кривые выходят за [0, 1] — считаем реальный диапазон, иначе их не видно на графике.
const range = computed(() => {
  let min = 0
  let max = 1
  for (let i = 0; i <= SAMPLES; i++) {
    const y = props.fn(i / SAMPLES)
    if (y < min) min = y
    if (y > max) max = y
  }
  return { min, max }
})

function toPoints(fn: (x: number) => number) {
  const { min, max } = range.value
  const span = max - min || 1
  const points: string[] = []
  for (let i = 0; i <= SAMPLES; i++) {
    const x = i / SAMPLES
    const y = fn(x)
    const px = x * 100
    const py = BOTTOM - ((y - min) / span) * (BOTTOM - TOP)
    points.push(`${px.toFixed(1)},${py.toFixed(1)}`)
  }
  return points.join(' ')
}

const curvePoints = computed(() => toPoints(props.fn))
const linearPoints = computed(() => toPoints(x => x))
const zeroY = computed(() => {
  const { min, max } = range.value
  const span = max - min || 1
  return BOTTOM - ((0 - min) / span) * (BOTTOM - TOP)
})
</script>


<style scoped lang="scss">
.easing-curve {
  display: block;
  width: 100%;
  height: 48px;

  .zero-line {
    stroke: var(--debug-border);
    stroke-width: 1;
  }

  .guide {
    fill: none;
    stroke: var(--debug-border-strong);
    stroke-width: 1;
    stroke-dasharray: 2 2;
  }

  .curve {
    fill: none;
    stroke: var(--blue-color);
    stroke-width: 1.6;
  }
}
</style>
