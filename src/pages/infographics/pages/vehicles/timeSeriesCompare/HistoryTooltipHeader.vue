<template>
  <b class="heading">{{ availableSlots[point.slot].label }}</b>
  <div class="metadata" :class="{ horizontal }">
    <template v-if="horizontal">
      <span v-if="gameVersion" class="game-version">{{ gameVersion }}</span>
      <span v-if="gameVersion" class="separator">·</span>
      <span v-if="point.step === 'day'" class="weekday">{{ formatHistoryWeekday(point.periodStart) }}</span>
      <span v-if="point.step === 'day'" class="separator">·</span>
      <span class="date">{{ point.step === 'day' ? formatStatisticsDay(point.periodStart)
        : formatHistoryPeriod(point.periodStart, point.periodEnd, point.step) }}</span>
    </template>
    <template v-else>
      <span class="date">{{ formatHistoryPeriod(point.periodStart, point.periodEnd, point.step) }}</span>
      <span v-if="gameVersion" class="game-version">{{ gameVersion }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { availableSlots } from '../shared/vehicleMetrics'
import { formatStatisticsDay } from '../shared/formatStatisticsDay'
import { formatHistoryPeriod, formatHistoryWeekday } from '../timeSeries/formatHistoryPeriod'
import type { VehicleHistoryHit } from '../timeSeries/VehicleHistoryChart'

defineProps<{
  point: VehicleHistoryHit['datum']
  horizontal: boolean
  gameVersion?: string | null
}>()
</script>

<style scoped lang="scss">
.heading {
  display: block;
  color: white;
  overflow-wrap: anywhere;
  text-align: left;
}

.metadata {
  span {
    display: block;
  }

  .date,
  .game-version {
    color: rgba(255, 255, 255, 0.5);
    text-align: left;
  }

  .game-version {
    overflow-wrap: anywhere;
  }

  .weekday {
    flex: none;
    width: 2ch;
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
  }

  .separator {
    color: rgba(255, 255, 255, 0.5);
  }

  &.horizontal {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    column-gap: 6px;
    min-width: 0;
    margin-left: auto;
    text-align: right;

    .date,
    .game-version {
      text-align: right;
    }
  }
}
</style>
