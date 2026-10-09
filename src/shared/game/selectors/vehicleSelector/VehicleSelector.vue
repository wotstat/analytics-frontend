<template>
  <PanelPopover v-model="displayPopup" :target="targetElement" :width="350" scroll-mode="child"
    :placement="['bottom-start', 'top-start', 'bottom-float', 'top-float']">
    <VehiclePopup :tank-list="selectableVehicles" v-model="vehicles" />
  </PanelPopover>
</template>

<script setup lang="ts">

import VehiclePopup from './VehiclePopup.vue'
import { selectableVehicles } from '@/shared/game/vehicles/catalog'
import PanelPopover from '@/shared/ui/popover/PanelPopover.vue'

defineProps<{
  targetElement: HTMLElement | null,
  singleSelect: boolean
}>()

const vehicles = defineModel<Set<string>>({ required: true })
const displayPopup = defineModel<boolean>('displayPopup', { required: true })

</script>
