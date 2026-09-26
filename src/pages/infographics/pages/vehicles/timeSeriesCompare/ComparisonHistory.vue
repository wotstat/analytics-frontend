<template></template>

<script setup lang="ts">
import { watch } from 'vue'
import { error, loading, query, success, type Status } from '@/db'
import type { VehicleFilters } from '../filters/types'
import type { VehicleSelection } from '../shared/vehicleGrouping'
import type { VehicleHistoryPeriod } from '../shared/types'
import type { HistoryStep } from '../timeSeries/historyStep'
import { vehicleHistoryQuery } from '../shared/vehicleStatisticsQuery'
import type { ComparisonHistoryQueue } from './comparisonHistoryQueue'

const props = defineProps<{
  selection: VehicleSelection
  filters: VehicleFilters
  beforeDay: string
  step: HistoryStep
  retry: number
  queue: ComparisonHistoryQueue
}>()

const emit = defineEmits<{ update: [state: { status: Status, data: VehicleHistoryPeriod[] }] }>()

watch(() =>
  `${vehicleHistoryQuery(props.filters, props.selection, props.beforeDay, props.step)}\n-- retry ${props.retry}`,
  async (sql, _, onCleanup) => {
    const controller = new AbortController()
    const { signal } = controller
    onCleanup(() => controller.abort())
    emit('update', { status: loading, data: [] })

    try {
      const { data } = await props.queue.run(() => query<VehicleHistoryPeriod>(sql, {
        settings: { use_query_cache: 1, query_cache_ttl: 24 * 60 * 60 },
        abortSignal: signal,
      }), signal)
      if (!signal.aborted) emit('update', { status: success, data })
    } catch (reason) {
      if (signal.aborted) return
      console.error(reason)
      emit('update', {
        status: { status: error, reason: reason instanceof Error ? reason.message : String(reason) },
        data: [],
      })
    }
  }, { immediate: true })
</script>
