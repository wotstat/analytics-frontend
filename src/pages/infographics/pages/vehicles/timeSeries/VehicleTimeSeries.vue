<template>
  <section class="vehicle-time-series" :class="{ split: split !== null }">
    <HeaderTooltip :ctx="split === null ? chart.tooltipCtx.value : null" class="chart-toolbar">
      <template #left>
        <div class="title">
          <Icon name="chart-line" class="icon" :icon="availableSlots[props.slot].icon" />
          <span>{{ availableSlots[slot].label }}</span>
        </div>
      </template>
      <template #right>
        <HistoryControls v-model:step="step" v-model:average-window="averageWindow" compact class="step-selector">
          <button class="split-menu-trigger" :class="{ active: split !== null }" type="button" title="Разбиение графика"
            @click="openSplitMenu">
            <LineChartIcon />
          </button>
          <HistoryAnnotationSettings :settings="annotationOptions" :regions="filters.regions" />
        </HistoryControls>
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
import UniversalChartComponent from '@/shared/uiKit/chart/universalChart/UniversalChart.vue'
import { closeContextMenu, isContextMenuOpen } from '@/shared/uiKit/contextMenu/createContextMenu'
import { checkboxItem, separator, simpleContextMenu } from '@/shared/uiKit/contextMenu/simpleContextMenu'
import type { VehicleFilters } from '../filters/types'
import { availableSlots, type Slot } from '../shared/vehicleMetrics'
import { formatSlotValue } from '../shared/formatMetricValue'
import { formatHistoryPeriod } from './formatHistoryPeriod'
import { vehicleHistoryQuery } from '../shared/vehicleStatisticsQuery'
import { VehicleHistoryChart } from './VehicleHistoryChart'
import type { VehicleHistoryPeriod, VehicleHistorySeries } from '../shared/types'
import type { HistoryAverageWindow, HistoryStep } from './historyStep'
import HistoryControls from './HistoryControls.vue'
import HistoryAnnotationSettings from './HistoryAnnotationSettings.vue'
import LineChartIcon from '../vehicleListTable/assets/line-chart.svg'
import { useHistoryAnnotationSettings } from './useHistoryAnnotationSettings'
import { useGameVersionAnnotations } from './gameVersionAnnotations'
import { useHistoryEventAnnotations } from './useHistoryEventAnnotations'
import { applyHistoryFilters, hasHistoryValues } from './historyValues'
import { historySplitName, historySplitOptions, orderHistorySplitKeys, type VehicleHistorySplit } from './historySplit'
import { historySplitSeriesColor } from './seriesColors'
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import type { VehicleSelection } from '../shared/vehicleGrouping'
import ComparisonTooltip from '../timeSeriesCompare/ComparisonTooltip.vue'

const props = defineProps<{
  selection: VehicleSelection
  name: string
  slot: Slot
  filters: VehicleFilters
  minBattles: number
  minPlayers: number
  skipIncompleteDays: boolean
}>()

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
  `${vehicleHistoryQuery(props.filters, props.selection, beforeDay.value, step.value, split.value)}\n-- retry ${retry.value}`,
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

const series = computed<VehicleHistorySeries[]>(() => {
  if (split.value === null) {
    return [{
      tag: 'vehicle',
      name: '',
      color: 'var(--blue-thin-color)',
      history: applyHistoryFilters(history.value.data, props.slot, props, step.value, props.skipIncompleteDays),
    }]
  }

  return splitSources.value.map(source => ({
    ...source,
    enabled: legend.isEnabled(source),
    history: applyHistoryFilters(history.value.data.filter(row => row.splitKey === source.tag),
      props.slot, props, step.value, props.skipIncompleteDays),
  }))
})

const hasValues = computed(() => history.value.status === success &&
  series.value.some(source => source.enabled !== false &&
    hasHistoryValues(source.history, props.slot)))

watch([series, () => props.slot, beforeDay, step, averageWindow], () => {
  chart.setHistories(series.value, props.slot, beforeDay.value, step.value, averageWindow.value)
}, { immediate: true })

watch(annotations, value => chart.setAnnotations(value), { immediate: true })
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
@use './historyChart.scss' as *;

.vehicle-time-series {
  margin-top: 12px;
  min-width: 0;

  .chart-toolbar {
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

    .title {
      display: flex;
      align-items: center;
      min-width: 0;
      color: white;
      margin-left: -7px;

      span {
        font-size: 16px;
      }

      .icon {
        height: 32px;
      }
    }

    .step-selector {
      margin-left: auto;
    }

    .split-menu-trigger {
      display: grid;
      place-items: center;
      width: 24px;
      height: 24px;
      padding: 0;
      border-radius: 5px;
      color: rgba(197, 197, 197, 0.6);

      svg {
        width: 18px;
        height: 18px;
      }

      &:hover {
        color: rgba(255, 255, 255, 0.8);
        background: rgba(255, 255, 255, 0.08);
      }

      &.active {
        color: var(--blue-thin-color);
        background: rgba(10, 132, 255, 0.12);
      }
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
    @include history-chart;

    .history-line {
      stroke: currentColor;
    }
  }
}
</style>
