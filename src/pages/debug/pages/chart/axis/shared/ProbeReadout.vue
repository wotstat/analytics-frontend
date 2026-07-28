<template>
  <div class="probe-readout debug-col">
    <div class="debug-row">
      <span class="debug-hint">bounds X <span class="debug-value">{{ boundsX }}</span></span>
      <span class="debug-hint">bounds Y <span class="debug-value">{{ boundsY }}</span></span>
      <span class="debug-hint">layout <span class="debug-value">{{ layout }}</span></span>
      <span class="debug-hint">overflow <span class="debug-value">{{ overflow }}</span></span>
    </div>

    <p class="debug-hint" v-if="axis !== 'vertical'">
      подписи X ({{ state?.x.length ?? 0 }}) <span class="debug-value">{{ x }}</span>
    </p>

    <p class="debug-hint" v-if="axis !== 'horizontal'">
      подписи Y ({{ state?.y.length ?? 0 }}) <span class="debug-value">{{ y }}</span>
    </p>

    <p class="debug-hint" v-if="ticks">
      тики X ({{ state?.xTicks.length ?? 0 }}) <span class="debug-value">{{ xTicks }}</span>
    </p>
  </div>
</template>


<script setup lang="ts">
import { computed } from 'vue'
import type { ProbeState } from './probe'

const props = withDefaults(defineProps<{
  state: ProbeState | null
  axis?: 'horizontal' | 'vertical' | 'both'
  ticks?: boolean
}>(), {
  axis: 'horizontal',
  ticks: false,
})

const boundsX = computed(() => props.state ? `${round(props.state.bounds.minX)} … ${round(props.state.bounds.maxX)}` : '—')
const boundsY = computed(() => props.state ? `${round(props.state.bounds.minY)} … ${round(props.state.bounds.maxY)}` : '—')

const layout = computed(() => {
  const value = props.state?.layout
  if (!value) return '—'
  return `${round(value.x)},${round(value.y)} ${round(value.width)}×${round(value.height)}`
})

const overflow = computed(() => {
  const value = props.state?.overflow
  if (!value) return '—'
  return `↑${round(value.top)} →${round(value.right)} ↓${round(value.bottom)} ←${round(value.left)}`
})

const x = computed(() => join(props.state?.x.map(label => label.text)))
const y = computed(() => join(props.state?.y.map(label => label.text)))
const xTicks = computed(() => join(props.state?.xTicks.map(tick => round(tick).toString())))

function join(items: string[] | undefined) {
  if (!items || items.length === 0) return '—'
  return items.join(' · ')
}

function round(value: number) {
  if (!Number.isFinite(value)) return value > 0 ? '∞' : '-∞'
  return Math.round(value * 100) / 100
}
</script>


<style scoped lang="scss">
.probe-readout {
  gap: 0.25em;

  p {
    margin: 0;
    overflow-wrap: anywhere;
  }
}
</style>
