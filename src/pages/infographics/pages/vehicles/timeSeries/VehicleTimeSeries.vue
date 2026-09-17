<template>
  <section class="vehicle-time-series" :aria-label="`${name}: ${availableSlots[slot].label} по дням`"
    :aria-busy="history.status === loading">
    <div class="chart-toolbar">
      <span>По завершённым дням</span>
      <button v-if="hasValues" @click="chart.showAllHistory()">Вся история</button>
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
          <span class="tooltip-date">{{ formatStatisticsDay(ctx.hits[0].datum.day) }} · {{ name }}</span>
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
import { getTankName } from '@/shared/i18n/i18n'
import FloatingTooltip from '@/shared/ui/chart/FloatingTooltip.vue'
import Loader from '@/shared/ui/loaders/loader/Loader.vue'
import UniversalChartComponent from '@/shared/uiKit/chart/universalChart/UniversalChart.vue'
import type { VehicleFilters } from '../filters/types'
import { availableSlots, formatSlotValue, formatStatisticsDay, type Slot } from '../vehicleListTable/helpers'
import { vehicleHistoryQuery } from '../vehicleStatisticsQuery'
import { VehicleHistoryChart, type VehicleHistoryDay } from './VehicleHistoryChart'

const props = defineProps<{
  tankTag: string
  slot: Slot
  filters: VehicleFilters
  minBattles: number
  minPlayers: number
}>()
const name = computed(() => getTankName(props.tankTag, true))
const now = useNow({ interval: 60_000 })
// VehiclesStatistics.day и today() в БД используют UTC. Явная дата в SQL
// обновляет ключ обоих кешей в полночь, в том числе в открытом графике.
const beforeDay = computed(() => now.value.toISOString().slice(0, 10))
const retry = ref(0)
const history = queryComputed<VehicleHistoryDay>(() =>
  `${vehicleHistoryQuery(props.filters, props.tankTag, beforeDay.value)}\n-- retry ${retry.value}`,
  { settings: { use_query_cache: 1, query_cache_ttl: 24 * 60 * 60 } })

const chart = markRaw(new VehicleHistoryChart())
// Сохраняем даты исключённых дней, чтобы пороги не меняли диапазон истории
// и оставались разрывы вместо соединения точек через шумные значения.
const visibleHistory = computed(() => history.value.data.map(row =>
  (row.battles ?? 0) > props.minBattles && (row.playerCount ?? 0) > props.minPlayers
    ? row : { ...row, [props.slot]: null }))
const hasValues = computed(() => history.value.status === success &&
  visibleHistory.value.some(row => row[props.slot] !== null && Number.isFinite(row[props.slot])))

watch([visibleHistory, () => props.slot], () => {
  chart.setHistory(visibleHistory.value, props.slot)
}, { immediate: true })
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
  gap: 12px;
  min-height: 24px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

button {
  color: var(--blue-thin-color);

  &:hover {
    color: white;
  }

  &:focus-visible {
    outline: 2px solid var(--blue-thin-color);
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

  .history-hover-marker {
    fill: var(--blue-thin-color);
  }

  .history-hover-marker {
    stroke-width: 2px;
  }

  .grid .tick {
    stroke: rgba(255, 255, 255, 0.07);
  }

  .tick-level-1 {
    opacity: 0.2;
  }

  .tick-level-2 {
    opacity: 1;
  }

  .time-grid .day-ticks .tick {
    stroke: rgba(255, 255, 255, 0.04);
  }

  .time-grid .year-ticks .tick {
    stroke: rgba(255, 255, 255, 0.16);
  }

  .label {
    font-size: 11px;
    font-weight: bold;
    fill: rgba(255, 255, 255, 0.9);
  }

  .label.value-outside-bounds {
    visibility: hidden;
  }

  .year-labels .label {
    fill: rgba(255, 255, 255, 0.8);
  }

  .interactive-zone {
    cursor: crosshair;
  }
}
</style>
