<template>
  <div class="vehicle-row" :class="{ expanded }">
    <div class="line mt-font">
      <button class="name" :aria-expanded="expanded" :aria-controls="panelId"
        :aria-label="`${expanded ? 'Свернуть' : 'Развернуть'} ${name}`" @click="expanded = !expanded">
        <ArrowDown class="arrow" :class="{ expanded }" />
        <span class="metadata-cell">
          <span class="level">{{ romanNumberProcessor(vehicle.tankLevel) }}</span>
        </span>
        <span class="metadata-cell">
          <VehicleType :type="isVehicleType(vehicle.tankType) ? vehicle.tankType : 'any'" class="type" />
        </span>
        <span class="vehicle-cell">
          <VehicleImage :tag="vehicle.tankTag" :game="regionToGame(vehicle.region)" size="preview" loading="lazy"
            class="vehicle-image" aria-hidden="true" />
          <span class="vehicle-info">
            <span class="vehicle-name" :title="getTankName(vehicle.tankTag)">{{ name }}</span>
            <span v-if="vehicle.day !== latestDay" class="date">{{ formatStatisticsDay(vehicle.day) }}</span>
          </span>
        </span>
      </button>
      <div class="values">
        <button v-for="slot in slots" :key="slot" class="value" :class="{ active: expanded && activeSlot === slot }"
          :aria-label="`${availableSlots[slot].label}: ${formatSlotValue(slot, vehicle[slot])}`"
          v-tooltip="availableSlots[slot].label" @click="selectSlot(slot)">
          {{ formatSlotValue(slot, vehicle[slot]) }}
        </button>
      </div>
    </div>
    <div v-if="expanded" :id="panelId" class="chart-panel">
      <div class="chart-title">
        <div class="title">
          <Icon name="chart-line" class="icon" :icon="availableSlots[activeSlot].icon" />
          <span>{{ availableSlots[activeSlot].label }}</span>
        </div>
        <span class="chart-value">{{ formatSlotValue(activeSlot, vehicle[activeSlot]) }}
          <span class="date">за {{ formatStatisticsDay(vehicle.day) }}</span>
        </span>
      </div>
      <VehicleTimeSeries :tank-tag="vehicle.tankTag" :slot="activeSlot" :filters :min-battles :min-players />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import ArrowDown from '@/assets/icons/arrow-down.svg'
import VehicleImage from '@/shared/game/vehicles/vehicle/VehicleImage.vue'
import VehicleType from '@/shared/game/vehicles/type/VehicleType.vue'
import { isVehicleType } from '@/shared/game/vehicles/type/vehicleTypeToImage'
import { regionToGame } from '@/shared/game/wot'
import { getTankName } from '@/shared/i18n/i18n'
import { romanNumberProcessor } from '@/shared/utils/processors/processors'
import { availableSlots, formatSlotValue, formatStatisticsDay, type Slot, type VehicleStatistics } from './helpers'
import type { VehicleFilters } from '../filters/types'
import VehicleTimeSeries from '../timeSeries/VehicleTimeSeries.vue'
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'

const props = defineProps<{
  vehicle: VehicleStatistics
  latestDay: string
  slots: Slot[]
  filters: VehicleFilters
  minBattles: number
  minPlayers: number
}>()
const name = computed(() => getTankName(props.vehicle.tankTag, true))
const expanded = ref(false)
const activeSlot = defineModel<Slot>('activeSlot', { required: true })
const id = useId()
const panelId = `${id}-chart`

function selectSlot(slot: Slot) {
  if (expanded.value && activeSlot.value === slot) {
    expanded.value = false
    return
  }
  activeSlot.value = slot
  expanded.value = true
}
</script>

<style scoped lang="scss">
.vehicle-row {
  &:nth-child(2n+1) {
    background-color: rgba(248, 252, 255, 0.025);
  }

  &.expanded {
    margin: 6px 0;
    background: rgba(255, 255, 255, 0.035);
  }
}

.line {
  display: grid;
  grid-template-columns: var(--vehicle-columns);
  min-height: 52px;

  @media (hover: hover) and (pointer: fine) {
    &:has(> .name:hover) {
      background: rgba(255, 255, 255, 0.04);
    }
  }
}

.name {
  display: grid;
  grid-column: 1 / 5;
  grid-template-columns: var(--expand-width) repeat(2, var(--metadata-width)) minmax(0, 1fr);
  align-items: stretch;
  min-width: 0;
  text-align: left;
  color: inherit;
}

.arrow {
  width: 11px;
  height: 11px;
  align-self: center;
  justify-self: center;
  fill: currentColor;
  opacity: 0.45;
  transform: rotate(-90deg);
  transition: transform 0.15s;

  &.expanded {
    transform: rotate(0);
  }
}

.vehicle-cell {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 1px 10px 1px 0;
}

.vehicle-image {
  height: 50px;
  width: 80px;
  object-fit: contain;
  flex-shrink: 0;
  pointer-events: none;
}

.vehicle-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.metadata-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.level {
  margin: 0;
  font-size: 14px;
}

.type {
  width: 16px;
  height: 18px;
}

.vehicle-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.date {
  color: rgba(255, 255, 255, 0.4);
  font-size: 11px;
  font-weight: normal;
}

.values {
  display: grid;
  grid-template-columns: repeat(var(--slot-count), minmax(0, 1fr));
  align-items: stretch;
}

.value {
  position: relative;
  min-width: 0;
  padding: 0 3px;
  font: inherit;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: inherit;

  &:hover {
    background: rgba(255, 255, 255, 0.045);
  }

  &.active {
    color: white;

    &::before {
      content: '';
      position: absolute;
      bottom: 3px;
      left: 10px;
      right: 10px;
      height: 2px;
      background: var(--blue-thin-color);
      border-radius: 2px;
    }
  }
}

.chart-panel {
  padding: 18px;
  padding-top: 10px;
}

.chart-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 14px;

  .title {
    display: flex;
    align-items: center;
    margin-left: -8px;

    .icon {
      width: 30px;
      height: 30px;
      fill: currentColor;
    }
  }
}

.chart-value {
  font-variant-numeric: tabular-nums;

  .date {
    margin-left: 6px;
  }
}

button:focus-visible,
.chart-panel:focus-visible {
  outline: 2px solid var(--blue-thin-color);
  outline-offset: -2px;
}

@media (max-width: 700px) {
  .vehicle-image {
    display: none;
  }

  .vehicle-cell {
    gap: 6px;
    padding: 4px 6px;
  }
}
</style>
