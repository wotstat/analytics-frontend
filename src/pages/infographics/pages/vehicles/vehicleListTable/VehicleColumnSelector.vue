<template>
  <button ref="trigger" class="column-trigger" @click="open = !open">
    Столбцы · {{ selected.length }}/{{ maxSlots }}
  </button>

  <PopoverAutoClose v-model="open" :target="trigger" :placement="['bottom-end', 'bottom-float']"
    :viewport-offset="popoverViewportOffset" :arrow-size="0">
    <VehicleSlotOptions title="Выбор столбцов" :selected :max-slots="maxSlots" @select="toggle" />
  </PopoverAutoClose>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import VehicleSlotOptions from '../VehicleSlotOptions.vue'
import PopoverAutoClose from '@/shared/uiKit/popover/PopoverAutoClose.vue'
import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import { orderSlots, type Slot } from './helpers'

const props = defineProps<{ maxSlots: number }>()
const selected = defineModel<Slot[]>({ required: true })

const open = ref(false)
const trigger = useTemplateRef<HTMLButtonElement>('trigger')

function toggle(slot: Slot) {
  if (selected.value.includes(slot)) {
    if (selected.value.length > 1) selected.value = selected.value.filter(item => item !== slot)
    return
  }

  if (selected.value.length < props.maxSlots) selected.value = orderSlots([...selected.value, slot])
}
</script>

<style scoped lang="scss">
.column-trigger {
  flex: none;
  height: 30px;
  margin-left: auto;
  padding: 0 12px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  font-size: 14px;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}
</style>
