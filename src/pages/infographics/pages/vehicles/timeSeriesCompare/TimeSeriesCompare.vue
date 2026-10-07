<template>
  <section class="vehicle-comparison">
    <TimeSeriesPanel :chart :legend :has-values="hasValues" :annotation-labels="annotations.length > 0"
      :format-value="(value, ctx) => formatSlotValue(ctx.hit.datum.slot, value)" color-editable removable
      @color-change="(source, color) => emit('colorChange', source.tag, color)"
      @remove="source => emit('remove', source.tag)" @series-click="onSeriesClick">

      <template #header>
        <h2>Сравнение <span v-if="sources.length">{{ sources.length }}</span></h2>
        <VehicleMetricSelector v-model="slot" class="metric-selector" />
      </template>

      <template #toolbar>
        <HistoryToolbarOptions v-model:step="step" v-model:average-window="averageWindow" />
      </template>

      <template #actions>
        <HistoryAnnotationSettings :settings="annotationOptions" :regions="filters.regions" />
      </template>

      <template v-if="!sources.length || !hasValues" #state>
        <template v-if="!sources.length">
          <b class="empty-heading">Сравните танки на одном графике</b>
          <span>Нажмите «+» в таблице или в раскрытом графике. Чтобы добавить среднее по уровню или типу, выберите нужный режим
            таблицы.</span>
        </template>
        <template v-else>{{ emptyMessage }}</template>
      </template>

      <template #legend-actions>
        <ToolbarButton :icon="ResetIcon" class="reset" @click="emit('clear')" />
      </template>

      <template #details>
        <div v-for="source in failedSources" :key="source.tag" class="source-error">
          <span>{{ source.name }}: не удалось загрузить историю.</span>
          <button @click="retry(source.tag)">Повторить</button>
        </div>
        <div v-if="emptySources.length" class="caption">
          Нет данных: {{emptySources.map(source => source.name).join(', ')}}
        </div>
      </template>

      <template #tooltip-header="{ ctx, horizontal }">
        <HistoryTooltipHeader :point="ctx.hit.datum" :horizontal
          :game-version="versionForPeriod(ctx.hit.datum.periodEnd)" />
      </template>
    </TimeSeriesPanel>
  </section>
</template>

<script setup lang="ts">
import { computed, markRaw, ref, watch } from 'vue'
import { useNow } from '@vueuse/core'
import { isErrorStatus, loading, success } from '@/db'
import ResetIcon from '@/assets/icons/reset.svg'
import ToolbarButton from '@/shared/ui/toolbarButton/ToolbarButton.vue'
import TimeSeriesPanel from '@/shared/ui/chart/timeSeries/panel/TimeSeriesPanel.vue'
import type { ClickInteractionEvent } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/BaseInteractionController'
import { formatSlotValue } from '../vehicleMetricSelector/formatMetricValue.ts'
import { useLegend } from '@/shared/ui/chart/legend/useLegend'
import VehicleMetricSelector from '../vehicleMetricSelector/VehicleMetricSelector.vue'
import type { VehicleFilters } from '../filters/types'
import type { Slot } from '../vehicleMetricSelector/vehicleMetrics.ts'
import { VehicleHistoryChart } from '../timeSeries/VehicleHistoryChart'
import type { VehicleThresholds } from '../shared/types'
import type { HistoryAverageWindow, HistoryStep } from '../timeSeries/period/historyStep'
import HistoryToolbarOptions from '../timeSeries/period/HistoryToolbarOptions.vue'
import HistoryAnnotationSettings from '../timeSeries/annotations/settings/HistoryAnnotationSettings.vue'
import { useHistoryAnnotationSettings } from '../timeSeries/annotations/settings/useHistoryAnnotationSettings'
import { useGameVersionAnnotations } from '../timeSeries/annotations/gameVersionAnnotations'
import { useHistoryEventAnnotations } from '../timeSeries/annotations/events/useHistoryEventAnnotations'
import { useHistoryEventStyles } from '../timeSeries/annotations/events/useHistoryEventStyles'
import { applyHistoryFilters, hasHistoryValues } from '../timeSeries/historyValues'
import { snapshotComparisonFilters, type ComparisonSource } from './types'
import { comparisonName } from './comparisonName'
import { useVehicleHistories } from '../timeSeries/useVehicleHistories'
import HistoryTooltipHeader from '../timeSeries/tooltip/HistoryTooltipHeader.vue'

useHistoryEventStyles()

const props = defineProps<{
  filters: VehicleFilters
  sources: readonly ComparisonSource[]
  skipIncompleteDays: boolean
} & VehicleThresholds>()

const emit = defineEmits<{
  remove: [tag: string]
  colorChange: [tag: string, color: string]
  clear: []
}>()

const slot = ref<Slot>('damage')

const step = ref<HistoryStep>('day')
const averageWindow = ref<HistoryAverageWindow>(null)
const annotationOptions = useHistoryAnnotationSettings()
const { annotations: versionAnnotations, versionForPeriod } = useGameVersionAnnotations(
  annotationOptions.versions, computed(() => props.filters.regions), { includeTooltipVersion: true })
const eventAnnotations = useHistoryEventAnnotations(annotationOptions.enabledEvents, computed(() => props.filters.regions))
const annotations = computed(() => [...versionAnnotations.value, ...eventAnnotations.value])

const now = useNow({ interval: 60_000 })
const beforeDay = computed(() => now.value.toISOString().slice(0, 10))

const { states, retry } = useVehicleHistories(() => props.sources, { beforeDay, step, slot })

const currentFilters = computed(() => snapshotComparisonFilters(props.filters))
const legendItems = computed(() => props.sources.map(source => ({
  ...source,
  name: comparisonName(source, currentFilters.value),
  loading: !states.has(source.tag) || states.get(source.tag)?.status === loading,
})))

const legend = useLegend<ComparisonSource & { loading?: boolean }>(legendItems)
const chart = markRaw(new VehicleHistoryChart(legend.highlightSync))
function onSeriesClick({ tag, event }: { tag: string, event: ClickInteractionEvent }) {
  if (event.isTouch) return
  const source = legend.items.value.find(item => item.tag === tag)
  if (!source || !legend.isEnabled(source)) return
  event.preventPanInertion()
  const targets = event.altKey ? legend.items.value.filter(item => item.tag !== tag) : [source]
  legend.setEnabled(targets, false)
}

const histories = computed(() => props.sources.map(source => ({
  tag: source.tag,
  history: applyHistoryFilters(states.get(source.tag)?.data ?? [], slot.value, props,
    step.value, props.skipIncompleteDays),
})))
const series = computed(() => histories.value.map(source => ({
  ...source,
  enabled: legend.isEnabled(source),
})))

const hasValues = computed(() => series.value.some(source => source.enabled &&
  hasHistoryValues(source.history, slot.value)))
const pending = computed(() => legendItems.value.some(source => source.loading))

const emptyMessage = computed(() => {
  if (pending.value) return 'Загружаем историю…'
  if (!legend.enabled.value.length) return 'Включите источники в легенде'
  return 'По выбранным фильтрам нет данных для отображения'
})

const failedSources = computed(() => legendItems.value.filter(source => {
  const state = states.get(source.tag)
  return state && isErrorStatus(state.status)
}))

const emptyTags = computed(() => new Set(histories.value
  .filter(source => states.get(source.tag)?.status === success && !hasHistoryValues(source.history, slot.value))
  .map(source => source.tag)))
const emptySources = computed(() => legendItems.value.filter(source => emptyTags.value.has(source.tag)))

watch([series, slot, beforeDay, step, averageWindow], () => {
  chart.setHistories(series.value, slot.value, beforeDay.value, step.value, averageWindow.value)
}, { immediate: true })

watch(annotations, value => chart.setHistoryAnnotations(value), { immediate: true })
watch(annotationOptions.showWotstatOutages, visible => chart.setOutagesVisible(visible), { immediate: true })
</script>

<style scoped lang="scss">
@use '../timeSeries/annotations/historyAnnotationStyles.scss' as *;

.vehicle-comparison {
  min-width: 0;
  margin-bottom: 28px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.025);

  @media (max-width: 600px) {
    padding: 12px;
  }

  h2 {
    margin: 0;
    font-size: 18px;
    color: white;
    margin-right: 10px;

    span {
      display: inline-block;
      font-variant-numeric: tabular-nums;
      margin-left: 5px;
      color: rgba(255, 255, 255, 0.4);
      font-size: 14px;
    }
  }

  .metric-selector {
    margin-left: 10px;
  }

  .empty-heading {
    color: rgba(255, 255, 255, 0.8);
    font-size: 18px;
  }

  :deep(.chart-state)>span {
    max-width: 520px;
    line-height: 1.5;
  }

  .reset {
    --toolbar-button-height: var(--time-series-legend-height);
  }

  .caption,
  .source-error {
    margin-top: 12px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }

  .source-error {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    button {
      color: var(--blue-thin-color);
    }
  }

  :deep(.time-series-annotation-area),
  :deep(.time-series-annotations .label),
  :deep(.time-series-annotation-ticks .tick-level) {
    @include history-annotation-styles;
    color: var(--history-annotation-color);
  }
}
</style>
