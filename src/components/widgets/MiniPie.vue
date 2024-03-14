<template>
  <ServerStatusWrapper :status="status" v-slot="{ showError, status }">
    <div class="chart-container" v-if="status != 'error'">
      <ShadowPie :data="chartData" :options="options" />
    </div>

    <div class="flex flex-1 center pointer" v-else @click="showError">
      <p class="card-main-info error">!</p>
    </div>
  </ServerStatusWrapper>
</template>


<script setup lang="ts">
import { computed, nextTick, onActivated, onDeactivated, ref } from 'vue';
import { type ChartProps } from 'vue-chartjs';
import { type TooltipCallbacks } from 'chart.js';
import { ShadowPie } from "@/components/ShadowPieController";
import { BloomColorVariant, getColor } from '../bloomColors';
import ServerStatusWrapper from '../ServerStatusWrapper.vue';
import { Status } from '@/db';

const props = defineProps<{
  data: number[],
  status?: Status,
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

const animated = ref(false)
onActivated(() => nextTick(() => animated.value = true))
onDeactivated(() => animated.value = false)


const options = computed<ChartProps<'pie'>['options']>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: animated.value ? undefined : false,
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