<template>
  <BadgesLinePopover :tagToText="t => getTankName(t, true)" v-model="vehicles">
    <VehiclePopup :tank-list="tankList.data" v-model="vehicles" />
  </BadgesLinePopover>
</template>


<script setup lang="ts">
import { getTankName, selectTagVehiclesLocalization } from '@/shared/i18n/i18n'
import BadgesLinePopover from '../badges/BadgesLinePopover.vue'
import { CACHE_SETTINGS, queryAsync } from '@/db'
import VehiclePopup from './VehiclePopup.vue'
import { Nation } from '@/shared/game/vehicles/nations/nations'


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

const vehicles = defineModel<Set<string>>({ default: new Set() })

</script>