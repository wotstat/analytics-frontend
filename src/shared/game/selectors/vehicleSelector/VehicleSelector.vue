<template>
  <PanelPopover v-model="displayPopup" :target="targetElement" :width="350" scroll-mode="child"
    :placement="['bottom-start', 'top-start', 'bottom-float', 'top-float']">
    <VehiclePopup :tank-list="tankList.data" v-model="vehicles" />
  </PanelPopover>
</template>

<script setup lang="ts">

import { CACHE_SETTINGS, queryAsync } from '@/db'
import { selectTagVehiclesLocalization } from '@/shared/i18n/i18n'
import VehiclePopup from './VehiclePopup.vue'
import { Nation } from '@/shared/game/vehicles/nations/nations'
import PanelPopover from '@/shared/ui/popover/PanelPopover.vue'

defineProps<{
  targetElement: HTMLElement | null,
  singleSelect: boolean
}>()

const vehicles = defineModel<Set<string>>({ required: true })
const displayPopup = defineModel<boolean>('displayPopup', { required: true })


const tankList = queryAsync<{
  type: 'MT' | 'LT' | 'HT' | 'AT' | 'SPG',
  tag: string, level: number, short: string, name: string, region: string, nation: Nation
}>(`
with
    tanks as (select tag, type, level, role, nation, region, from LatestBattleVehicleInfo final),
    locals as (${selectTagVehiclesLocalization})
select tag, type, role, level, short, name, region, nation
from tanks
left any join locals using tag;
`, { settings: CACHE_SETTINGS })

</script>
