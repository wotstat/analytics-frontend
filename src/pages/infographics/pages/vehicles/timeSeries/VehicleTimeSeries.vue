<template>
  <TimeSeriesPanel :chart :legend :has-values="hasValues" density="compact"
    :tooltip="split === null ? 'header' : 'floating'" :show-legend="split !== null"
    :annotation-labels="annotations.length > 0"
    :format-value="(value, ctx) => formatSlotValue(ctx.hit.datum.slot, value)" class="vehicle-time-series">

    <template #header>
      <VehicleMetricSelector v-model="slot" />
    </template>

    <template #toolbar>
      <HistoryToolbarOptions v-model:step="step" v-model:average-window="averageWindow" />
    </template>

    <template #actions>
      <ToolbarButton :icon="LineChartIcon" variant="accent" :active="split !== null" @click="openSplitMenu" />
      <HistoryAnnotationSettings :settings="annotationOptions" :regions="filters.regions" />
    </template>

    <template v-if="split === null" #tooltip="{ ctx }">
      <div class="history-tooltip">
        <div class="tooltip-value"><b>{{ formatSlotValue(ctx.hit.datum.slot, ctx.hit.datum.y) }}</b></div>
        <div class="tooltip-date">{{ formatHistoryPeriod(ctx.hit.datum.periodStart, ctx.hit.datum.periodEnd,
          ctx.hit.datum.step) }}</div>
      </div>
    </template>

    <template #tooltip-header="{ ctx, horizontal }">
      <HistoryTooltipHeader :point="ctx.hit.datum" :horizontal />
    </template>

    <template v-if="history.status === loading || isErrorStatus(history.status) || !hasValues" #state>
      <template v-if="history.status === loading">
        <Loader class="loader" />
        <span>Загружаем историю…</span>
      </template>

      <template v-else-if="isErrorStatus(history.status)">
        <span>Не удалось загрузить историю</span>
        <button class="retry" @click="retry('vehicle')">Попробовать ещё раз</button>
      </template>

      <template v-else>По выбранным фильтрам пока нет данных</template>
    </template>
  </TimeSeriesPanel>
</template>

<script setup lang="ts">
import { computed, markRaw, onBeforeUnmount, ref, watch } from 'vue'
import { useNow } from '@vueuse/core'
import { isErrorStatus, loading, success, type Status } from '@/db'
import TimeSeriesPanel from '@/shared/ui/chart/timeSeries/panel/TimeSeriesPanel.vue'
import { useLegend } from '@/shared/ui/chart/legend/useLegend'
import Loader from '@/shared/ui/loaders/loader/Loader.vue'
import ToolbarButton from '@/shared/ui/toolbarButton/ToolbarButton.vue'
import { closeContextMenu, isContextMenuOpen } from '@/shared/uiKit/contextMenu/createContextMenu'
import { checkboxItem, separator, simpleContextMenu } from '@/shared/uiKit/contextMenu/simpleContextMenu'
import type { VehicleFilters } from '../filters/types'
import type { Slot } from '../vehicleMetricSelector/vehicleMetrics.ts'
import { formatSlotValue } from '../vehicleMetricSelector/formatMetricValue.ts'
import { formatHistoryPeriod } from './tooltip/formatHistoryPeriod'
import { useVehicleHistories } from './useVehicleHistories'
import { VehicleHistoryChart } from './VehicleHistoryChart'
import type { VehicleHistoryPeriod, VehicleHistorySeries } from '../shared/types'
import type { HistoryAverageWindow, HistoryStep } from './period/historyStep'
import HistoryToolbarOptions from './period/HistoryToolbarOptions.vue'
import HistoryAnnotationSettings from './annotations/settings/HistoryAnnotationSettings.vue'
import LineChartIcon from './line-chart.svg'
import { useHistoryAnnotationSettings } from './annotations/settings/useHistoryAnnotationSettings'
import { useGameVersionAnnotations } from './annotations/gameVersionAnnotations'
import { useHistoryEventAnnotations } from './annotations/events/useHistoryEventAnnotations'
import { useHistoryEventStyles } from './annotations/events/useHistoryEventStyles'
import { applyHistoryFilters, hasHistoryValues } from './historyValues'
import { historySplitName, historySplitOptions, orderHistorySplitKeys, type VehicleHistorySplit } from './split/historySplit'
import { historySplitSeriesColor } from './split/seriesColors'
import VehicleMetricSelector from '../vehicleMetricSelector/VehicleMetricSelector.vue'
import type { VehicleSelection } from '../shared/vehicleGrouping'
import HistoryTooltipHeader from './tooltip/HistoryTooltipHeader.vue'

useHistoryEventStyles()

const props = defineProps<{
  selection: VehicleSelection
  name: string
  filters: VehicleFilters
  minBattles: number
  minPlayers: number
  skipIncompleteDays: boolean
}>()

const slot = defineModel<Slot>('slot', { required: true })
const step = defineModel<HistoryStep>('step', { required: true })
const averageWindow = defineModel<HistoryAverageWindow>('averageWindow', { required: true })
const split = ref<VehicleHistorySplit | null>(null)
const annotationOptions = useHistoryAnnotationSettings()
const { annotations: versionAnnotations } = useGameVersionAnnotations(
  annotationOptions.versions, computed(() => props.filters.regions))
const eventAnnotations = useHistoryEventAnnotations(annotationOptions.enabledEvents, computed(() => props.filters.regions))
const annotations = computed(() => [...versionAnnotations.value, ...eventAnnotations.value])

const now = useNow({ interval: 60_000 })

const beforeDay = computed(() => now.value.toISOString().slice(0, 10))

type SplitSource = { tag: string, name: string, color: string }

const { states, retry } = useVehicleHistories(() => [{
  tag: 'vehicle', filters: props.filters, selection: props.selection, split: split.value,
}], { beforeDay, step, slot })
const history = computed<{ status: Status, data: VehicleHistoryPeriod[] }>(() =>
  states.get('vehicle') ?? { status: loading, data: [] })

const splitSources = computed<SplitSource[]>(() => {
  const activeSplit = split.value
  if (activeSplit === null) return []

  const keys = orderHistorySplitKeys(activeSplit,
    [...new Set(history.value.data.flatMap(row => row.splitKey ? [row.splitKey] : []))])

  return keys.map((key, index) => ({
    tag: key,
    name: historySplitName(activeSplit, key),
    color: historySplitSeriesColor(activeSplit, key, index),
  }))
})

const legendItems = computed(() => split.value === null
  ? [{ tag: 'vehicle', name: props.name, color: 'var(--blue-thin-color)' }]
  : splitSources.value)
const legend = useLegend(legendItems)
const chart = markRaw(new VehicleHistoryChart(legend.highlightSync))

const histories = computed<VehicleHistorySeries[]>(() => {
  if (split.value === null) {
    return [{
      tag: 'vehicle',
      history: applyHistoryFilters(history.value.data, slot.value, props, step.value, props.skipIncompleteDays),
    }]
  }

  return splitSources.value.map(source => ({
    tag: source.tag,
    history: applyHistoryFilters(history.value.data.filter(row => row.splitKey === source.tag),
      slot.value, props, step.value, props.skipIncompleteDays),
  }))
})
const series = computed(() => histories.value.map(source => ({
  ...source,
  enabled: legend.isEnabled(source),
})))

const hasValues = computed(() => history.value.status === success &&
  series.value.some(source => source.enabled !== false &&
    hasHistoryValues(source.history, slot.value)))

watch([series, slot, beforeDay, step, averageWindow], () => {
  chart.setHistories(series.value, slot.value, beforeDay.value, step.value, averageWindow.value)
}, { immediate: true })

watch(annotations, value => chart.setHistoryAnnotations(value), { immediate: true })
watch(annotationOptions.showWotstatOutages, visible => chart.setOutagesVisible(visible), { immediate: true })

let splitMenuId = -1

function selectSplit(value: VehicleHistorySplit | null) {
  split.value = value
  closeContextMenu(splitMenuId)
}

function openSplitMenu(event: MouseEvent) {
  if (isContextMenuOpen(splitMenuId)) {
    closeContextMenu(splitMenuId)
    return
  }

  const target = event.currentTarget as HTMLElement
  const { id } = simpleContextMenu({
    position: target.getBoundingClientRect(),
    alignX: 'right',
    alignY: 'bottom',
    closeOnScroll: true,
    closeOnAction: false,
  }, [
    checkboxItem('Без разбиения', {
      value: computed(() => split.value === null),
      toggle: () => selectSplit(null),
    }),
    separator,
    ...historySplitOptions.map(option => checkboxItem(option.label, {
      value: computed(() => split.value === option.value),
      toggle: () => selectSplit(option.value),
    })),
  ])

  splitMenuId = id
}

onBeforeUnmount(() => closeContextMenu(splitMenuId))
</script>

<style lang="scss" scoped>
@use './annotations/historyAnnotationStyles.scss' as *;

.vehicle-time-series {
  margin-top: 12px;

  .history-tooltip {
    text-align: center;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    pointer-events: none;
    padding-bottom: 3px;

    .tooltip-value {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 8px;

      b {
        color: white;
        font-size: 20px;
        line-height: 20px;
      }
    }

    .tooltip-date {
      color: rgba(255, 255, 255, 0.5);
      font-size: 11px;
      line-height: 1;
      margin-top: 3px;
    }
  }

  .loader {
    font-size: 3px;
    margin-bottom: 16px;
  }

  .retry {
    color: var(--blue-thin-color);

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        color: white;
      }
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
