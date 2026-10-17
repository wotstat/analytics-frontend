<template>
  <span v-if="vehicle.tankTag !== null || (vehicle.tankType === null && vehicle.tankLevel === null)">
    {{ vehicleName(vehicle) }}
  </span>
  <span v-else>
    <MetaVehicleType v-if="vehicle.tankType !== null" :type="vehicle.tankType" />
    <template v-if="vehicle.tankLevel !== null">
      <template v-if="vehicle.tankType !== null"> · </template><span class="mt-font">{{
        romanNumberProcessor(vehicle.tankLevel) }}</span><template v-if="vehicle.tankType === null"> уровень</template>
    </template>
  </span>
</template>

<script setup lang="ts">
import '@/styles/mtfont.scss'
import { romanNumberProcessor } from '@/shared/utils/processors/processors'
import type { VehicleStatistics } from '../../shared/types'
import { vehicleName } from '../../shared/vehicleName'
import MetaVehicleType from './MetaVehicleType.vue'

defineProps<{ vehicle: Pick<VehicleStatistics, 'tankTag' | 'tankLevel' | 'tankType'> }>()
</script>
