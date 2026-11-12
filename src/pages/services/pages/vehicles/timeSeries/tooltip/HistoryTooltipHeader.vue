<template>
  <div class="history-tooltip-header" :class="{ horizontal }">
    <b class="date">{{ formatHistoryPeriod(point.periodStart, point.periodEnd, point.step) }}</b>
    <span v-if="gameVersion" class="game-version">{{ gameVersion }}</span>
  </div>
</template>

<script setup lang="ts">
import { formatHistoryPeriod } from './formatHistoryPeriod'
import type { VehicleHistoryHit } from '../VehicleHistoryChart'

defineProps<{
  point: VehicleHistoryHit['datum']
  horizontal: boolean
  gameVersion?: string | null
}>()
</script>

<style scoped lang="scss">
.history-tooltip-header {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  text-align: left;

  .date {
    color: white;
    overflow-wrap: anywhere;
  }

  .game-version {
    color: rgba(255, 255, 255, 0.45);
    overflow-wrap: anywhere;
  }

  &.horizontal {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 2px 12px;
  }
}
</style>
