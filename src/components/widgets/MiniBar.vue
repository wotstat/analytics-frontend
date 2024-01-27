<template>
  <div class="chart-container">
    <ShadowBar :data="chartData" :options="options" />
  </div>
</template>


<script setup lang="ts">
import { computed } from 'vue';
import { type ChartProps } from 'vue-chartjs';
import { type TooltipCallbacks } from 'chart.js';
import { ShadowBar } from "@/components/ShadowBarController";
import { BloomColorVariant, getColor } from '../bloomColors';

const props = defineProps<{
  data: number[],
  labels: string[],
  color: BloomColorVariant,
  callbacks?: Partial<TooltipCallbacks<'bar'>>,
}>()

const chartData = computed<ChartProps<'bar'>['data']>(() => ({
  labels: props.labels,
  datasets: [
    {
      data: props.data,
      borderColor: getColor(props.color).bloom,
      backgroundColor: getColor(props.color).main,
      maxBarThickness: 30,
    }
  ]
}))

const max = computed(() => Math.max(...props.data))

const options = computed<ChartProps<'bar'>['options']>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: { display: false, max: max.value == 0 ? undefined : max.value * 1.1 },
    x: {
      grid: { display: false, },
    },
  },
  interaction: {
    intersect: false,
    mode: 'index',
  },
  plugins: {
    tooltip: {
      callbacks: props.callbacks,
    },
    legend: {
      display: false,
    },
  }
}))

</script>