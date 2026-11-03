<template>
  <ToolbarOptions v-model="step" :options="stepOptions" />
  <ToolbarOptions v-model="averageWindow" :options="averageOptions" clearable />
</template>

<script setup lang="ts">
import ToolbarOptions from '@/shared/ui/chart/timeSeries/toolbar/options/ToolbarOptions.vue'
import type { ToolbarOption } from '@/shared/ui/chart/timeSeries/toolbar/options/toolbarOptions'
import type { HistoryAverageWindow, HistoryStep } from './historyStep'

const step = defineModel<HistoryStep>('step', { required: true })
const averageWindow = defineModel<HistoryAverageWindow>('averageWindow', { required: true })

const stepOptions = [
  { value: 'day', label: 'День' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
] as const satisfies readonly ToolbarOption<HistoryStep>[]

const averageOptions = ([3, 5, 7] as const).map(window => ({
  value: window,
  label: `avg${window}`,
  tooltip: `Скользящее среднее по ${window} соседним точкам. Повторное нажатие выключает сглаживание`,
})) satisfies readonly ToolbarOption<NonNullable<HistoryAverageWindow>>[]
</script>
