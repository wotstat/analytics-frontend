<template>
  <VehicleCompareMetaLayout :format="context.format" :region="regions.join(' / ') || params.region" :heading
    :sources="rivals" :state-message :has-values>
    <template #selection>
      <div class="metrics" :class="[kind, { single: singleMetric }]">
        <span v-for="(slot, index) in metrics" :key="slot">
          <Icon :icon="availableSlots[slot].icon" :viewBox="iconViewBox" />
          <i v-if="!singleMetric" :style="{ background: achievementSeriesColor('#fff', index, metrics.length) }" />
        </span>
      </div>
    </template>
    <template #value-icon>
      <Icon class="value-icon" :class="kind" :icon="availableSlots[primary].icon" :viewBox="iconViewBox" />
    </template>
    <MetaHistoryChart :series="lines" :slot="primary" :until="now"
      :options="{ fromDay, step: params.step, averageWindow: params.averageWindow }" />
  </VehicleCompareMetaLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RenderContext } from '@/meta/utils'
import Icon from '@/shared/game/components/efficiencyIcon/IconRenderer.vue'
import VehicleCompareMetaLayout from '../../vehicles/meta/compare/VehicleCompareMetaLayout.vue'
import MetaHistoryChart from '../../vehicles/meta/compare/chart/MetaHistoryChart.vue'
import { useCompareMeta } from '../../vehicles/meta/utils/useCompareMeta'
import { formatMetaSlotValue } from '../../vehicles/meta/utils/format'
import { hasHistoryValues } from '../../vehicles/timeSeries/historyValues'
import { availableSlots } from '../../vehicles/vehicleMetricSelector/vehicleMetrics/vehicleMetrics'
import { achievementSeriesColor } from '../utils/achievementSeries'
import { achievements, type AchievementKind } from '../utils/achievements'
import { readAchievementMetaParams } from './utils/params'

const props = defineProps<{ context: RenderContext, kind: AchievementKind, heading: string }>()
const params = readAchievementMetaParams(props.kind, new URL(props.context.url))
const { metrics } = params
const primary = metrics[0] ?? achievements[props.kind].defaultSortSlot
const singleMetric = metrics.length === 1
const iconViewBox = props.kind === 'marks' ? '3 8.9 26 14.2' : '5 7 22 18'

const now = Date.now()
const beforeDay = new Date(now).toISOString().slice(0, 10)
const { series, state } = useCompareMeta(metrics.length ? params.compare : [], primary, beforeDay, { step: params.step })
const regions = computed(() => [...new Set(series.value.flatMap(source => source.filters.regions))])

const rivals = computed(() => series.value.map(source => {
  const region = source.filters.regions[0]
  const last = source.history.findLast(row => Number.isFinite(row[primary]))
  return {
    tag: source.tag,
    name: source.name,
    color: source.color,
    tankTag: source.selection.tankTag,
    region,
    value: formatMetaSlotValue(primary, last?.[primary]),
    details: regions.value.length > 1 ? region : '',
  }
}))

const lines = computed(() => series.value.flatMap(source => metrics.map((slot, i) => ({
  slot, history: source.history, color: achievementSeriesColor(source.color, i, metrics.length),
}))))
const hasValues = computed(() => lines.value.some(line => hasHistoryValues(line.history, line.slot)))
const fromDay = computed(() => series.value.reduce((start, source) => {
  const first = source.history[0]?.periodStart
  return first && first < start ? first : start
}, beforeDay))

const stateMessage = computed(() => {
  if (!params.compare.length) return 'Некорректная ссылка сравнения'
  if (!metrics.length) return 'Не выбраны планки для сравнения'
  if (!params.compare.some(source => source.enabled)) return 'Нет включённых танков для сравнения'
  if (state.value === 'error') return 'Не удалось загрузить историю планок'
  if (state.value === 'loading') return 'Загружаем историю планок…'
})
</script>

<style scoped lang="scss">
.metrics {
  display: flex;
  justify-content: flex-end;
  gap: 10px;

  span {
    display: grid;
    justify-items: center;
  }

  svg {
    width: 56px;
    height: 26px;
  }

  i {
    width: 22px;
    height: 3px;
    margin-top: 11px;
    border-radius: 2px;
  }

  &.marks i {
    transform: translateX(-3px);
  }

  &.mastery svg {
    height: 30px;
  }

  &.single svg {
    width: auto;
    font-size: var(--compare-heading-size);
    height: 1cap;
    translate: 0 -0.1em;
  }
}

.value-icon {
  height: 1cap;
  width: auto;
  vertical-align: baseline;

  &.mastery {
    height: 1.3cap;
    vertical-align: -0.15cap;
  }
}
</style>
