<template>
  <VehicleCompareMetaLayout :format="context.format" :region="filterPresentation.region" :heading="metricLabel"
    :subtitle="filterPresentation.mode" :details="filterPresentation.labels.join(' · ')" :sources="rivals"
    :state-message :has-values :background>
    <template v-if="$slots.background" #background><slot name="background" /></template>
    <MetaHistoryChart :series="sources" :slot :until="now" />
  </VehicleCompareMetaLayout>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import type { RenderContext } from '@/meta/utils'
import type { VehicleHistoryPeriod } from '../../shared/types'
import { availableSlots } from '../../vehicleMetricSelector/vehicleMetrics/vehicleMetrics'
import { formatMetaSlotValue } from '../utils/format'
import VehicleCompareMetaLayout from './VehicleCompareMetaLayout.vue'
import MetaHistoryChart from './chart/MetaHistoryChart.vue'
import { readVehiclesMetaParams } from '../utils/params'
import { useCompareMeta } from '../utils/useCompareMeta'
import { comparisonFilterLabels } from '../utils/labels'

const props = defineProps<{ context: RenderContext, background?: Component }>()
const params = readVehiclesMetaParams(new URL(props.context.url))
const { slot } = params.settings
const now = Date.now()
const beforeDay = new Date(now).toISOString().slice(0, 10)
const { series: sources, state } = useCompareMeta(params.sources, slot, beforeDay, { thresholds: params.table })

const metricLabel = availableSlots[slot].label
const filterPresentation = computed(() => {
  const filters = sources.value.map(source => source.filters)
  return comparisonFilterLabels(filters.length ? filters : [params.filters])
})

const lastRow = (history: VehicleHistoryPeriod[]) => history.findLast(row => Number.isFinite(row[slot]))
const rivals = computed(() => sources.value.map((source, index) => ({
  ...source,
  tankTag: source.selection.tankTag,
  region: source.filters.regions[0] ?? 'RU',
  value: formatMetaSlotValue(slot, lastRow(source.history)?.[slot]),
  details: [filterPresentation.value.sources[index], ...source.selectionDetails].filter(Boolean).join(' · '),
})))
const hasValues = computed(() => sources.value.some(source => lastRow(source.history)))

const stateMessage = computed(() => {
  if (state.value === 'error') return 'Не удалось загрузить сравнение'
  if (state.value === 'loading') return 'Загружаем дневную историю…'
  if (params.invalidComparison) return 'Некорректная ссылка сравнения'
  if (!sources.value.length) return 'Нет включённых источников сравнения'
})
</script>
