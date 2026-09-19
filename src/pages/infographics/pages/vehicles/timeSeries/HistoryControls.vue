<template>
  <div class="history-controls" :class="{ compact }">
    <button v-for="option in steps" :key="option.value" :class="{ active: step === option.value }"
      @click="step = option.value">{{ option.label }}</button>

    <span class="divider"></span>

    <button v-for="window in averageWindows" :key="window" :class="{ active: averageWindow === window }"
      v-tooltip:vehicleHistoryAverage.top-float="`Скользящее среднее по ${window} соседним точкам. Повторное нажатие выключает сглаживание`"
      @click="toggleAverage(window)">avg{{ window }}</button>

    <template v-if="$slots.default">
      <span class="divider"></span>
      <slot />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { HistoryAverageWindow, HistoryStep } from './historyStep'

defineProps<{ compact?: boolean }>()

const step = defineModel<HistoryStep>('step', { required: true })
const averageWindow = defineModel<HistoryAverageWindow>('averageWindow', { required: true })

const steps = [
  { value: 'day', label: 'День' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
] as const satisfies readonly { value: HistoryStep, label: string }[]
const averageWindows = [3, 5, 7] as const

function toggleAverage(window: NonNullable<HistoryAverageWindow>) {
  averageWindow.value = averageWindow.value === window ? null : window
}
</script>

<style scoped lang="scss">
.history-controls {
  --history-control-color: rgba(255, 255, 255, 0.45);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;

  button {
    padding: 3px 0;
    color: var(--history-control-color);
    font-size: 12px;
    font-weight: bold;
    white-space: nowrap;
    cursor: pointer;

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        color: rgba(255, 255, 255, 0.8);
      }
    }

    &.active {
      color: white;
    }
  }

  .divider {
    height: 14px;
    border-left: 1px solid rgba(255, 255, 255, 0.2);
    margin: 0 3px;
  }

  &.compact {
    --history-control-color: rgba(197, 197, 197, 0.6);
    flex-wrap: nowrap;

    button {
      padding: 0;
    }

    .divider {
      border-color: rgba(255, 255, 255, 0.25);
      margin: 0 2px;
    }
  }
}
</style>
