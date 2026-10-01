<template>
  <button ref="trigger" class="column-trigger" :class="{ 'double-digit-limit': maxSlots >= 10 }" type="button"
    :aria-expanded="open" @click="open = !open">
    Столбцы · {{ selected.length }}/{{ maxSlots }}
  </button>

  <VehicleSlotOptions v-model:open="open" :target="trigger"
    :placement="['bottom-end', 'bottom-float', 'top-end', 'left-float', 'top-end']" title="Выбор столбцов" :selected
    :max-slots="maxSlots" :can-reset="canReset" multiple @select="toggle" @toggle-metric="toggleMetric"
    @reset="reset" />
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import VehicleSlotOptions from '../../vehicleMetricSelector/VehicleSlotOptions.vue'
import { baseSlot, defaultSlot, defaultSlotsForLimit, orderSlots, type BaseSlot, type Slot } from '../../vehicleMetricSelector/vehicleMetrics.ts'

const props = defineProps<{ maxSlots: number }>()
const selected = defineModel<Slot[]>({ required: true })

const open = defineModel<boolean>('open', { default: false })
const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const canReset = computed(() => {
  const defaults = defaultSlotsForLimit(props.maxSlots)
  return selected.value.length !== defaults.length || defaults.some(slot => !selected.value.includes(slot))
})

function toggle(slot: Slot) {
  if (selected.value.includes(slot)) {
    selected.value = selected.value.filter(item => item !== slot)
    return
  }

  if (selected.value.length < props.maxSlots) selected.value = orderSlots([...selected.value, slot])
}

function toggleMetric(slot: BaseSlot) {
  if (selected.value.some(item => baseSlot(item) === slot)) {
    selected.value = selected.value.filter(item => baseSlot(item) !== slot)
  } else toggle(defaultSlot(slot))
}

function reset() {
  selected.value = defaultSlotsForLimit(props.maxSlots)
}

</script>

<style scoped lang="scss">
.column-trigger {
  box-sizing: border-box;
  flex: none;
  width: 120px;
  height: 30px;
  margin-left: auto;
  padding: 0 12px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  &.double-digit-limit {
    width: 136px;
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}
</style>
