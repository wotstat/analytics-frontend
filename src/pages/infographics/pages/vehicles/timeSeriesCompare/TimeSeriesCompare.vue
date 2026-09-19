<template>
  <section class="vehicle-comparison" aria-label="Сравнение техники">
    <ComparisonHistory v-for="source in sources" :key="source.tag" :selection="source.selection" :filters
      :before-day="beforeDay" :step :retry="retries[source.tag] ?? 0" @update="states.set(source.tag, $event)" />

    <div class="toolbar">
      <h2>Сравнение <span v-if="sources.length">{{ sources.length }}</span></h2>
      <select v-model="slot" aria-label="Показатель для сравнения">
        <optgroup v-for="category in slotCategories" :key="category.title" :label="category.title">
          <option v-for="key in category.slots" :key="key" :value="key">{{ availableSlots[key].label }}</option>
        </optgroup>
      </select>
      <div class="steps" role="group" aria-label="Период статистики">
        <button v-for="option in steps" :key="option.value" :class="{ active: step === option.value }"
          :aria-pressed="step === option.value" @click="step = option.value">{{ option.label }}</button>
        <span class="divider"></span>
        <button v-for="window in averageWindows" :key="window" :class="{ active: averageWindow === window }"
          :aria-pressed="averageWindow === window" :title="`Скользящее среднее по ${window} точкам`"
          @click="averageWindow = averageWindow === window ? null : window">avg{{ window }}</button>
      </div>
    </div>

    <div class="chart-body">
      <UniversalChartComponent v-show="hasValues" :chart />
      <div v-if="!sources.length" class="chart-state">
        <b>Сравните танки на одном графике</b>
        <span>Нажмите «+» в таблице ниже. Чтобы добавить среднее по уровню или классу, выберите нужный режим
          таблицы.</span>
      </div>
      <div v-else-if="!hasValues" class="chart-state" role="status">
        {{
          pending ? 'Загружаем историю…' : !legend.enabled.value.length ?
            'Включите источники в легенде' :
            'По выбранным фильтрам нет данных для отображения'
        }}
      </div>
    </div>

    <Legend v-if="sources.length" :legend toggleable highlightable color-editable removable @color-change="setColor"
      @remove="remove" class="legend" />

    <div v-if="pending && hasValues" class="caption" role="status">Загружаем остальные источники…</div>
    <div v-for="source in failedSources" :key="source.tag" class="source-error" role="alert">
      <span>{{ source.name }}: не удалось загрузить историю.</span>
      <button @click="retries[source.tag] = (retries[source.tag] ?? 0) + 1">Повторить</button>
    </div>
    <div v-if="emptySources.length" class="caption">Нет данных: {{emptySources.map(source => source.name).join(', ')}}
    </div>

    <FloatingTooltip :ctx="chart.tooltipCtx.value" :offset="12">
      <template #default="{ ctx }">
        <div class="comparison-tooltip">
          <b>{{ availableSlots[slot].label }}</b>
          <div v-for="hit in ctx.hits" :key="hit.datum.series" class="tooltip-row">
            <span class="dot" :style="{ backgroundColor: hit.datum.color }"></span>
            <div class="tooltip-source">
              <span>{{ hit.datum.name }}</span>
              <small>{{ formatStatisticsDay(hit.datum.periodStart) }}<template
                  v-if="hit.datum.periodEnd !== hit.datum.periodStart"> — {{ formatStatisticsDay(hit.datum.periodEnd)
                  }}</template></small>
            </div>
            <b>{{ formatSlotValue(slot, hit.datum.y) }}</b>
          </div>
        </div>
      </template>
    </FloatingTooltip>
  </section>
</template>

<script setup lang="ts">
import { computed, markRaw, reactive, ref, watch } from 'vue'
import { useNow } from '@vueuse/core'
import { isErrorStatus, loading, success, type Status } from '@/db'
import Legend from '@/shared/ui/chart/Legend.vue'
import { useLegend, type LegendItem } from '@/shared/ui/chart/useLegend'
import FloatingTooltip from '@/shared/ui/chart/FloatingTooltip.vue'
import UniversalChartComponent from '@/shared/uiKit/chart/universalChart/UniversalChart.vue'
import type { VehicleFilters } from '../filters/types'
import { availableSlots, formatSlotValue, formatStatisticsDay, slotCategories, type Slot } from '../vehicleListTable/helpers'
import { VehicleHistoryChart, type VehicleHistoryPeriod } from '../timeSeries/VehicleHistoryChart'
import type { HistoryAverageWindow, HistoryStep } from '../timeSeries/historyStep'
import type { ComparisonSource } from './types'
import ComparisonHistory from './ComparisonHistory.vue'

const props = defineProps<{ filters: VehicleFilters, minBattles: number, minPlayers: number }>()
const sources = defineModel<ComparisonSource[]>({ required: true })
const slot = ref<Slot>('damage')
const step = ref<HistoryStep>('day')
const averageWindow = ref<HistoryAverageWindow>(null)
const averageWindows = [3, 5, 7] as const
const steps = [{ value: 'day', label: 'День' }, { value: 'week', label: 'Неделя' }, { value: 'month', label: 'Месяц' }] as const
const now = useNow({ interval: 60_000 })
const beforeDay = computed(() => now.value.toISOString().slice(0, 10))
const states = reactive(new Map<string, { status: Status, data: VehicleHistoryPeriod[] }>())
const retries = reactive<Record<string, number>>({})
const legend = useLegend(sources)
const chart = markRaw(new VehicleHistoryChart(legend.highlightSync))
const series = computed(() => sources.value.map(source => ({
  ...source,
  enabled: legend.isEnabled(source),
  history: (states.get(source.tag)?.data ?? []).map(row =>
    (row.battles ?? 0) > props.minBattles && (row.playerCount ?? 0) > props.minPlayers
      ? row : { ...row, [slot.value]: null }),
})))
const hasValues = computed(() => series.value.some(source => source.enabled &&
  source.history.some(row => row[slot.value] !== null && Number.isFinite(row[slot.value]))))
const pending = computed(() => sources.value.some(source => !states.has(source.tag) || states.get(source.tag)?.status === loading))
const failedSources = computed(() => sources.value.filter(source => {
  const state = states.get(source.tag)
  return state && isErrorStatus(state.status)
}))
const emptySources = computed(() => series.value.filter(source => states.get(source.tag)?.status === success &&
  !source.history.some(row => row[slot.value] !== null && Number.isFinite(row[slot.value]))))

watch([series, slot, beforeDay, step, averageWindow], () => {
  chart.setHistories(series.value, slot.value, beforeDay.value, step.value, averageWindow.value)
}, { immediate: true })

function setColor(source: LegendItem, color: string) {
  sources.value = sources.value.map(item => item.tag === source.tag ? { ...item, color } : item)
}

function remove(source: LegendItem) {
  sources.value = sources.value.filter(item => item.tag !== source.tag)
  states.delete(String(source.tag))
  delete retries[String(source.tag)]
}
</script>

<style scoped lang="scss">
.vehicle-comparison {
  min-width: 0;
  margin-bottom: 28px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.025);
}

.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

h2 {
  margin: 0;
  font-size: 18px;
  color: white;
}

h2 span {
  margin-left: 5px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}

select {
  min-width: 0;
  max-width: 100%;
  padding: 6px 8px;
  border: 0;
  border-radius: 5px;
  color: white;
  color-scheme: dark;
  background: rgba(255, 255, 255, 0.08);
  font: inherit;
}

.steps {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-left: auto;
}

.steps button {
  padding: 3px 0;
  color: rgba(255, 255, 255, 0.45);
  font-size: 12px;
  font-weight: bold;
}

.steps button.active,
.steps button:hover {
  color: white;
}

.divider {
  height: 14px;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  margin: 0 3px;
}

.reset,
.source-error button {
  color: var(--blue-thin-color);
}

.chart-body {
  position: relative;
  height: clamp(260px, 30vw, 400px);
  margin: 12px 0;
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
  justify-content: center;
  align-items: center;
  gap: 12px;
  text-align: center;
  color: rgba(255, 255, 255, 0.45);
  padding: 20px;

  b {
    color: rgba(255, 255, 255, 0.8);
    font-size: 18px;
  }

  span {
    max-width: 520px;
    line-height: 1.5;
  }
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
}

.comparison-tooltip {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 12px;
  max-height: 50vh;
  overflow-y: auto;
}

.tooltip-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tooltip-row>b {
  margin-left: auto;
  padding-left: 16px;
  font-variant-numeric: tabular-nums;
}

.tooltip-source {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.tooltip-source small {
  color: rgba(255, 255, 255, 0.45);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

:deep(.universal-chart-root) {
  .history-line {
    stroke-width: 2px;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  .history-line.highlighted {
    stroke-width: 3.5px;
  }

  .history-hover-marker {
    fill: white;
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

@media (max-width: 600px) {
  .vehicle-comparison {
    padding: 12px;
  }

  .steps {
    margin-left: 0;
  }
}
</style>
