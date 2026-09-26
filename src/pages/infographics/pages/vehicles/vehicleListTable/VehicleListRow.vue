<template>
  <div class="vehicle-row" :class="{ expanded }">
    <div class="line mt-font">
      <button class="compare" :class="{ added: compared }" @click="$emit('compare', historySelection)">
        <Transition name="compare-icon">
          <Checkmark v-if="compared" key="checkmark" class="compare-icon" />
          <PlusIcon v-else key="plus" class="compare-icon" />
        </Transition>
      </button>

      <button class="name" :title="vehicle.tankTag === null ? name : undefined" @click="expanded = !expanded">
        <ArrowDown class="arrow" :class="{ expanded }" />

        <span v-if="vehicle.tankLevel !== null" class="metadata-cell">
          <span class="level">{{ romanNumberProcessor(vehicle.tankLevel) }}</span>
        </span>

        <span v-if="vehicle.tankType !== null" class="metadata-cell">
          <VehicleType :type="isVehicleType(vehicle.tankType) ? vehicle.tankType : 'any'" class="type" />
        </span>

        <span v-if="vehicle.tankTag !== null" class="vehicle-cell">
          <VehicleImage :tag="vehicle.tankTag" :game="regionToGame(vehicle.region)" size="preview" loading="lazy"
            class="vehicle-image" />
          <span class="vehicle-info">
            <span class="vehicle-name" :title="vehicleName(vehicle, false)">{{ name }}</span>
            <span v-if="vehicle.day !== latestDay" class="postfix">{{ formatStatisticsDay(vehicle.day) }}</span>
          </span>
        </span>
      </button>

      <div class="values">
        <button v-for="slot in slots" :key="slot" class="value" :class="{ active: expanded && activeSlot === slot }"
          v-tooltip="availableSlots[slot].label" @click="selectSlot(slot)">
          {{ formatSlotValue(slot, vehicle[slot]) }}
        </button>
      </div>
    </div>

    <div v-if="expanded" class="chart-panel">
      <VehicleTimeSeries v-model:step="historyStep" v-model:average-window="averageWindow" :selection="historySelection"
        :name :slot="activeSlot" :filters :min-battles :min-players :skip-incomplete-days />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import PlusIcon from './assets/plus-bold.svg'
import Checkmark from './assets/checkmark-bold.svg'
import ArrowDown from './assets/arrow-down.svg'
import VehicleImage from '@/shared/game/vehicles/vehicle/VehicleImage.vue'
import VehicleType from '@/shared/game/vehicles/type/VehicleType.vue'
import { isVehicleType } from '@/shared/game/vehicles/type/vehicleTypeToImage'
import { regionToGame } from '@/shared/game/wot'
import { romanNumberProcessor } from '@/shared/utils/processors/processors'
import { availableSlots, type Slot } from '../shared/vehicleMetrics'
import { formatSlotValue } from '../shared/formatMetricValue'
import { formatStatisticsDay } from '../shared/formatStatisticsDay'
import type { VehicleStatistics } from '../shared/types'
import type { VehicleFilters } from '../filters/types'
import VehicleTimeSeries from '../timeSeries/VehicleTimeSeries.vue'
import type { HistoryAverageWindow, HistoryStep } from '../timeSeries/historyStep'
import type { VehicleSelection } from '../shared/vehicleGrouping'
import { vehicleName } from '../shared/vehicleName'

const props = defineProps<{
  vehicle: VehicleStatistics
  latestDay: string
  slots: Slot[]
  filters: VehicleFilters
  selection: VehicleSelection
  minBattles: number
  minPlayers: number
  skipIncompleteDays: boolean
  compared: boolean
}>()

defineEmits<{ compare: [selection: VehicleSelection] }>()

const name = computed(() => vehicleName(props.vehicle))

const historySelection = computed<VehicleSelection>(() => {
  const { tankTag, tankLevel, tankType } = props.vehicle
  if (tankTag !== null) return { tankTag, levels: [], types: [], nations: [] }

  return {
    levels: tankLevel === null ? props.selection.levels : [tankLevel],
    types: tankType === null ? props.selection.types : [tankType],
    nations: props.selection.nations,
  }
})

const expanded = ref(false)
const activeSlot = defineModel<Slot>('activeSlot', { required: true })
const historyStep = defineModel<HistoryStep>('historyStep', { required: true })
const averageWindow = defineModel<HistoryAverageWindow>('averageWindow', { required: true })

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
  transition: margin 0.15s ease;

  &:nth-child(2n+1) {
    background-color: rgba(248, 252, 255, 0.025);
  }

  &.expanded {
    margin: 6px 0;
    background: rgba(255, 255, 255, 0.035);
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

    .compare {
      align-self: center;
      display: grid;
      place-items: center;
      margin-left: 6px;
      width: 28px;
      height: 30px;
      padding: 0;
      color: rgba(255, 255, 255, 0.55);
      border-radius: 5px;

      &:hover {
        color: white;
        background: rgba(255, 255, 255, 0.08);
      }

      &.added {
        color: #30d158;
      }

      .compare-icon {
        width: 12px;
        height: 12px;
        grid-area: 1 / 1;
        pointer-events: none;

        &.compare-icon-enter-active,
        &.compare-icon-leave-active {
          transition: opacity 0.18s ease, filter 0.18s ease, transform 0.18s ease;
        }

        &.compare-icon-enter-from,
        &.compare-icon-leave-to {
          opacity: 0;
          filter: blur(3px);
          transform: scale(0.65);
        }
      }
    }

    .name {
      display: grid;
      grid-column: 2 / var(--name-column-end);
      grid-template-columns: var(--vehicle-name-columns);
      align-items: stretch;
      min-width: 0;
      text-align: left;
      color: inherit;

      .arrow {
        width: 12px;
        height: 12px;
        align-self: center;
        justify-self: center;
        transform: rotate(-90deg);
        color: rgba(255, 255, 255, 0.55);
        transition: transform 0.15s;

        &.expanded {
          transform: rotate(0);
        }
      }

      .metadata-cell {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 0;

        .level {
          margin: 0;
          font-size: 14px;
        }

        .type {
          width: 16px;
          height: 18px;
        }
      }

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
    }

    .values {
      display: grid;
      grid-template-columns: repeat(var(--slot-count), minmax(0, 1fr));
      align-items: stretch;

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
    }
  }

  .chart-panel {
    padding: 18px;
    padding-top: 10px;
  }
}
</style>
