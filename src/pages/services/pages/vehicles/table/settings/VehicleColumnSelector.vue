<template>
  <VehicleMetricOptions
    v-model:open="open"
    :selected
    :max-slots="maxSlots"
    multiple
    @select="toggle"
    @toggle-tile="toggleTile"
    @clear="selected = []"
    @reset="reset" />
</template>

<script setup lang="ts">
import VehicleMetricOptions from '../../metrics/VehicleMetricOptions.vue'
import { defaultSlots, orderSlots, type Slot } from '../../metrics/catalog/vehicleMetrics.ts'
import { toggleMetricTile, type MetricTile } from '../../metrics/utils/metricSelection'

const props = defineProps<{ maxSlots: number }>()
const selected = defineModel<Slot[]>({ required: true })

const open = defineModel<boolean>('open', { default: false })

function toggle(slot: Slot) {
  if (selected.value.includes(slot)) {
    selected.value = selected.value.filter(item => item !== slot)
    return
  }
  if (selected.value.length < props.maxSlots) selected.value = orderSlots([...selected.value, slot])
}

function toggleTile(tile: MetricTile) {
  selected.value = orderSlots(toggleMetricTile(tile, selected.value, props.maxSlots))
}

function reset() {
  selected.value = [...defaultSlots]
}
</script>
