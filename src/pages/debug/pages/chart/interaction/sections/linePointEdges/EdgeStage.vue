<template>
  <div class="edge-stage">
    <h3>{{ title }}</h3>
    <p class="debug-hint">{{ note }}</p>

    <DemoChartView :chart="chart" :height="height ?? 190" />

    <div class="debug-row readout">
      <span class="debug-label">хитов</span>
      <span class="debug-value count">{{ hits.length }}</span>
      <span class="debug-value points">{{ readout }}</span>
      <span class="debug-value" v-if="vertices">вершин в пути: {{ vertexCount }} из {{ pointsCount }}</span>
    </div>
  </div>
</template>


<script setup lang="ts">
import { computed, onUnmounted, ref, shallowRef } from 'vue'
import DemoChartView from '../../shared/DemoChartView.vue'
import type { LinePointsChart, LinePointsHit } from '../../shared/LinePointsChart'

const props = defineProps<{
  chart: LinePointsChart
  title: string
  note: string
  height?: number
  vertices?: boolean
  pointsCount?: number
}>()

const hits = shallowRef<readonly LinePointsHit[]>([])
const vertexCount = ref(0)

const readout = computed(() => hits.value.length === 0
  ? 'ничего не выбрано'
  : hits.value.map(hit => `${hit.datum.label} (x=${hit.datum.x}, y=${hit.datum.y.toFixed(1)})`).join(' · '))

const stopHits = props.chart.onHits.on(next => hits.value = next)

// Путь строится в кадре чарта, поэтому число вершин снимается после рендера, а не сразу
const stopRender = props.chart.onAfterRender.on(() => {
  if (!props.vertices) return
  const count = props.chart.pathVertexCount()
  if (count !== vertexCount.value) vertexCount.value = count
})

onUnmounted(() => {
  stopHits()
  stopRender()
})

</script>


<style scoped lang="scss">
.edge-stage {
  display: flex;
  flex-direction: column;
  gap: 0.4em;

  h3 {
    font-size: 1em;
    margin: 0;
  }

  .readout {
    align-items: baseline;

    .count {
      font-weight: bold;
      color: var(--blue-thin-color);
    }

    .points {
      color: #ffffffb0;
    }
  }
}
</style>
