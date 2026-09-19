<template>
  <section class="vehicle-comparison">
    <ComparisonHistory v-for="source in sources" :key="source.tag" :selection="source.selection" :filters="source.filters"
      :before-day="beforeDay" :step :retry="retries[source.tag] ?? 0" @update="states.set(source.tag, $event)" />

    <div class="toolbar">
      <h2>Сравнение <span v-if="sources.length">{{ sources.length }}</span></h2>

      <button ref="metricTrigger" class="metric-trigger" @click="metricSelectorOpen = !metricSelectorOpen">
        <Icon :icon="availableSlots[slot].icon" class="metric-icon" />
        <span class="metric-label">{{ availableSlots[slot].label }}</span>
        <ArrowDown class="metric-arrow" />
      </button>

      <PopoverAutoClose v-model="metricSelectorOpen" :target="metricTrigger"
        :placement="['bottom-start', 'bottom-float']" :viewport-offset="popoverViewportOffset" :arrow-size="0">
        <VehicleSlotOptions title="Выбор метрики" :selected="[slot]" @select="selectMetric" />
      </PopoverAutoClose>

      <div class="steps" role="group">
        <button v-for="option in steps" :key="option.value" :class="{ active: step === option.value }"
          @click="step = option.value">{{ option.label }}</button>
        <span class="divider"></span>
        <button v-for="window in averageWindows" :key="window" :class="{ active: averageWindow === window }"
          :title="`Скользящее среднее по ${window} точкам`"
          @click="averageWindow = averageWindow === window ? null : window">avg{{ window }}</button>
      </div>
    </div>

    <div class="comparison-content">
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

      <div class="comparison-details">
        <div v-if="sources.length" class="legend-row">
          <Legend :legend toggleable highlightable color-editable removable @color-change="setColor"
            @remove="remove" class="legend" />
          <button type="button" class="reset" aria-label="Сбросить сравнение" title="Сбросить сравнение"
            @click="sources = []">
            <ResetIcon />
          </button>
        </div>

        <div v-for="source in failedSources" :key="source.tag" class="source-error" role="alert">
          <span>{{ source.name }}: не удалось загрузить историю.</span>
          <button @click="retries[source.tag] = (retries[source.tag] ?? 0) + 1">Повторить</button>
        </div>
        <div v-if="emptySources.length" class="caption">
          Нет данных: {{emptySources.map(source => source.name).join(', ')}}
        </div>
      </div>
    </div>

    <FloatingTooltip :ctx="chart.tooltipCtx.value" anchor="pivot-x" :placement="['top-float', 'bottom-float']"
      :offset="12">
      <template #default="{ ctx }">
        <ComparisonTooltip :ctx :sources="legend.enabled.value" />
      </template>
    </FloatingTooltip>
  </section>
</template>

<script setup lang="ts">
import { computed, markRaw, reactive, ref, useTemplateRef, watch } from 'vue'
import { useNow } from '@vueuse/core'
import { isErrorStatus, loading, success, type Status } from '@/db'
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import ArrowDown from '@/assets/icons/arrow-down.svg'
import ResetIcon from '@/assets/icons/reset.svg'
import Legend from '@/shared/ui/chart/Legend.vue'
import { useLegend, type LegendItem } from '@/shared/ui/chart/useLegend'
import FloatingTooltip from '@/shared/ui/chart/FloatingTooltip.vue'
import UniversalChartComponent from '@/shared/uiKit/chart/universalChart/UniversalChart.vue'
import PopoverAutoClose from '@/shared/uiKit/popover/PopoverAutoClose.vue'
import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import VehicleSlotOptions from '../VehicleSlotOptions.vue'
import type { VehicleFilters } from '../filters/types'
import { availableSlots, type Slot } from '../vehicleListTable/helpers'
import { VehicleHistoryChart, type VehicleHistoryPeriod } from '../timeSeries/VehicleHistoryChart'
import type { HistoryAverageWindow, HistoryStep } from '../timeSeries/historyStep'
import { snapshotComparisonFilters, type ComparisonSource } from './types'
import { comparisonName } from './comparisonName'
import type { LocalVehicleFilters } from '../vehicleListTable/localFilters'
import ComparisonHistory from './ComparisonHistory.vue'
import ComparisonTooltip from './ComparisonTooltip.vue'

const props = defineProps<{ filters: VehicleFilters } & Pick<LocalVehicleFilters, 'minBattles' | 'minPlayers'>>()
const sources = defineModel<ComparisonSource[]>({ required: true })
const slot = ref<Slot>('damage')
const metricSelectorOpen = ref(false)
const metricTrigger = useTemplateRef<HTMLButtonElement>('metricTrigger')
const step = ref<HistoryStep>('day')
const averageWindow = ref<HistoryAverageWindow>(null)
const averageWindows = [3, 5, 7] as const
const steps = [{ value: 'day', label: 'День' }, { value: 'week', label: 'Неделя' }, { value: 'month', label: 'Месяц' }] as const
const now = useNow({ interval: 60_000 })
const beforeDay = computed(() => now.value.toISOString().slice(0, 10))
const states = reactive(new Map<string, { status: Status, data: VehicleHistoryPeriod[] }>())
const retries = reactive<Record<string, number>>({})
const currentFilters = computed(() => snapshotComparisonFilters(props.filters))
const legendItems = computed(() => sources.value.map(source => ({
  ...source,
  name: comparisonName(source, currentFilters.value),
  loading: !states.has(source.tag) || states.get(source.tag)?.status === loading,
})))
const legend = useLegend(legendItems)
const chart = markRaw(new VehicleHistoryChart(legend.highlightSync))
const series = computed(() => legendItems.value.map(source => ({
  ...source,
  enabled: legend.isEnabled(source),
  history: (states.get(source.tag)?.data ?? []).map(row =>
    (row.battles ?? 0) > props.minBattles && (row.playerCount ?? 0) > props.minPlayers
      ? row : { ...row, [slot.value]: null }),
})))
const hasValues = computed(() => series.value.some(source => source.enabled &&
  source.history.some(row => row[slot.value] !== null && Number.isFinite(row[slot.value]))))
const pending = computed(() => legendItems.value.some(source => source.loading))
const failedSources = computed(() => legendItems.value.filter(source => {
  const state = states.get(source.tag)
  return state && isErrorStatus(state.status)
}))
const emptySources = computed(() => series.value.filter(source => states.get(source.tag)?.status === success &&
  !source.history.some(row => row[slot.value] !== null && Number.isFinite(row[slot.value]))))

watch([series, slot, beforeDay, step, averageWindow], () => {
  chart.setHistories(series.value, slot.value, beforeDay.value, step.value, averageWindow.value)
}, { immediate: true })

watch(() => sources.value.map(source => source.tag), tags => {
  const selected = new Set(tags)
  for (const tag of states.keys()) {
    if (!selected.has(tag)) states.delete(tag)
  }
  for (const tag of Object.keys(retries)) {
    if (!selected.has(tag)) delete retries[tag]
  }
})

function selectMetric(value: Slot) {
  slot.value = value
  metricSelectorOpen.value = false
  metricTrigger.value?.focus()
}

function setColor(source: LegendItem, color: string) {
  sources.value = sources.value.map(item => item.tag === source.tag ? { ...item, color } : item)
}

function remove(source: LegendItem) {
  sources.value = sources.value.filter(item => item.tag !== source.tag)
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
}

h2 {
  margin: 0;
  font-size: 18px;
  color: white;
}

h2 span {
  display: inline-block;
  font-variant-numeric: tabular-nums;
  margin-left: 5px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}

h2 span.empty {
  visibility: hidden;
}

.metric-trigger {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  height: 30px;
  padding: 0 8px 0 1px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  font-size: 14px;
  margin-left: 10px;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

.metric-icon {
  flex: none;
  width: 30px;
  height: 30px;
}

.metric-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-arrow {
  flex: none;
  width: 10px;
  height: 10px;
  margin-left: 5px;
  fill: currentColor;
  opacity: 0.6;
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

@media (hover: hover) and (pointer: fine) {
  .steps button:hover {
    color: rgba(255, 255, 255, 0.8);
  }
}

.steps button.active {
  color: white;
}

.divider {
  height: 14px;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  margin: 0 3px;
}

.source-error button {
  color: var(--blue-thin-color);
}

.legend-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.legend {
  flex: 1;
  min-width: 0;
}

.reset {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: rgba(255, 255, 255, 0.65);
  transition: color 0.15s;

  &:hover {
    color: white;
  }

  svg {
    width: 16px;
    height: 16px;
  }
}

.comparison-content {
  --legend-row-height: 21px;
  --legend-gap: 12px;
  display: flex;
  flex-direction: column;
  gap: var(--legend-gap);
  margin-top: 12px;
}

.chart-body {
  position: relative;
  flex-shrink: 0;
  height: calc(clamp(260px, 30vw, 400px) - var(--legend-row-height) - var(--legend-gap));
}

.comparison-details {
  min-height: var(--legend-row-height);
  overflow-wrap: anywhere;
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

:deep(.universal-chart-root) {
  .history-line {
    stroke-width: 2px;
    stroke-linejoin: round;
    stroke-linecap: round;
    transition: stroke-width 0.18s ease;
  }

  .history-line.highlighted {
    stroke-width: 3px;
  }

  .interaction .history-hover-marker {
    fill: currentColor;
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
