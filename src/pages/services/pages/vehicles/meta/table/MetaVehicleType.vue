<template>
  <span class="meta-vehicle-type">
    <VehicleType :type="isVehicleType(type) ? type : 'any'" class="type-icon" />{{ vehicleName({
      tankTag: null,
      tankLevel: null, tankType: type
    }) }}
  </span>
</template>

<script setup lang="ts">
import VehicleType from '@/shared/game/components/vehicles/vehicleType/VehicleType.vue'
import { isVehicleType } from '@/shared/game/components/vehicles/vehicleType/vehicleTypeToImage'
import { vehicleName } from '../../shared/vehicleName'

defineProps<{ type: string }>()
</script>

<style scoped lang="scss">
.meta-vehicle-type {
  white-space: nowrap;

  .type-icon {
    width: 0.85em;
    height: 0.85em;
    margin-right: 0.25em;
    vertical-align: -0.07em;
  }
}
</style>
