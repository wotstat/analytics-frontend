<template>
  <TimeSeriesPanel :chart :legend="lineLegend" :has-values="hasValues" :show-legend="compact"
    :density="compact ? 'compact' : 'standard'" :annotation-labels="annotations.length > 0"
    :format-value="(value, ctx) => formatSlotValue(ctx.hit.datum.slot, value)" marker-style="glow"
    class="achievement-history" :class="{ comparison: !compact }" @series-click="onSeriesClick">
    <template #header>
      <div v-if="compact" class="history-heading">
        <slot name="header-before" />
        <span>{{ sources[0]?.name }}</span>
      </div>
      <h2 v-else>Сравнение <span v-if="sources.length">{{ sources.length }}</span></h2>
    </template>

    <template #toolbar>
      <ToolbarOptions v-if="!compact" v-model="metrics" :options="metricOptions" multiple />
      <HistoryToolbarOptions v-model:step="step" v-model:average-window="averageWindow" />
    </template>

    <template #actions>
      <HistoryAnnotationSettings :settings="annotationOptions" :regions="annotationRegions" :show-outages="false" />
    </template>

    <template v-if="!hasValues" #state>
      <template v-if="!sources.length">
        <b class="empty-heading">Сравните планки танков на одном графике</b>
        <span>Нажмите «+» в таблице. Каждый танк добавится со всеми четырьмя показателями.</span>
      </template>
      <template v-else>
        <Loader v-if="pending" class="loader" />
        <span>{{ emptyMessage }}</span>
      </template>
    </template>

    <template #details>
      <template v-if="!compact && sources.length">
        <div class="group-legend">
          <Legend :legend="groupLegend" toggleable highlightable color-editable removable marker-style="glow"
            @color-change="(source, color) => emit('colorChange', source.tag, color)"
            @remove="source => emit('remove', source.tag)" />
          <ToolbarButton :icon="ResetIcon" class="reset" v-tooltip="'Очистить сравнение'" @click="emit('clear')" />
        </div>
      </template>

      <div v-if="unresolvedSources.length" class="source-error">
        Не удалось восстановить некоторые танки из ссылки. Проверьте загрузку игровых справочников.
      </div>
      <div v-for="source in failedSources" :key="source.tag" class="source-error">
        <span>{{ source.name }}: не удалось загрузить историю.</span>
        <button @click="retry(source.tag)">Повторить</button>
      </div>
      <div v-if="emptySources.length" class="caption">
        Нет данных: {{ emptySources.map(source => source.name).join(', ') }}
      </div>
    </template>

    <template #tooltip="{ ctx }">
      <TimeSeriesTooltip v-if="compact" :ctx :sources="tooltipLines"
        :format-value="value => formatSlotValue(ctx.hit.datum.slot, value)" marker-style="glow">
        <template #header="{ horizontal }">
          <HistoryTooltipHeader :point="ctx.hit.datum" :horizontal :show-metric="false"
            :game-version="versionForPeriod(ctx.hit.datum.periodEnd)" />
        </template>
      </TimeSeriesTooltip>
      <AchievementCompareTooltip v-else :ctx :sources="groupLegend.enabled.value" :metrics="tooltipMetrics"
        :game-version="versionForPeriod(ctx.hit.datum.periodEnd)" />
    </template>
  </TimeSeriesPanel>
</template>

<script setup lang="ts">
import { computed, markRaw, watch } from 'vue'
import { isErrorStatus, loading, success } from '@/db'
import ResetIcon from '@/assets/icons/reset.svg'
import Loader from '@/shared/ui/loaders/loader/Loader.vue'
import ToolbarButton from '@/shared/ui/toolbarButton/ToolbarButton.vue'
import TimeSeriesPanel from '@/shared/ui/chart/timeSeries/panel/TimeSeriesPanel.vue'
import TimeSeriesTooltip from '@/shared/ui/chart/timeSeries/panel/TimeSeriesTooltip.vue'
import ToolbarOptions from '@/shared/ui/chart/timeSeries/toolbar/options/ToolbarOptions.vue'
import Legend from '@/shared/ui/chart/legend/Legend.vue'
import { useLegend } from '@/shared/ui/chart/legend/useLegend'
import type { InteractionTag } from '@/shared/uiKit/chart/universalChart/interaction/core/InteractionSource'
import type { ClickInteractionEvent } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/BaseInteractionController'
import type { VehicleFilters } from '../../vehicles/filters/types'
import type { VehicleSelection } from '../../vehicles/shared/vehicleGrouping'
import type { VehicleHistorySeries } from '../../vehicles/shared/types'
import type { ComparisonSource } from '../../vehicles/timeSeriesCompare/types'
import { differentComparisonFilters } from '../../vehicles/timeSeriesCompare/utils/comparisonFilters'
import { comparisonName } from '../../vehicles/timeSeriesCompare/utils/comparisonName'
import type { Slot } from '../../vehicles/vehicleMetricSelector/vehicleMetrics/vehicleMetrics'
import { formatSlotValue } from '../../vehicles/vehicleMetricSelector/utils/formatMetricValue'
import { VehicleHistoryChart } from '../../vehicles/timeSeries/VehicleHistoryChart'
import { useVehicleHistories } from '../../vehicles/timeSeries/useVehicleHistories'
import type { HistoryStep, HistoryAverageWindow } from '../../vehicles/timeSeries/period/historyStep'
import HistoryToolbarOptions from '../../vehicles/timeSeries/period/HistoryToolbarOptions.vue'
import HistoryTooltipHeader from '../../vehicles/timeSeries/tooltip/HistoryTooltipHeader.vue'
import HistoryAnnotationSettings from '../../vehicles/timeSeries/annotations/settings/HistoryAnnotationSettings.vue'
import { createHistoryAnnotationState, useHistoryAnnotationSettings, type HistoryAnnotationState } from '../../vehicles/timeSeries/annotations/settings/useHistoryAnnotationSettings'
import { useGameVersionAnnotations } from '../../vehicles/timeSeries/annotations/gameVersionAnnotations'
import { useHistoryEventAnnotations } from '../../vehicles/timeSeries/annotations/events/useHistoryEventAnnotations'
import { useHistoryEventStyles } from '../../vehicles/timeSeries/annotations/events/useHistoryEventStyles'
import { hasHistoryValues } from '../../vehicles/timeSeries/historyValues'
import AchievementCompareTooltip from './AchievementCompareTooltip.vue'
import { achievements, type AchievementKind } from '../utils/achievements'
import { achievementHistoryColors, achievementLabel, achievementSeriesColor, achievementSeriesTag } from './achievementSeries'

useHistoryEventStyles()

const props = defineProps<{
  kind: AchievementKind
  sources: readonly ComparisonSource[]
  filters: VehicleFilters
  beforeDay: string
  compact?: boolean
}>()
const emit = defineEmits<{
  remove: [tag: string]
  colorChange: [tag: string, color: string]
  clear: []
  visibilityChange: [disabledTags: string[]]
}>()
const metrics = defineModel<Slot[]>('metrics', { default: () => [] })
const step = defineModel<HistoryStep>('step', { required: true })
const averageWindow = defineModel<HistoryAverageWindow>('averageWindow', { required: true })
const annotationSettings = defineModel<HistoryAnnotationState>('annotations', { default: createHistoryAnnotationState })
const definition = computed(() => achievements[props.kind])
const metricOptions = computed(() => {
  const slots = [...definition.value.slots].reverse()
  return slots.map(slot => ({ value: slot, label: achievementLabel(slot) }))
})
const tooltipMetrics = computed(() => metricOptions.value.map(option => option.value).filter(slot => metrics.value.includes(slot)))

const readySources = computed(() => props.sources.filter((source): source is ComparisonSource & { selection: VehicleSelection } =>
  source.selection !== null))
const { states, retry } = useVehicleHistories(readySources, {
  beforeDay: props.beforeDay, step, slot: () => definition.value.slots[0],
})
const annotationOptions = useHistoryAnnotationSettings(annotationSettings)
const annotationRegions = computed(() => {
  if (!props.sources.length) return props.filters.regions
  return [...new Set(props.sources.flatMap(source => source.filters.regions))]
})
const { annotations: versionAnnotations, versionForPeriod } = useGameVersionAnnotations(
  annotationOptions.versions, annotationRegions, { includeTooltipVersion: true })
const eventAnnotations = useHistoryEventAnnotations(annotationOptions.enabledEvents, annotationRegions)
const annotations = computed(() => [...versionAnnotations.value, ...eventAnnotations.value])

const differentFilters = computed(() => differentComparisonFilters(props.filters, props.sources.map(source => source.filters)))
const groupItems = computed(() => props.sources.map(source => ({
  tag: source.tag,
  name: comparisonName(source, differentFilters.value),
  color: source.color,
  loading: source.resolution === 'loading' || (!source.resolution && (states.get(source.tag)?.status ?? loading) === loading),
})))
const disabledGroups = computed<ReadonlySet<InteractionTag>>({
  get: () => new Set(props.sources.filter(source => !source.enabled).map(source => source.tag)),
  set: tags => emit('visibilityChange', [...tags].filter((tag): tag is string => typeof tag === 'string')),
})
const groupLegend = useLegend(groupItems, {
  disabledTags: disabledGroups,
  tagsForItem: source => metrics.value.map(slot => achievementSeriesTag(source.tag, slot)),
})
const lineItems = computed(() => {
  const enabledSlots = definition.value.slots.filter(slot => metrics.value.includes(slot))

  return groupItems.value.flatMap(source => definition.value.slots.map((slot, index) => {
    let name = achievementLabel(slot)
    let color = achievementHistoryColors[index]

    if (!props.compact) {
      const colorSlots = enabledSlots.includes(slot) ? enabledSlots : definition.value.slots
      name = `${source.name} · ${name}`
      color = achievementSeriesColor(source.color, colorSlots.indexOf(slot), colorSlots.length)
    }

    return { tag: achievementSeriesTag(source.tag, slot), sourceTag: source.tag, slot, name, color, loading: source.loading }
  }))
})
const disabledLines = computed<ReadonlySet<InteractionTag>>(() => new Set(lineItems.value
  .filter(line => !groupLegend.isEnabled({ tag: line.sourceTag }) || !metrics.value.includes(line.slot))
  .map(line => line.tag)))
const lineLegend = useLegend(() => [...lineItems.value].reverse(), {
  highlightSync: groupLegend.highlightSync,
  ...(props.compact ? {} : { disabledTags: disabledLines }),
})
const tooltipLines = computed(() => lineItems.value.filter(line => lineLegend.isEnabled(line)))
const chart = markRaw(new VehicleHistoryChart(lineLegend.highlightSync))
const series = computed<VehicleHistorySeries[]>(() => lineItems.value.map(line => ({
  tag: line.tag,
  slot: line.slot,
  history: states.get(line.sourceTag)?.data ?? [],
  enabled: lineLegend.isEnabled(line),
})))
const hasValues = computed(() => series.value.some(line => line.enabled && hasHistoryValues(line.history, line.slot!)))
const pending = computed(() => groupItems.value.some(source => source.loading))
const unresolvedSources = computed(() => props.sources.filter(source => source.resolution === 'error' || source.resolution === 'missing'))
const failedSources = computed(() => groupItems.value.filter(source => {
  const state = states.get(source.tag)
  return state && isErrorStatus(state.status)
}))
const emptySources = computed(() => groupItems.value.filter(source => {
  const state = states.get(source.tag)
  return state?.status === success && !definition.value.slots.some(slot => hasHistoryValues(state.data, slot))
}))
const emptyMessage = computed(() => {
  if (!props.compact && !metrics.value.length) return 'Выберите показатели для сравнения'
  if (pending.value) return 'Загрузка истории…'
  if (!lineLegend.enabled.value.length) return props.compact ? 'Включите показатели в легенде' : 'Включите танки в легенде'
  return 'Нет данных для отображения'
})

function onSeriesClick({ tag, event }: { tag: string, event: ClickInteractionEvent }) {
  if (event.isTouch) return
  event.preventPanInertion()

  if (props.compact) {
    const line = lineItems.value.find(line => line.tag === tag)
    if (!line) return
    const targets = event.altKey ? lineItems.value.filter(item => item.tag !== tag) : [line]
    lineLegend.setEnabled(targets, false)
    return
  }

  const sourceTag = lineItems.value.find(line => line.tag === tag)?.sourceTag
  const source = groupItems.value.find(source => source.tag === sourceTag)
  if (!source) return
  const targets = event.altKey ? groupItems.value.filter(item => item.tag !== source.tag) : [source]
  groupLegend.setEnabled(targets, false)
}

watch([series, definition, step, averageWindow], () => {
  chart.setHistories(series.value, definition.value.slots[0], props.beforeDay, step.value, averageWindow.value)
}, { immediate: true })
watch(annotations, value => chart.setHistoryAnnotations(value), { immediate: true })
</script>

<style scoped lang="scss">
@use '../../vehicles/timeSeries/annotations/historyAnnotationStyles.scss' as *;

.achievement-history {
  min-width: 0;
  margin-top: 12px;

  &.comparison {
    margin: 0 0 28px;
    padding: 18px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.025);

    @media (max-width: 600px) {
      padding: 12px;
    }
  }

  h2 {
    margin: 0 10px 0 0;
    font-size: 18px;
    color: white;

    span {
      margin-left: 5px;
      color: rgba(255, 255, 255, 0.4);
      font-size: 14px;
      font-variant-numeric: tabular-nums;
    }
  }

  .history-heading,
  .group-legend {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .group-legend .legend {
    flex: 1;
    min-width: 0;
  }

  .reset {
    --toolbar-button-height: var(--time-series-legend-height);
  }

  .empty-heading {
    color: rgba(255, 255, 255, 0.8);
    font-size: 18px;
  }

  :deep(.chart-state)>span {
    max-width: 520px;
    line-height: 1.5;
  }

  .loader {
    font-size: 3px;
    margin-bottom: 16px;
  }

  .caption,
  .source-error {
    margin-top: 12px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
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
