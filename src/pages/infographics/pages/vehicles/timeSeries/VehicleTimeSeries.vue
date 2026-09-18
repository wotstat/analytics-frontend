<template>
  <section class="vehicle-time-series">

    <div class="chart-toolbar">
      <div class="title">
        <Icon name="chart-line" class="icon" :icon="availableSlots[props.slot].icon" />
        <span>{{ availableSlots[slot].label }}</span>
      </div>
      <div class="step-selector" role="group">
        <a v-for="option in steps" :key="option.value" :class="{ active: step === option.value }"
          @click="step = option.value">{{ option.label }}</a>
        <span class="selector-divider" aria-hidden="true"></span>
        <button v-for="window in averageWindows" :key="window" type="button"
          :class="{ active: averageWindow === window }" :aria-pressed="averageWindow === window"
          v-tooltip:vehicleHistoryAverage.top-float="`Скользящее среднее по ${window} соседним точкам. Повторное нажатие выключает сглаживание`"
          @click="toggleAverage(window)">avg{{ window }}</button>
      </div>
    </div>

    <div class="chart-body">
      <UniversalChartComponent v-show="hasValues" :chart />

      <div v-if="history.status === loading" class="chart-state" role="status">
        <Loader class="loader" />
        <span>Загружаем историю…</span>
      </div>
      <div v-else-if="isErrorStatus(history.status)" class="chart-state" role="alert">
        <span>Не удалось загрузить историю</span>
        <button @click="retry++">Попробовать ещё раз</button>
      </div>
      <div v-else-if="!hasValues" class="chart-state" role="status">По выбранным фильтрам пока нет данных</div>
    </div>

    <FloatingTooltip :ctx="chart.tooltipCtx.value" :offset="12">
      <template #default="{ ctx }">
        <div v-if="ctx.hits[0]" class="history-tooltip">
          <span class="tooltip-date">{{ formatPeriod(ctx.hits[0].datum.periodStart, ctx.hits[0].datum.periodEnd) }} · {{
            name }}</span>
          <div class="tooltip-value">
            <span>{{ availableSlots[ctx.hits[0].datum.slot].label }}</span>
            <b>{{ formatSlotValue(ctx.hits[0].datum.slot, ctx.hits[0].datum.y) }}</b>
          </div>
          <span v-if="ctx.hits[0].datum.slot !== 'battles'" class="tooltip-caption">
            Боёв: {{ formatSlotValue('battles', ctx.hits[0].datum.battles) }}
          </span>
        </div>
      </template>
    </FloatingTooltip>
  </section>
</template>

<script setup lang="ts">
import { computed, markRaw, ref, watch } from 'vue'
import { useNow } from '@vueuse/core'
import { isErrorStatus, loading, queryComputed, success } from '@/db'
import FloatingTooltip from '@/shared/ui/chart/FloatingTooltip.vue'
import Loader from '@/shared/ui/loaders/loader/Loader.vue'
import UniversalChartComponent from '@/shared/uiKit/chart/universalChart/UniversalChart.vue'
import type { VehicleFilters } from '../filters/types'
import { availableSlots, formatSlotValue, formatStatisticsDay, type Slot } from '../vehicleListTable/helpers'
import { vehicleHistoryQuery } from '../vehicleStatisticsQuery'
import { VehicleHistoryChart, type VehicleHistoryPeriod } from './VehicleHistoryChart'
import type { HistoryAverageWindow, HistoryStep } from './historyStep'
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import type { VehicleSelection } from '../vehicleGrouping'

const props = defineProps<{
  selection: VehicleSelection
  name: string
  slot: Slot
  filters: VehicleFilters
  minBattles: number
  minPlayers: number
}>()
const step = defineModel<HistoryStep>('step', { required: true })
const averageWindow = defineModel<HistoryAverageWindow>('averageWindow', { required: true })
const now = useNow({ interval: 60_000 })

const beforeDay = computed(() => now.value.toISOString().slice(0, 10))
const retry = ref(0)
const steps = [
  { value: 'day', label: 'День' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
] as const satisfies readonly { value: HistoryStep, label: string }[]
const averageWindows = [3, 5, 7] as const
const history = queryComputed<VehicleHistoryPeriod>(() =>
  `${vehicleHistoryQuery(props.filters, props.selection, beforeDay.value, step.value)}\n-- retry ${retry.value}`,
  { settings: { use_query_cache: 1, query_cache_ttl: 24 * 60 * 60 } })

const chart = markRaw(new VehicleHistoryChart())

const visibleHistory = computed(() => {
  if (!history.value.data) return []
  return history.value.data.map(row => {
    if ((row.battles ?? 0) > props.minBattles && (row.playerCount ?? 0) > props.minPlayers) return row
    return { ...row, [props.slot]: null }
  })
})

const hasValues = computed(() => history.value.status === success &&
  visibleHistory.value.some(row => row[props.slot] !== null && Number.isFinite(row[props.slot])))

watch([visibleHistory, () => props.slot, beforeDay, step, averageWindow], () => {
  chart.setHistory(visibleHistory.value, props.slot, beforeDay.value, step.value, averageWindow.value)
}, { immediate: true })

function toggleAverage(window: NonNullable<HistoryAverageWindow>) {
  averageWindow.value = averageWindow.value === window ? null : window
}

function formatPeriod(start: string, end: string) {
  const from = formatStatisticsDay(start)
  return start === end ? from : `${from} — ${formatStatisticsDay(end)}`
}
</script>

<style lang="scss" scoped>
.vehicle-time-series {
  margin-top: 12px;
  min-width: 0;
}

.chart-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  min-height: 24px;
  padding-bottom: 3px;

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

  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.step-selector {
  display: flex;
  align-items: center;
  margin-left: auto;
  gap: 8px;

  a,
  button {
    color: rgba(197, 197, 197, 0.6);
    font-size: 12px;
    white-space: nowrap;
    cursor: pointer;
    font-weight: bold;
    padding: 0;

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        color: rgba(255, 255, 255, 0.8);
      }
    }

    &.active {
      color: white;
    }
  }

  .selector-divider {
    height: 14px;
    border-left: 1px solid rgba(255, 255, 255, 0.25);
    margin: 0 2px;
  }
}

button {
  color: var(--blue-thin-color);

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      color: white;
    }
  }
}

.chart-body {
  position: relative;
  height: clamp(230px, 28vw, 320px);
}

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
}

.history-tooltip {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.tooltip-date,
.tooltip-caption {
  color: rgba(255, 255, 255, 0.5);
}

.tooltip-value {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 20px;

  b {
    color: white;
  }
}

:deep(.universal-chart-root) {
  .history-line {
    stroke: var(--blue-thin-color);
    stroke-width: 2px;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  .interaction {

    .history-hover-marker {
      fill: var(--blue-thin-color);
    }

    .history-hover-marker {
      stroke-width: 2px;
    }

  }

  .grid {
    opacity: 0.15;

    .tick {
      stroke: #999;
    }
  }

  .time-grid .tick-level:not(.label-ticks) .tick {
    stroke: #3a3a3a;
  }

  .time-grid .label-ticks.day-ticks .tick {
    stroke: #555;
  }

  .time-grid .label-ticks.week-ticks .tick {
    stroke: #555;
  }

  .time-grid .label-ticks.month-ticks .tick {
    stroke: #999;
  }

  .time-grid .label-ticks.year-ticks .tick {
    stroke: #fff;
  }

  .label {
    font-size: 11px;
    font-weight: bold;
    fill: rgba(255, 255, 255, 0.9);
  }

  .label.value-outside-bounds {
    visibility: hidden;
  }

  .interactive-zone {
    cursor: crosshair;
  }
}
</style>
