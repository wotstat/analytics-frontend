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

      <HistoryControls v-model:step="step" v-model:average-window="averageWindow" class="steps">
        <HistoryAnnotationSettings :settings="annotationOptions" />
      </HistoryControls>
    </div>

    <div class="comparison-content">
      <div class="chart-body">
        <UniversalChartComponent v-show="hasValues" :chart />
        <div v-if="!sources.length" class="chart-state">
          <b>Сравните танки на одном графике</b>
          <span>Нажмите «+» в таблице ниже. Чтобы добавить среднее по уровню или классу, выберите нужный режим
            таблицы.</span>
        </div>
        <div v-else-if="!hasValues" class="chart-state">
          {{ emptyMessage }}
        </div>
      </div>

      <div class="comparison-details">
        <div v-if="sources.length" class="legend-row">
          <Legend :legend toggleable highlightable color-editable removable
            @color-change="(source, color) => emit('colorChange', source.tag, color)"
            @remove="source => emit('remove', source.tag)" class="legend" />
          <button class="reset" title="Сбросить сравнение"
            @click="emit('clear')">
            <ResetIcon />
          </button>
        </div>

        <div v-for="source in failedSources" :key="source.tag" class="source-error">
          <span>{{ source.name }}: не удалось загрузить историю.</span>
          <button @click="retries[source.tag] = (retries[source.tag] ?? 0) + 1">Повторить</button>
        </div>
        <div v-if="emptySources.length" class="caption">
          Нет данных: {{ emptySources.map(source => source.name).join(', ') }}
        </div>
      </div>
    </div>

    <FloatingTooltip :ctx="chart.tooltipCtx.value" anchor="pivot-x" :placement="['top-float', 'bottom-float']"
      :offset="{ top: 28, bottom: versionAnnotations.length ? 40 : 12 }">
      <template #default="{ ctx }">
        <ComparisonTooltip :ctx :sources="legend.enabled.value" :game-version="versionForPeriod(ctx.hit.datum.periodEnd)" />
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
import { useLegend } from '@/shared/ui/chart/useLegend'
import FloatingTooltip from '@/shared/ui/chart/FloatingTooltip.vue'
import UniversalChartComponent from '@/shared/uiKit/chart/universalChart/UniversalChart.vue'
import PopoverAutoClose from '@/shared/uiKit/popover/PopoverAutoClose.vue'
import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import VehicleSlotOptions from '../VehicleSlotOptions.vue'
import type { VehicleFilters } from '../filters/types'
import { availableSlots, type Slot } from '../shared/vehicleMetrics'
import { VehicleHistoryChart } from '../timeSeries/VehicleHistoryChart'
import type { VehicleHistoryPeriod, VehicleThresholds } from '../shared/types'
import type { HistoryAverageWindow, HistoryStep } from '../timeSeries/historyStep'
import HistoryControls from '../timeSeries/HistoryControls.vue'
import HistoryAnnotationSettings from '../timeSeries/HistoryAnnotationSettings.vue'
import { useHistoryAnnotationSettings } from '../timeSeries/useHistoryAnnotationSettings'
import { useGameVersionAnnotations } from '../timeSeries/gameVersionAnnotations'
import { applyHistoryThresholds, hasHistoryValues } from '../timeSeries/historyValues'
import { snapshotComparisonFilters, type ComparisonSource } from './types'
import { comparisonName } from './comparisonName'
import ComparisonHistory from './ComparisonHistory.vue'
import ComparisonTooltip from './ComparisonTooltip.vue'

const props = defineProps<{
  filters: VehicleFilters
  sources: readonly ComparisonSource[]
} & VehicleThresholds>()

const emit = defineEmits<{
  remove: [tag: string]
  colorChange: [tag: string, color: string]
  clear: []
}>()

const slot = ref<Slot>('damage')
const metricSelectorOpen = ref(false)
const metricTrigger = useTemplateRef<HTMLButtonElement>('metricTrigger')

const step = ref<HistoryStep>('day')
const averageWindow = ref<HistoryAverageWindow>(null)
const annotationOptions = useHistoryAnnotationSettings()
const { annotations: versionAnnotations, versionForPeriod } = useGameVersionAnnotations(
  annotationOptions.versions, computed(() => props.filters.regions), { includeTooltipVersion: true })

const now = useNow({ interval: 60_000 })
const beforeDay = computed(() => now.value.toISOString().slice(0, 10))

const states = reactive(new Map<string, { status: Status, data: VehicleHistoryPeriod[] }>())
const retries = reactive<Record<string, number>>({})

const currentFilters = computed(() => snapshotComparisonFilters(props.filters))
const legendItems = computed(() => props.sources.map(source => ({
  ...source,
  name: comparisonName(source, currentFilters.value),
  loading: !states.has(source.tag) || states.get(source.tag)?.status === loading,
})))

const legend = useLegend(legendItems)
const chart = markRaw(new VehicleHistoryChart(legend.highlightSync))

const series = computed(() => legendItems.value.map(source => ({
  ...source,
  enabled: legend.isEnabled(source),
  history: applyHistoryThresholds(states.get(source.tag)?.data ?? [], slot.value, props),
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

const emptySources = computed(() => series.value.filter(source => states.get(source.tag)?.status === success &&
  !hasHistoryValues(source.history, slot.value)))

watch([series, slot, beforeDay, step, averageWindow], () => {
  chart.setHistories(series.value, slot.value, beforeDay.value, step.value, averageWindow.value)
}, { immediate: true })

watch(versionAnnotations, annotations => chart.setAnnotations(annotations), { immediate: true })

watch(() => props.sources.map(source => source.tag), tags => {
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
}

</script>

<style scoped lang="scss">
@use '../timeSeries/historyChart.scss' as *;

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

  .toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;

    h2 {
      margin: 0;
      font-size: 18px;
      color: white;

      span {
        display: inline-block;
        font-variant-numeric: tabular-nums;
        margin-left: 5px;
        color: rgba(255, 255, 255, 0.4);
        font-size: 14px;
      }
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
    }

    .steps {
      margin-left: auto;

      @media (max-width: 600px) {
        margin-left: 0;
      }
    }
  }

  .comparison-content {
    --legend-row-height: 21px;
    --legend-gap: 12px;
    display: flex;
    flex-direction: column;
    gap: var(--legend-gap);
    margin-top: 12px;

    .chart-body {
      position: relative;
      flex-shrink: 0;
      height: calc(clamp(260px, 30vw, 400px) - var(--legend-row-height) - var(--legend-gap));

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
    }

    .comparison-details {
      min-height: var(--legend-row-height);
      overflow-wrap: anywhere;

      .legend-row {
        display: flex;
        align-items: flex-end;
        gap: 10px;

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
          height: var(--legend-row-height);
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
    }
  }

  :deep(.universal-chart-root) {
    @include history-chart;
  }
}
</style>
