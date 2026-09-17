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
            <span class="date">{{ formatStatisticsDay(vehicle.day) }}</span>
          </span>
        </span>
      </button>
      <div class="values">
        <button v-for="slot in slots" :key="slot" class="value"
          :class="{ active: expanded && activeSlot === slot }"
          :aria-label="`${availableSlots[slot].label}: ${formatSlotValue(slot, vehicle[slot])}`"
          v-tooltip="availableSlots[slot].label" @click="selectSlot(slot)">
          {{ formatSlotValue(slot, vehicle[slot]) }}
        </button>
      </div>
    </div>
    <div v-if="expanded" :id="panelId" class="chart-panel">
      <div class="chart-title">
        <span>{{ availableSlots[activeSlot].label }}</span>
        <span class="chart-value">{{ formatSlotValue(activeSlot, vehicle[activeSlot]) }}
          <span class="date">за {{ formatStatisticsDay(vehicle.day) }}</span>
        </span>
      </div>
      <div class="chart-placeholder">
        <Icon :icon="availableSlots[activeSlot].icon" class="placeholder-icon" />
        <span>Здесь будет график по дням</span>
        <span class="placeholder-caption">{{ name }} · {{ availableSlots[activeSlot].label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import ArrowDown from '@/assets/icons/arrow-down.svg'
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import VehicleImage from '@/shared/game/vehicles/vehicle/VehicleImage.vue'
import VehicleType from '@/shared/game/vehicles/type/VehicleType.vue'
import { isVehicleType } from '@/shared/game/vehicles/type/vehicleTypeToImage'
import { regionToGame } from '@/shared/game/wot'
import { getTankName } from '@/shared/i18n/i18n'
import { romanNumberProcessor } from '@/shared/utils/processors/processors'
import { availableSlots, formatSlotValue, formatStatisticsDay, type Slot, type VehicleStatistics } from './helpers'

const props = defineProps<{ vehicle: VehicleStatistics, slots: Slot[] }>()
const name = computed(() => getTankName(props.vehicle.tankTag, true))
const expanded = ref(false)
const activeSlot = ref<Slot>(props.slots[0] ?? 'battles')
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

watch(() => props.slots, slots => {
  if (!slots.includes(activeSlot.value)) activeSlot.value = slots[0] ?? 'battles'
})
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
}

.name {
  display: grid;
  grid-column: 1 / 5;
  grid-template-columns: var(--expand-width) repeat(2, var(--metadata-width)) minmax(0, 1fr);
  align-items: stretch;
  min-width: 0;
  text-align: left;
  color: inherit;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }
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
  padding: 1px 10px;
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
    background: var(--chart-panel-background);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 10px;
      right: 10px;
      height: 2px;
      background: var(--blue-thin-color);
      border-radius: 2px;
    }
  }
}

.vehicle-row {
  --chart-panel-background: #353535;
}

.chart-panel {
  background: var(--chart-panel-background);
  padding: 18px;
}

.chart-title {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  font-size: 14px;
}

.chart-value {
  font-variant-numeric: tabular-nums;

  .date {
    margin-left: 6px;
  }
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 190px;
  margin-top: 16px;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}

.placeholder-icon {
  width: 40px;
  height: 40px;
  opacity: 0.5;
}

.placeholder-caption {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
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
