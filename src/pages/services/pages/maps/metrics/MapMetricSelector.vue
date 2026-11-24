<template>
  <MetricSelectorButton
    ref="trigger"
    v-bind="$attrs"
    :icon="mapMetrics[slot.metric].icon"
    :label="label"
    :open
    :tooltip="delta ? mapMetricLabel(slot, true) : undefined"
    @click="open = !open">
    <template #label-suffix>
      <DeltaIcon v-if="delta" class="delta-icon" width="12" height="12" />
    </template>
  </MetricSelectorButton>

  <MapMetricOptions
    v-model:open="open"
    v-model:delta-metrics="deltaMetrics"
    :target="trigger?.element ?? null"
    :placement="['bottom-start', 'bottom-float', 'top-start', 'right-float']"
    title="Выбор метрики"
    :selected="[slot]"
    @select="selectMetric" />
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { usePopoverCloseDelay } from '@/shared/uiKit/popover/usePopoverCloseDelay'
import MetricSelectorButton from '../../shared/columnSelector/MetricSelectorButton.vue'
import DeltaIcon from './delta.svg'
import MapMetricOptions from './MapMetricOptions.vue'
import { mapMetricLabel, mapMetrics, type MapMetric, type MapMetricSlot } from './catalog/mapMetrics'

defineOptions({ inheritAttrs: false })

const slot = defineModel<MapMetricSlot>({ required: true })
const deltaMetrics = defineModel<MapMetric[]>('deltaMetrics', { required: true })
const delta = computed(() => deltaMetrics.value.includes(slot.value.metric))
const label = computed(() => mapMetricLabel(slot.value))
const open = ref(false)
const { closeAfterSelection } = usePopoverCloseDelay(open)
const trigger = useTemplateRef('trigger')

function selectMetric(value: MapMetricSlot) {
  slot.value = value
  closeAfterSelection()
}
</script>

<style scoped lang="scss">
.delta-icon {
  flex: none;
  margin-right: 5px;
}
</style>
