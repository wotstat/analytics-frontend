<template>
  <section class="vehicle-time-series" :class="{ split: split !== null, 'with-annotations': annotations.length > 0 }">
    <HeaderTooltip :ctx="split === null ? chart.tooltipCtx.value : null" class="history-toolbar-header">
      <template #left>
        <VehicleMetricSelector v-model="slot" />
      </template>
      <template #right>
        <HistoryToolbar v-model:step="step" v-model:average-window="averageWindow" density="compact">
          <template #actions>
            <ToolbarButton :icon="LineChartIcon" variant="accent" :active="split !== null"
              @click="openSplitMenu" />
            <HistoryAnnotationSettings :settings="annotationOptions" :regions="filters.regions" />
          </template>
        </HistoryToolbar>
      </template>
      <template #tooltip="{ ctx }">
        <div class="history-tooltip">
          <div class="tooltip-value">
            <b>{{ formatSlotValue(ctx.hit.datum.slot, ctx.hit.datum.y) }}</b>
          </div>
          <div class="tooltip-date">{{ formatHistoryPeriod(ctx.hit.datum.periodStart, ctx.hit.datum.periodEnd,
            ctx.hit.datum.step) }}</div>
        </div>
      </template>
    </HeaderTooltip>

    <div class="chart-body">
      <UniversalChartComponent v-show="hasValues" :chart />

      <div v-if="history.status === loading" class="chart-state">
        <Loader class="loader" />
        <span>Загружаем историю…</span>
      </div>
      <div v-else-if="isErrorStatus(history.status)" class="chart-state">
        <span>Не удалось загрузить историю</span>
        <button @click="retry++">Попробовать ещё раз</button>
      </div>
      <div v-else-if="!hasValues" class="chart-state">По выбранным фильтрам пока нет данных</div>
    </div>

    <Legend v-if="split !== null && splitSources.length" :legend toggleable highlightable class="legend" />

    <FloatingTooltip v-if="split !== null" :ctx="chart.tooltipCtx.value" anchor="pivot-x"
      :placement="['top-float', 'bottom-float']" :offset="{ top: 28, bottom: annotations.length ? 40 : 12 }">
      <template #default="{ ctx }">
        <ComparisonTooltip :ctx :sources="legend.enabled.value" />
      </template>
    </FloatingTooltip>
  </section>
</template>

<script setup lang="ts">
import { computed, markRaw, onBeforeUnmount, ref, watch } from 'vue'
import { useNow } from '@vueuse/core'
import { isErrorStatus, loading, queryComputed, success } from '@/db'
import HeaderTooltip from '@/shared/ui/chart/HeaderTooltip.vue'
import FloatingTooltip from '@/shared/ui/chart/FloatingTooltip.vue'
import Legend from '@/shared/ui/chart/Legend.vue'
import { useLegend } from '@/shared/ui/chart/useLegend'
import Loader from '@/shared/ui/loaders/loader/Loader.vue'
import ToolbarButton from '@/shared/ui/toolbarButton/ToolbarButton.vue'
import UniversalChartComponent from '@/shared/uiKit/chart/universalChart/UniversalChart.vue'
import { closeContextMenu, isContextMenuOpen } from '@/shared/uiKit/contextMenu/createContextMenu'
import { checkboxItem, separator, simpleContextMenu } from '@/shared/uiKit/contextMenu/simpleContextMenu'
import type { VehicleFilters } from '../filters/types'
import type { Slot } from '../shared/vehicleMetrics'
import { formatSlotValue } from '../shared/formatMetricValue'
import { formatHistoryPeriod } from './formatHistoryPeriod'
import { vehicleHistoryQuery } from '../shared/vehicleStatisticsQuery'
import { VehicleHistoryChart } from './VehicleHistoryChart'
import type { VehicleHistoryPeriod, VehicleHistorySeries } from '../shared/types'
import type { HistoryAverageWindow, HistoryStep } from './historyStep'
import HistoryToolbar from './HistoryToolbar.vue'
import HistoryAnnotationSettings from './HistoryAnnotationSettings.vue'
import LineChartIcon from '../vehicleListTable/assets/line-chart.svg'
import { useHistoryAnnotationSettings } from './useHistoryAnnotationSettings'
import { useGameVersionAnnotations } from './gameVersionAnnotations'
import { useHistoryEventAnnotations } from './useHistoryEventAnnotations'
import { useHistoryEventStyles } from './useHistoryEventStyles'
import { applyHistoryFilters, hasHistoryValues } from './historyValues'
import { historySplitName, historySplitOptions, orderHistorySplitKeys, type VehicleHistorySplit } from './historySplit'
import { historySplitSeriesColor } from './seriesColors'
import VehicleMetricSelector from '../VehicleMetricSelector.vue'
import type { VehicleSelection } from '../shared/vehicleGrouping'
import ComparisonTooltip from '../timeSeriesCompare/ComparisonTooltip.vue'

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
const retry = ref(0)

type SplitHistoryPeriod = VehicleHistoryPeriod & { splitKey?: string }
type SplitSource = { tag: string, name: string, color: string }

const history = queryComputed<SplitHistoryPeriod>(() =>
  `${vehicleHistoryQuery(props.filters, props.selection, beforeDay.value, step.value, split.value, [slot.value])}\n-- retry ${retry.value}`,
  { settings: { use_query_cache: 1, query_cache_ttl: 24 * 60 * 60 } })

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

const legend = useLegend(splitSources)
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

watch(() => split.value === null
  ? [{ tag: 'vehicle', color: 'var(--blue-thin-color)' }]
  : splitSources.value, colors => chart.setSeriesColors(colors), { immediate: true })

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
@use '@/shared/ui/chart/timeSeriesChart.scss' as *;
@use '@/shared/ui/chart/timeSeriesAnnotations.scss' as *;
@use './historyAnnotationStyles.scss' as *;

.vehicle-time-series {
  margin-top: 12px;
  min-width: 0;

  .history-toolbar-header {
    padding-bottom: 3px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 2px;

    :deep(.items) {
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      min-height: 38px;
    }

    :deep(.right) {
      margin-left: auto;
    }

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
  }

  .chart-body {
    position: relative;
    height: clamp(230px, 28vw, 320px);

    .chart-container {
      width: 100%;
      height: 100%;
    }

    .chart-state {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      color: rgba(255, 255, 255, 0.55);
      text-align: center;

      .loader {
        font-size: 3px;
        margin-bottom: 16px;
      }

      button {
        color: var(--blue-thin-color);

        @media (hover: hover) and (pointer: fine) {
          &:hover {
            color: white;
          }
        }
      }
    }
  }

  .legend {
    margin-top: 10px;
  }

  :deep(.universal-chart-root) {
    @include time-series-chart;
    @include time-series-annotations;

    .time-series-annotation-area,
    .time-series-annotations .label,
    .time-series-annotation-ticks .tick-level {
      @include history-annotation-styles;
      color: var(--history-annotation-color);
    }
  }

  &.with-annotations :deep(.grid) {
    opacity: 0.1;
  }
}
</style>
