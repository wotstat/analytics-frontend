<template>
  <ToolbarChoiceGroup v-model="step" :options="stepOptions" />
  <ToolbarChoiceGroup v-model="averageWindow" :options="averageOptions" clearable />
</template>

<script setup lang="ts">
import ToolbarChoiceGroup from '@/shared/ui/chart/ToolbarChoiceGroup.vue'
import type { ToolbarChoiceOption } from '@/shared/ui/chart/toolbarChoiceGroup'
import type { HistoryAverageWindow, HistoryStep } from './historyStep'

const step = defineModel<HistoryStep>('step', { required: true })
const averageWindow = defineModel<HistoryAverageWindow>('averageWindow', { required: true })

const stepOptions = [
  { value: 'day', label: 'День' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
] as const satisfies readonly ToolbarChoiceOption<HistoryStep>[]

const averageOptions = ([3, 5, 7] as const).map(window => ({
  value: window,
  label: `avg${window}`,
  tooltip: `Скользящее среднее по ${window} соседним точкам. Повторное нажатие выключает сглаживание`,
})) satisfies readonly ToolbarChoiceOption<NonNullable<HistoryAverageWindow>>[]
</script>
