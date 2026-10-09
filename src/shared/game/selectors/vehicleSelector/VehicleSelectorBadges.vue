<template>
  <BadgesLinePopover :tagToText="t => getTankName(t, true)" v-model="vehicles"
    :close-on-outside-window="closeOnOutsideWindow" :width="350" scroll-mode="child"
    :placement="['bottom-start', 'top-start', 'bottom-float', 'top-float']">
    <VehiclePopup :tank-list="selectableVehicles" v-model="vehicles" />
  </BadgesLinePopover>
</template>

<script setup lang="ts">
import { getTankName } from '@/shared/i18n/i18n'
import BadgesLinePopover from '../components/badges/BadgesLinePopover.vue'
import VehiclePopup from './VehiclePopup.vue'
import { selectableVehicles } from '@/shared/game/vehicles/catalog'
import { CloseOnOutsideWindow } from '@/shared/uiKit/popover/utils'

defineProps<{
  closeOnOutsideWindow?: CloseOnOutsideWindow
}>()

const vehicles = defineModel<Set<string>>({ default: () => new Set() })

</script>
