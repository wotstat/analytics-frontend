<template>
  <section class="vehicle-time-series">

    <HeaderTooltip :ctx="chart.tooltipCtx.value" class="chart-toolbar">
      <template #left>
        <div class="title">
          <Icon name="chart-line" class="icon" :icon="availableSlots[props.slot].icon" />
          <span>{{ availableSlots[slot].label }}</span>
        </div>
      </template>
      <template #right>
        <div class="step-selector" role="group">
          <a v-for="option in steps" :key="option.value" :class="{ active: step === option.value }"
            @click="step = option.value">{{ option.label }}</a>
          <span class="selector-divider" aria-hidden="true"></span>
          <button v-for="window in averageWindows" :key="window" type="button"
            :class="{ active: averageWindow === window }" :aria-pressed="averageWindow === window"
            v-tooltip:vehicleHistoryAverage.top-float="`Скользящее среднее по ${window} соседним точкам. Повторное нажатие выключает сглаживание`"
            @click="toggleAverage(window)">avg{{ window }}</button>
        </div>
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

  </section>
</template>

<script setup lang="ts">
import { computed, markRaw, ref, watch } from 'vue'
import { useNow } from '@vueuse/core'
import { isErrorStatus, loading, queryComputed, success } from '@/db'
import HeaderTooltip from '@/shared/ui/chart/HeaderTooltip.vue'
import Loader from '@/shared/ui/loaders/loader/Loader.vue'
import UniversalChartComponent from '@/shared/uiKit/chart/universalChart/UniversalChart.vue'
import type { VehicleFilters } from '../filters/types'
import { availableSlots, formatSlotValue, type Slot } from '../vehicleListTable/helpers'
import { formatHistoryPeriod } from './formatHistoryPeriod'
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

</script>

<style lang="scss" scoped>
.vehicle-time-series {
  margin-top: 12px;
  min-width: 0;
}

.chart-toolbar {
  padding-bottom: 3px;

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

  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.history-tooltip {
  text-align: center;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  pointer-events: none;
  padding-bottom: 3px;
}

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
    opacity: 0.2;


    .y-ticks .tick {
      stroke: rgb(255, 255, 255, 0.5);
    }

    .tick {
      stroke: rgb(255, 255, 255, 0.04);
    }

    .label-ticks {
      &.day-ticks .tick {
        stroke: rgb(255, 255, 255, 0.15);
      }

      &.week-ticks .tick {
        stroke: rgb(255, 255, 255, 0.15);
      }

      &.month-ticks .tick {
        stroke: rgb(255, 255, 255, 0.4);
      }

      &.year-ticks .tick {
        stroke: rgb(255, 255, 255, 1);
      }
    }
  }

  .label {
    font-size: 11px;
    font-weight: bold;
    fill: rgba(255, 255, 255, 0.9);
  }


  .day-labels .label {
    font-weight: normal;
  }

  .label.value-outside-bounds {
    visibility: hidden;
  }

  .interactive-zone {
    cursor: crosshair;
  }
}
</style>
