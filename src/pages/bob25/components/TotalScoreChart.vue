<template>
  <div class="card">
    <div class="chart-container">
      <ShadowLine :data="chartData" :options="options" class="chart" />
      <div class="chart-options">
        <DropDown :variants="periodVariants" v-model="period" />
        <DropDown :variants="filtererStepVariants" v-model="step" />
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">

import { ShadowLine } from "@/components/widgets/charts/ShadowLineController";
import { computed, ref, watch } from "vue";
import { ChartProps } from "vue-chartjs";
import { bloggerNamesArray } from "./bloggerNames";
import { sec2hour, timeProcessor } from "@/utils";
import DropDown from "@/components/dropdown/DropDown.vue";
import { useLocalStorage } from "@vueuse/core";



const periodVariants = [
  { value: 'all', label: 'Всё время' },
  { value: 'today', label: 'Сегодня' },
  { value: 'yesterday', label: 'Вчера' },
  { value: 'lastHour', label: 'Прошлый час' },
  { value: 'last24', label: 'Прошлые 24ч' },
] as const

const stepVariants = [
  { value: 'sec5', label: 'По 5 сек' },
  { value: 'sec10', label: 'По 10 сек' },
  { value: 'min1', label: 'По 1 мин' },
  { value: 'min10', label: 'По 10 мин' },
  { value: 'min30', label: 'По 30 мин' },
  { value: 'hour1', label: 'По 1 часу' },
  { value: 'day', label: 'По дням' },
] as const

const periodToStep = {
  'all': ['min1', 'min10', 'min30', 'hour1', 'day'],
  'today': ['sec10', 'min1', 'min10', 'min30', 'hour1'],
  'yesterday': ['sec10', 'min1', 'min10', 'min30', 'hour1'],
  'lastHour': ['sec5', 'sec10', 'min1', 'min10', 'min30'],
  'last24': ['sec10', 'min1', 'min10', 'min30', 'hour1'],
}

const defaultValues = {
  'all': 'min30',
  'today': 'min10',
  'yesterday': 'min10',
  'lastHour': 'sec10',
  'last24': 'sec10',
} as const

const filtererStepVariants = computed(() => {
  return stepVariants.filter(v => periodToStep[period.value].includes(v.value))
})

const period = useLocalStorage<typeof periodVariants[number]['value']>('bob25-selected-chart-period', 'all')
const step = useLocalStorage<typeof stepVariants[number]['value']>('bob25-selected-chart-step', 'min1')

watch(period, () => {
  step.value = defaultValues[period.value]
})

const bloggerColors = [
  ['#f931a3', '#EB1E9100'],
  ['#ff2a2a', '#f7101000'],
  ['#1679ff', '#0040ff00'],
  ['#fffb35', '#fffb1c00'],
]


const b1 = new Array(960).fill(0).map((_, i) => i / 1000 + Math.sin(i / 100) * 0.5 + 0.5)
const b2 = new Array(960).fill(0).map((_, i) => i / 900 + Math.sin(i / 150) * 0.5 + 0.5)
const b3 = new Array(960).fill(0).map((_, i) => i / 800 + Math.sin(i / 200) * 0.5 + 0.5)
const b4 = new Array(960).fill(0).map((_, i) => i / 700 + Math.sin(i / 250) * 0.5 + 0.5)

let i = ref(960)

const chartData = computed<ChartProps<'bar' | 'line'>['data']>(() => {
  i.value
  const datasets: ChartProps<'bar' | 'line'>['data']['datasets'] =

    [b1, b2, b3, b4].map((data, i) => ({
      data,
      label: bloggerNamesArray[i],
      backgroundColor: bloggerColors[i][0],
      borderColor: bloggerColors[i][1]
    }))

  return {
    labels: new Array(960).fill(0).map((_, i) => i),
    datasets: datasets
  }
})

setInterval(() => {
  b1.shift(); b2.shift(); b3.shift(); b4.shift()
  b1.push(i.value / 1000 + Math.sin(i.value / 100) * 0.5 + 0.5)
  b2.push(i.value / 900 + Math.sin(i.value / 150) * 0.5 + 0.5)
  b3.push(i.value / 800 + Math.sin(i.value / 200) * 0.5 + 0.5)
  b4.push(i.value / 700 + Math.sin(i.value / 250) * 0.5 + 0.5)
  i.value++
}, 1000)


const options = computed<ChartProps<'bar'>['options']>(() => ({
  responsive: true,
  animation: false,
  scales: {
    y: { display: false },
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
          return index > ctx.length * 0.01 && index < ctx.length * 0.99 &&
            (i.value + index - 1500) % 120 == 0 ? `${timeProcessor(i.value + index - 1500).join(':')}` : '';
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
    line: {
      tension: 0.3,
      borderWidth: 2,
    },
  },
  plugins: {
    legend: {
      display: true,
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
    align-items: flex-start
  }

  .chart {
    margin-top: -4px;

    @media screen and (max-width: 900px) {
      margin-top: 25px;
    }
  }
}
</style>