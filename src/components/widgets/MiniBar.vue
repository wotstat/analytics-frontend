<template>
  <ServerStatusWrapper :status="status" v-slot="{ showError, status }">
    <div class="chart-container" v-if="status != 'error'">
      <ShadowBar :data="chartData" :options="options" />
    </div>
    <div class="flex flex-1 center pointer" v-else @click="showError">
      <p class="card-main-info error">!</p>
    </div>
  </ServerStatusWrapper>
</template>


<script setup lang="ts">
import { computed } from 'vue';
import { type ChartProps } from 'vue-chartjs';
import { type TooltipCallbacks } from 'chart.js';
import { ShadowBar } from "@/components/ShadowBarController";
import { BloomColorVariant, getColor } from '../bloomColors';
import { Status, loading } from '@/db';
import ServerStatusWrapper from '../ServerStatusWrapper.vue';

const props = defineProps<{
  data: number[],
  status?: Status,
  labels: (string | number)[],
  color: BloomColorVariant,
  callbacks?: Partial<TooltipCallbacks<'bar'>>,
  tooltipDisabled?: boolean,
  ticksXDisabled?: boolean,
  centerLine?: boolean,
}>()

const isLoading = computed(() => props?.status === loading)

const chartData = computed<ChartProps<'bar'>['data']>(() => ({
  labels: props.labels,
  datasets: [
    {
      data: props.data,
      borderColor: !isLoading.value ? getColor(props.color).bloom : '#e5e5e5',
      backgroundColor: !isLoading.value ? getColor(props.color).main : 'transparent',
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
      ticks: { display: !props.ticksXDisabled, },
    },
  },
  interaction: {
    intersect: false,
    mode: 'index',
  },
  plugins: {
    tooltip: {
      callbacks: props.callbacks,
      enabled: !props.tooltipDisabled,
    },
    legend: {
      display: false,
    },
    centerLine: props.centerLine
  }
}))

</script>
