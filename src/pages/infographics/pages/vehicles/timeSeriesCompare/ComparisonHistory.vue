<template></template>

<script setup lang="ts">
import { watch } from 'vue'
import { queryComputed, type Status } from '@/db'
import type { VehicleFilters } from '../filters/types'
import type { VehicleSelection } from '../shared/vehicleGrouping'
import type { VehicleHistoryPeriod } from '../shared/types'
import type { HistoryStep } from '../timeSeries/historyStep'
import { vehicleHistoryQuery } from '../shared/vehicleStatisticsQuery'

const props = defineProps<{
  selection: VehicleSelection
  filters: VehicleFilters
  beforeDay: string
  step: HistoryStep
  retry: number
}>()

const emit = defineEmits<{ update: [state: { status: Status, data: VehicleHistoryPeriod[] }] }>()

const history = queryComputed<VehicleHistoryPeriod>(() =>
  `${vehicleHistoryQuery(props.filters, props.selection, props.beforeDay, props.step)}\n-- retry ${props.retry}`,
  { settings: { use_query_cache: 1, query_cache_ttl: 24 * 60 * 60 } })

watch(history, state => emit('update', state), { immediate: true })
</script>
