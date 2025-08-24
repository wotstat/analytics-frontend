<template>
  <div class="vehicle-selector">
    <PopupModal v-model="displayPopup" :target="targetElement" no-padding>
      <slot></slot>
      <template #popup>
        <VehiclePopup :tank-list="tankList.data" v-model="vehicles" />
      </template>
    </PopupModal>
  </div>
</template>

<script setup lang="ts">

import PopupModal from '../PopupModal.vue'
import { CACHE_SETTINGS, queryAsync } from '@/db'
import { selectTagVehiclesLocalization } from '@/utils/i18n'
import VehiclePopup from './VehiclePopup.vue'

defineProps<{
  targetElement?: HTMLElement | null,
}>()

const vehicles = defineModel<Set<string>>({ required: true })
const displayPopup = defineModel<boolean>('displayPopup')


const tankList = queryAsync<{
  type: 'MT' | 'LT' | 'HT' | 'AT' | 'SPG',
  tag: string, level: number, short: string, name: string, region: string
}>(`
with
    tanks as (select tag, type, level, role, region, from LatestBattleVehicleInfo final),
    locals as (${selectTagVehiclesLocalization})
select tag, type, role, level, short, name, region
from tanks
left any join locals using tag;
`, { settings: CACHE_SETTINGS })

</script>

<style scoped lang="scss">
.vehicle-selector {
  display: flex;
  align-items: baseline;
  gap: 0.2em;
}
</style>