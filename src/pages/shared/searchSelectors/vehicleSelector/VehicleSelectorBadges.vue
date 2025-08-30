<template>
  <BadgesLinePopover :tagToText="t => getTankName(t, true)" v-model="vehicles">
    <VehiclePopup :tank-list="tankList.data" v-model="vehicles" />
  </BadgesLinePopover>
</template>


<script setup lang="ts">
import { getTankName, selectTagVehiclesLocalization } from '@/utils/i18n'
import BadgesLinePopover from '@/components/badges/BadgesLinePopover.vue'
import { CACHE_SETTINGS, queryAsync } from '@/db'
import { Nation } from '@/utils/wot'
import VehiclePopup from './VehiclePopup.vue'


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