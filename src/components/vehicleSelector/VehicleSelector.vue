<template>
  <div class="vehicle-selector">
    <slot></slot>
    <PopoverStyled :target="targetElement" :display="displayPopup" @click-outside="onClickOutside"
      @target-outside-window="onTargetOutside" :placement="['bottom-start', 'bottom-float']" :viewport-offset="{
        top: headerHeight + additionalHeaderHeight,
        bottom: 10,
        left: 10,
        right: 10
      }" :arrow-size="0">
      <VehiclePopup :tank-list="tankList.data" v-model="vehicles" />
    </PopoverStyled>
  </div>
</template>

<script setup lang="ts">

import { CACHE_SETTINGS, queryAsync } from '@/db'
import { selectTagVehiclesLocalization } from '@/utils/i18n'
import VehiclePopup from './VehiclePopup.vue'
import PopoverStyled from '../popover/PopoverStyled.vue'
import { headerHeight, useAdditionalHeaderHeight } from '@/composition/useAdditionalHeaderHeight'


defineProps<{
  targetElement: HTMLElement | null,
  singleSelect: boolean
}>()

const vehicles = defineModel<Set<string>>({ required: true })
const displayPopup = defineModel<boolean>('displayPopup', { required: true })
const { additionalHeaderHeight } = useAdditionalHeaderHeight(true)


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

function onClickOutside(event: PointerEvent) {
  displayPopup.value = false
}

function onTargetOutside() {
  displayPopup.value = false
}

</script>

<style scoped lang="scss">
.vehicle-selector {
  display: flex;
  align-items: baseline;
  gap: 0.2em;
}
</style>