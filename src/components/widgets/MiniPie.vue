<template>
  <div class="chart-container">
    <ShadowPie :data="chartData" :options="options" />
  </div>
</template>


<script setup lang="ts">
import { computed } from 'vue';
import { type ChartProps, Bar } from 'vue-chartjs';
import { type TooltipCallbacks } from 'chart.js';
import { ShadowPie } from "@/components/ShadowPieController";
import { BloomColorVariant, getColor } from '../bloomColors';

const props = defineProps<{
  data: number[],
  labels: string[],
  color: BloomColorVariant[],
  callbacks?: Partial<TooltipCallbacks<'pie'>>,
}>()


const chartData = computed<ChartProps<'pie'>['data']>(() => ({
  labels: props.labels,
  datasets: [
    {
      data: props.data,
      borderColor: props.color.map(t => getColor(t).bloom),
      backgroundColor: props.color.map(t => getColor(t).darken),
      vvv: props.color.map(t => getColor(t).main),
    }
  ]
}))

const max = computed(() => Math.max(...props.data))

const t: ChartProps<'pie'>['options'] = {

}

const options = computed<ChartProps<'pie'>['options']>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: 20,
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