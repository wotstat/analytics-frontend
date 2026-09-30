<template>
  <span class="vehicle-cell">
    <VehicleImage :tag="vehicle.tankTag!" :game="regionToGame(vehicle.region)" size="preview" loading="lazy"
      class="vehicle-image" />
    <span class="vehicle-info">
      <span class="vehicle-name" :title="vehicleName(vehicle, false)">{{ name }}</span>
      <span v-if="vehicle.day !== latestDay" class="postfix">{{ formatStatisticsDay(vehicle.day) }}</span>
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VehicleImage from '@/shared/game/vehicles/vehicle/VehicleImage.vue'
import { regionToGame } from '@/shared/game/wot'
import type { VehicleStatistics } from '../shared/types'
import { formatStatisticsDay } from '../shared/formatStatisticsDay'
import { vehicleName } from '../shared/vehicleName'

const props = defineProps<{ vehicle: VehicleStatistics, latestDay: string }>()
const name = computed(() => vehicleName(props.vehicle))
</script>

<style scoped lang="scss">
.vehicle-cell {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 1px 10px 1px 0;

  @media (max-width: 700px) {
    gap: 6px;
    padding: 4px 6px;
  }

  .vehicle-image {
    height: 50px;
    width: 80px;
    object-fit: contain;
    flex-shrink: 0;
    pointer-events: none;

    @media (max-width: 700px) {
      display: none;
    }
  }

  .vehicle-info {
    display: flex;
    align-items: baseline;
    gap: 3px;
    min-width: 0;
    width: 100%;

    .postfix {
      color: rgba(255, 255, 255, 0.4);
      font-size: 12px;
      font-weight: normal;
      margin-left: auto;
    }

    .vehicle-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 14px;
    }
  }
}
</style>
