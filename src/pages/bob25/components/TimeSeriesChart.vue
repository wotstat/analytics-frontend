<template>
  <div class="card">
    <div class="chart-container">
      <ShadowLine :data="chartData" :options="options" class="chart" />
      <div class="chart-options">
        <DropDown :variants="periodVariants" v-model="period" />
        <DropDown :variants="filtererStepVariants" v-model="step" />
      </div>

      <div class="chart-options right">
        <DropDown v-if="showDisplayVariant" :variants="displayVariants" v-model="display" />
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">

import { ShadowLine } from "@/components/widgets/charts/ShadowLineController";
import { computed, ref, watch } from "vue";
import { ChartProps } from "vue-chartjs";
import { bloggerNamesArray } from "./bloggerNames";
import { timeProcessor } from "@/utils";
import DropDown from "@/components/dropdown/DropDown.vue";
import { useLocalStorage } from "@vueuse/core";
import { stepVariants, periodVariants, period, step } from "./queryLoader";

const displayVariants = [
  { value: 'total', label: 'Всего' },
  { value: 'delta', label: 'Прирост' },
]

const periodToStep = {
  'all': ['min1', 'min3', 'min10', 'min30', 'hour1', 'day'],
  'today': ['min1', 'min3', 'min10', 'min30', 'hour1'],
  'yesterday': ['min1', 'min3', 'min10', 'min30', 'hour1'],
  'lastHour': ['sec5', 'sec10', 'min1', 'min3', 'min10', 'min30'],
  'last24': ['min1', 'min3', 'min10', 'min30', 'hour1'],
}

const defaultValues = {
  'all': 'min30',
  'today': 'min1',
  'yesterday': 'min1',
  'lastHour': 'sec10',
  'last24': 'min1',
} as const


const pad = (num: number) => num.toString().padStart(2, '0')

function formatDateFull(dt: number) {
  const date = new Date(dt * 1000);
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1); // Months are 0-based
  const year = date.getFullYear().toString().slice(-2);
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}

function formatDateHHMM(dt: number) {
  const date = new Date(dt * 1000);
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${hours}:${minutes}`;
}

function formatDateDay(dt: number) {
  const date = new Date(dt * 1000);
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1); // Months are 0-based

  return `${day}.${month}`;
}

const filtererStepVariants = computed(() => {
  return stepVariants.filter(v => periodToStep[period.value].includes(v.value))
})

const display = useLocalStorage<typeof displayVariants[number]['value']>('bob25-selected-chart-display', 'total')

watch(period, () => {
  step.value = defaultValues[period.value]
})

const bloggerColors = [
  ['#f931a3', '#EB1E9100'],
  ['#ff2a2a', '#f7101000'],
  ['#1679ff', '#0040ff00'],
  ['#fffb35', '#fffb1c00'],
]

const props = defineProps<{
  data: number[][],
  labels: number[],
  showDisplayVariant?: boolean,
  processor?: (v: number) => string,
  min?: number,
  max?: number,
}>()

const chartData = computed<ChartProps<'bar' | 'line'>['data']>(() => {
  const datasets: ChartProps<'bar' | 'line'>['data']['datasets'] =
    props.data.map((data, i) => ({
      data: !props.showDisplayVariant || display.value == 'total' ?
        data :
        data.map((v, i) => i == 0 || !v ? null : v - data[i - 1]),
      label: bloggerNamesArray[i],
      backgroundColor: bloggerColors[i][0],
      borderColor: bloggerColors[i][1]
    }))

  return {
    labels: props.labels,
    datasets: datasets
  }
})

const minDate = computed(() => props.labels[0])
const maxDate = computed(() => props.labels[props.labels.length - 1])

const targetSkip = computed(() => {
  const delta = maxDate.value - minDate.value
  const MIN = 60
  const HOUR = MIN * 60


  if (delta < MIN) return 5
  if (delta < HOUR * 2) return MIN * 5

  if (delta < HOUR * 6) return MIN * 30
  if (delta < HOUR * 24 * 2) return HOUR

  if (delta < HOUR * 24 * 5) return HOUR * 12

  return HOUR * 24
})


const options = computed<ChartProps<'bar'>['options']>(() => ({
  responsive: true,
  animation: false,
  scales: {
    y: { display: false, min: props.min, max: props.max },
    x: {
      grid: {
        display: true,
        drawTicks: false,
        color: (context) => context.tick && context.tick.label ? 'rgba(255,255,255,0.05)' : 'transparent'
      },
      min: 0,
      ticks: {
        autoSkip: false,
        maxRotation: 0,
        callback: function (value, index, ctx) {
          if (index <= ctx.length * 0.01 || index >= ctx.length * 0.99) return ''

          const t = this.getLabelForValue(value as any) as any as number
          if (t % targetSkip.value != 0) return ''

          return targetSkip.value < 60 * 60 * 24 ? formatDateHHMM(t) : formatDateDay(t)
        }
      }
    },
  },
  interaction: {
    intersect: false,
    mode: 'index',
  },
  labels: {
    enabled: true,
  },
  elements: {
    point: {
      pointStyle: false
    },
  },
  plugins: {
    legend: {
      display: true,
    },
    tooltip: {
      callbacks: {
        title: t => {
          return `${formatDateFull(t[0].label as any)}`
        },
        label: props.processor ? t => `${bloggerNamesArray[t.datasetIndex]}: ${props.processor!(t.parsed.y)}` : undefined,
      },

    },
  },
}))


</script>


<style lang="scss" scoped>
.chart-container {
  aspect-ratio: 2;

  .chart-options {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    gap: 5px;
    align-items: flex-start;

    &.right {
      left: unset;
      right: 0;
    }
  }

  .chart {
    margin-top: -4px;

    @media screen and (max-width: 900px) {
      margin-top: 25px;
    }
  }
}

.card {
  @media screen and (max-width: 900px) {
    padding-bottom: 35px;
  }
}
</style>