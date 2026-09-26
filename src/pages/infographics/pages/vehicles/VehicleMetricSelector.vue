<template>
  <button ref="trigger" v-bind="$attrs" class="metric-trigger" type="button" :aria-expanded="open"
    @click="open = !open">
    <Icon :icon="availableSlots[slot].icon" class="metric-icon" />
    <span class="metric-label">{{ availableSlots[slot].label }}</span>
    <ArrowDown class="metric-arrow" />
  </button>

  <PopoverAutoClose v-model="open" :target="trigger"
    :placement="['bottom-start', 'bottom-float', 'top-start', 'right-float']" :viewport-offset="popoverViewportOffset"
    :arrow-size="0">
    <VehicleSlotOptions title="Выбор метрики" :selected="[slot]" @select="selectMetric" />
  </PopoverAutoClose>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import ArrowDown from '@/assets/icons/arrow-down.svg'
import PopoverAutoClose from '@/shared/uiKit/popover/PopoverAutoClose.vue'
import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import VehicleSlotOptions from './VehicleSlotOptions.vue'
import { availableSlots, type Slot } from './shared/vehicleMetrics'

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
    flex: none;
    width: 10px;
    height: 10px;
    margin-left: 5px;
    fill: currentColor;
    opacity: 0.6;
  }
}
</style>
