<template>
  <MapMetricOptions
    v-model:delta-metrics="deltaMetrics"
    :selected
    :max-slots
    @select="toggle"
    @remove-metric="removeMetric"
    @clear="clear"
    @reset="reset" />
</template>

<script setup lang="ts">
import MapMetricOptions from '../../metrics/MapMetricOptions.vue'
import type { MapMetric, MapMetricSlot } from '../../metrics/catalog/mapMetrics'

const props = defineProps<{ maxSlots: number, defaultColumns: readonly MapMetricSlot[] }>()
const selected = defineModel<MapMetricSlot[]>({ required: true })
const deltaMetrics = defineModel<MapMetric[]>('deltaMetrics', { required: true })

function toggle({ metric, aggregation }: MapMetricSlot) {
  const matches = (slot: MapMetricSlot) => slot.metric === metric && slot.aggregation === aggregation
  if (selected.value.some(matches)) {
    selected.value = selected.value.filter(slot => !matches(slot))
    return
  }
  if (selected.value.length < props.maxSlots) selected.value = [...selected.value, { metric, aggregation }]
}

function removeMetric(metric: MapMetric) {
  selected.value = selected.value.filter(slot => slot.metric !== metric)
}

function clear() {
  selected.value = []
  deltaMetrics.value = []
}

function reset() {
  selected.value = [...props.defaultColumns]
  deltaMetrics.value = []
}
</script>
