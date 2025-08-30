<template>
  <PopoverAutoClose :target="targetElement" v-model="displayPopup" :placement="['bottom-start', 'bottom-float']"
    :viewport-offset="{ top: headerHeight + additionalHeaderHeight, bottom: 10, left: 10, right: 10 }" :arrow-size="0">
    <VehiclePopup :tank-list="tankList.data" v-model="vehicles" />
  </PopoverAutoClose>
</template>

<script setup lang="ts">

import { CACHE_SETTINGS, queryAsync } from '@/db'
import { selectTagVehiclesLocalization } from '@/utils/i18n'
import VehiclePopup from './VehiclePopup.vue'
import { headerHeight, useAdditionalHeaderHeight } from '@/composition/useAdditionalHeaderHeight'
import { Nation } from '@/utils/wot'
import PopoverAutoClose from '@/components/uiKit/popover/PopoverAutoClose.vue'


defineProps<{
  targetElement: HTMLElement | null,
  singleSelect: boolean
}>()

const vehicles = defineModel<Set<string>>({ required: true })
const displayPopup = defineModel<boolean>('displayPopup', { required: true })
const { additionalHeaderHeight } = useAdditionalHeaderHeight(true)


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