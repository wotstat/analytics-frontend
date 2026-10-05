<template>
  <span class="vehicle-cell" :class="{ compact: !showImage }">
    <span v-if="showImage" class="vehicle-image-frame">
      <VehicleImage :tag="vehicle.tankTag!" :game="regionToGame(vehicle.region)" size="preview" loading="lazy"
        class="vehicle-image" />
    </span>
    <span class="vehicle-info">
      <span class="vehicle-name" :title="vehicleName(vehicle, false)">
        <span v-for="(part, index) in nameParts" :key="index" :class="{ highlight: part.highlight }">{{ part.text }}</span>
      </span>
      <span v-if="!vehicle.isActual" class="postfix">{{ formatStatisticsDay(vehicle.day) }}</span>
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VehicleImage from '@/shared/game/vehicles/vehicle/VehicleImage.vue'
import { regionToGame } from '@/shared/game/wot'
import { getHighlightedTextParts, highlight } from '@/shared/uiKit/highlightString/highlightUtils'
import type { VehicleStatistics } from '../shared/types'
import { formatStatisticsDay } from '../shared/formatStatisticsDay'
import { vehicleName } from '../shared/vehicleName'

const props = defineProps<{ vehicle: VehicleStatistics, search: string, showImage: boolean }>()
const nameParts = computed(() => getHighlightedTextParts(highlight(vehicleName(props.vehicle), props.search)))
</script>

<style scoped lang="scss">
.vehicle-cell {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 1px 10px 1px 0;

  &.compact {
    gap: 6px;
    padding: 4px 6px;
  }

  .vehicle-image-frame {
    height: 50px;
    width: 80px;
    flex-shrink: 0;
    overflow: hidden;

    .vehicle-image {
      display: block;
      height: 50px;
      width: 80px;
      object-fit: contain;
      pointer-events: none;
    }

    @container content (width < 520px) {
      width: 56px;

      .vehicle-image {
        transform: translateX(-12px);
      }
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

      .highlight {
        color: var(--blue-thin-color);
      }
    }
  }
}
</style>
