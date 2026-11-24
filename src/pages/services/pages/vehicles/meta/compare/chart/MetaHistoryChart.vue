<template>
  <ChartView :chart class="meta-history-chart" :class="{ 'single-series': series.length === 1 }" />
</template>

<script setup lang="ts">
import { markRaw } from 'vue'
import ChartView from '@/shared/uiKit/chart/universalChart/UniversalChart.vue'
import type { Slot } from '../../../metrics/catalog/vehicleMetrics'
import { MetaHistoryChart, type MetaHistorySeries, type MetaHistoryOptions } from './MetaHistoryChart'

const props = defineProps<{ series: MetaHistorySeries[], slot: Slot, until: number, options?: MetaHistoryOptions }>()
const chart = markRaw(new MetaHistoryChart(props.series, props.slot, props.until, props.options))
</script>

<style scoped lang="scss">
.meta-history-chart {
  width: 100%;
  height: 100%;
  pointer-events: none;

  :deep(.label) {
    fill: #cbd3e2;
    font-size: 20px;
    font-family: Arial, sans-serif;
  }

  :deep(.meta-grid-y .tick) {
    stroke: #ffffff1c;
    stroke-width: 1;
  }

  :deep(.meta-grid-x .tick) {
    stroke: #ffffff12;
    stroke-width: 1;
  }

  :deep(.meta-history-line .line) {
    stroke-width: 2.3px;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  &.single-series :deep(.meta-history-line .line) {
    stroke-width: 3px;
  }
}
</style>
