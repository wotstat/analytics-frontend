<template>
  <button ref="trigger" v-bind="$attrs" class="metric-trigger" type="button" :aria-expanded="open"
    @click="open = !open">
    <Icon :icon="availableSlots[slot].icon" class="metric-icon" />
    <span class="metric-label">{{ availableSlots[slot].label }}</span>
    <DropdownArrow class="metric-arrow" :expanded="open" />
  </button>

  <VehicleSlotOptions v-model:open="open" :target="trigger"
    :placement="['bottom-start', 'bottom-float', 'top-start', 'right-float']" title="Выбор метрики" :selected="[slot]"
    @select="selectMetric" />
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import DropdownArrow from '@/shared/uiKit/dropdown/DropdownArrow.vue'
import VehicleSlotOptions from './VehicleSlotOptions.vue'
import { availableSlots, type Slot } from './vehicleMetrics.ts'

defineOptions({ inheritAttrs: false })

const slot = defineModel<Slot>({ required: true })
const open = ref(false)
const trigger = useTemplateRef<HTMLButtonElement>('trigger')

function selectMetric(value: Slot) {
  slot.value = value
  open.value = false
}
</script>

<style scoped lang="scss">
.metric-trigger {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  height: 30px;
  padding: 0 8px 0 1px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  font-size: 14px;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .metric-icon {
    flex: none;
    width: 30px;
    height: 30px;
  }

  .metric-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .metric-arrow {
    width: 10px;
    height: 10px;
    margin-left: 5px;
    opacity: 0.6;
  }
}
</style>
