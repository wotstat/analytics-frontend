<template>
  <MetricSelectorButton
    ref="trigger"
    v-bind="$attrs"
    :icon="availableSlots[slot].icon"
    :label="availableSlots[slot].label"
    :open
    :aria-expanded="open"
    @click="open = !open" />

  <VehicleMetricOptions
    v-model:open="open"
    :target="trigger?.element ?? null"
    :placement="['bottom-start', 'bottom-float', 'top-start', 'right-float']"
    title="Выбор метрики"
    :selected="[slot]"
    @select="selectMetric" />
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { usePopoverCloseDelay } from '@/shared/uiKit/popover/usePopoverCloseDelay'
import MetricSelectorButton from '../../shared/columnSelector/MetricSelectorButton.vue'
import VehicleMetricOptions from './VehicleMetricOptions.vue'
import { availableSlots, type Slot } from './catalog/vehicleMetrics.ts'

defineOptions({ inheritAttrs: false })

const slot = defineModel<Slot>({ required: true })
const open = ref(false)
const { closeAfterSelection } = usePopoverCloseDelay(open)
const trigger = useTemplateRef('trigger')

function selectMetric(value: Slot) {
  slot.value = value
  closeAfterSelection()
}
</script>
