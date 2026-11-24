<template>
  <section class="map-comparison">
    <TimeSeriesPanel
      :chart
      :legend
      :has-values="false"
      :format-value="value => String(value)"
      marker-style="glow"
      color-editable
      removable
      @color-change="(item, color) => changeColor(item.tag, color)"
      @remove="item => remove(item.tag)">
      <template #header>
        <h2>Сравнение <span v-if="sources.length">{{ sources.length }}</span></h2>
        <MapMetricSelector v-model="metric" v-model:delta-metrics="deltaMetrics" class="metric-selector" />
      </template>

      <template #toolbar>
        <HistoryToolbarOptions v-model:step="step" v-model:average-window="averageWindow" />
      </template>

      <template #actions>
        <HistoryAnnotationSettings :settings="annotations" :regions />
      </template>

      <template #state>
        <template v-if="!sources.length">
          <b class="empty-heading">Сравните карты на одном графике</b>
          <span>Нажмите «+» рядом с картой в таблице.</span>
        </template>
        <span v-else>Для выбранных карт пока нет данных</span>
      </template>

      <template #legend-actions>
        <ToolbarButton :icon="ResetIcon" class="reset" @click="sources = []" />
      </template>
    </TimeSeriesPanel>
  </section>
</template>

<script setup lang="ts">
import { markRaw, ref } from 'vue'
import ResetIcon from '@/assets/icons/reset.svg'
import type { GameRegion } from '@/shared/game/domain/wot'
import { useLegend, type LegendItem } from '@/shared/ui/chart/legend/useLegend'
import { TimeSeriesChart } from '@/shared/ui/chart/timeSeries/chart/TimeSeriesChart'
import TimeSeriesPanel from '@/shared/ui/chart/timeSeries/panel/TimeSeriesPanel.vue'
import ToolbarButton from '@/shared/ui/toolbarButton/ToolbarButton.vue'
import HistoryAnnotationSettings from '../../shared/history/annotations/settings/HistoryAnnotationSettings.vue'
import { useHistoryAnnotationSettings } from '../../shared/history/annotations/settings/useHistoryAnnotationSettings'
import HistoryToolbarOptions from '../../shared/history/period/HistoryToolbarOptions.vue'
import type { HistoryAverageWindow, HistoryStep } from '../../shared/history/period/historyStep'
import MapMetricSelector from '../metrics/MapMetricSelector.vue'
import type { MapMetric, MapMetricSlot } from '../metrics/catalog/mapMetrics'

defineProps<{ regions: readonly GameRegion[] }>()
const sources = defineModel<(LegendItem & { tag: string })[]>({ required: true })

const metric = ref<MapMetricSlot>({ metric: 'battles', aggregation: 'value' })
const deltaMetrics = ref<MapMetric[]>([])
const step = ref<HistoryStep>('day')
const averageWindow = ref<HistoryAverageWindow>(null)
const annotations = useHistoryAnnotationSettings()
const legend = useLegend(() => sources.value)
const chart = markRaw(new TimeSeriesChart(legend.highlightSync))

function changeColor(tag: string, color: string) {
  sources.value = sources.value.map(item => item.tag === tag ? { ...item, color } : item)
}

function remove(tag: string) {
  sources.value = sources.value.filter(item => item.tag !== tag)
}
</script>

<style scoped lang="scss">
@use '../../shared/comparison/comparisonPanel.scss' as *;

.map-comparison {
  @include comparison-panel;
}
</style>
