<template>
  <TimeSeriesPanel
    :chart
    :legend
    :has-values="false"
    density="compact"
    marker-style="glow"
    tooltip="header"
    :show-legend="false"
    :format-value="String">
    <template #header>
      <div class="metric-header">
        <MapMetricSelector v-model="slot" v-model:delta-metrics="deltaMetrics" />
      </div>
    </template>

    <template #toolbar>
      <HistoryToolbarOptions v-model:step="step" v-model:average-window="averageWindow" />
    </template>

    <template #actions>
      <HistoryAnnotationSettings :settings="annotations" :regions />
    </template>

    <template #state>По выбранным фильтрам пока нет данных</template>
  </TimeSeriesPanel>
</template>

<script setup lang="ts">
import { markRaw } from 'vue'
import type { GameRegion } from '@/shared/game/domain/wot'
import { useLegend, type LegendItem } from '@/shared/ui/chart/legend/useLegend'
import { TimeSeriesChart } from '@/shared/ui/chart/timeSeries/chart/TimeSeriesChart'
import TimeSeriesPanel from '@/shared/ui/chart/timeSeries/panel/TimeSeriesPanel.vue'
import HistoryAnnotationSettings from '../../shared/history/annotations/settings/HistoryAnnotationSettings.vue'
import { useHistoryAnnotationSettings } from '../../shared/history/annotations/settings/useHistoryAnnotationSettings'
import HistoryToolbarOptions from '../../shared/history/period/HistoryToolbarOptions.vue'
import type { HistoryAverageWindow, HistoryStep } from '../../shared/history/period/historyStep'
import MapMetricSelector from '../metrics/MapMetricSelector.vue'
import type { MapMetric, MapMetricSlot } from '../metrics/catalog/mapMetrics'

defineProps<{ regions: readonly GameRegion[] }>()
const slot = defineModel<MapMetricSlot>('slot', { required: true })
const deltaMetrics = defineModel<MapMetric[]>('deltaMetrics', { required: true })
const step = defineModel<HistoryStep>('step', { required: true })
const averageWindow = defineModel<HistoryAverageWindow>('averageWindow', { required: true })
const annotations = useHistoryAnnotationSettings()
const legend = useLegend<LegendItem & { tag: string }>([])
const chart = markRaw(new TimeSeriesChart(legend.highlightSync))
</script>

<style scoped lang="scss">
.metric-header {
  display: flex;
  min-width: 0;
  max-width: 100%;

  @container time-series-panel (max-width: 600px) {
    :deep(.metric-trigger) {
      flex: 1;
    }
  }
}
</style>
