<template>
  <div class="card">
    <div class="chart-container">
      <ShadowLine :data="chartData" :options="options" class="chart" />
      <div class="chart-options">
        <DropDown :variants="periodVariants" v-model="period" />
        <DropDown :variants="filtererStepVariants" v-model="step" />
      </div>

      <div class="chart-options right">
        <DropDown v-if="showDisplayVariant" :variants="displayVariants" v-model="displayVariant" />
      </div>
    </div>
    <div class="flex slider" v-if="smoothIsNeeded">
      <Tooltip text="Скользящее среднее">
        <p>Сглаживание</p>
      </Tooltip>
      <input class="flex-1" type="range" :min="0" :max="20" :step="1" v-model="smooth">
    </div>
  </div>
</template>


<script setup lang="ts">

import { ShadowLine } from '@/components/widgets/charts/ShadowLineController'
import { computed, watch } from 'vue'
import { ChartProps } from 'vue-chartjs'
import { bloggerNamesArray } from './bloggerNames'
import DropDown from '@/components/dropdown/DropDown.vue'
import { useLocalStorage, useMediaQuery } from '@vueuse/core'
import { stepVariants, periodVariants, period, step } from './queryLoader'
import { displayVariant, displayVariants, preferredLogProcessor } from '../store'
import { useLogProcessor } from '@/composition/usePercentProcessor'
import Tooltip from '@/components/Tooltip.vue'


const periodToStep = {
  'all': ['min1', 'min3', 'min10', 'min30', 'hour1', 'day'],
  'today': ['min1', 'min3', 'min10', 'min30', 'hour1'],
  'yesterday': ['min1', 'min3', 'min10', 'min30', 'hour1'],
  'lastHour': ['sec5', 'sec10', 'min1', 'min3', 'min10', 'min30'],
  'last24': ['min1', 'min3', 'min10', 'min30', 'hour1'],
  'day1': ['min1', 'min3', 'min10', 'min30', 'hour1'],
  'day2': ['min1', 'min3', 'min10', 'min30', 'hour1'],
  'day3': ['min1', 'min3', 'min10', 'min30', 'hour1'],
  'day4': ['min1', 'min3', 'min10', 'min30', 'hour1'],
  'day5': ['min1', 'min3', 'min10', 'min30', 'hour1'],
  'day6': ['min1', 'min3', 'min10', 'min30', 'hour1'],
  'day7': ['min1', 'min3', 'min10', 'min30', 'hour1'],
  'day8': ['min1', 'min3', 'min10', 'min30', 'hour1'],
  'day9': ['min1', 'min3', 'min10', 'min30', 'hour1'],
  'day10': ['min1', 'min3', 'min10', 'min30', 'hour1'],
}

const defaultValues = {
  'all': 'min30',
  'today': 'min1',
  'yesterday': 'min1',
  'lastHour': 'sec10',
  'last24': 'min1',
  'day1': 'min1',
  'day2': 'min1',
  'day3': 'min1',
  'day4': 'min1',
  'day5': 'min1',
  'day6': 'min1',
  'day7': 'min1',
  'day8': 'min1',
  'day9': 'min1',
  'day10': 'min1',
} as const


const pad = (num: number) => num.toString().padStart(2, '0')
const enabledBloggers = useLocalStorage('bob25-enabled-blogers', bloggerNamesArray.map(() => true))
const smooth = useLocalStorage('bob25-chart-smooth', 0)
const smoothIsNeeded = computed(() => props.smoothIfNeed && props.labels.length > 300)

function formatDateFull(dt: number) {
  const date = new Date(dt * 1000)
  const day = pad(date.getDate())
  const month = pad(date.getMonth() + 1) // Months are 0-based
  const year = date.getFullYear().toString().slice(-2)
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())

  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`
}

function formatDateHHMM(dt: number) {
  const date = new Date(dt * 1000)
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())

  return `${hours}:${minutes}`
}

function formatDateDay(dt: number) {
  const date = new Date(dt * 1000)
  const day = pad(date.getDate())
  const month = pad(date.getMonth() + 1) // Months are 0-based

  return `${day}.${month}`
}

const filtererStepVariants = computed(() => {
  return stepVariants.filter(v => periodToStep[period.value].includes(v.value))
})



watch(period, () => {
  if (!periodToStep[period.value].includes(step.value))
    step.value = defaultValues[period.value]
})

const bloggerColors = [
  ['#f931a3', '#EB1E9100'],
  ['#fffb35', '#fffb1c00'],
  ['#ff2a2a', '#f7101000'],
  ['#1679ff', '#0040ff00'],
]

const props = defineProps<{
  data: (number | null)[][],
  labels: number[],
  showDisplayVariant?: boolean,
  processor?: (v: number) => string,
  min?: number,
  max?: number,
  yValues?: number[],
  yIsPercent?: boolean,
  hightFilter?: boolean,
  shouldSteppedInterpolation?: boolean,
  smoothIfNeed?: boolean,
}>()

function interpolateSteppedData(data: (number | null)[]): (number | null)[] {
  // First, extract the key points (ignoring consecutive duplicates and nulls)
  interface KeyPoint { index: number; value: number; }
  const keyPoints: KeyPoint[] = []
  data.forEach((d, i) => {
    if (d === null) return
    // Only push if this is the first number or it differs from the previous key point.
    if (keyPoints.length === 0 || keyPoints[keyPoints.length - 1].value !== d || i - keyPoints[keyPoints.length - 1].index > 3) {
      keyPoints.push({ index: i, value: d })
    }
  })

  // If there are no key points (or all values were null) return a copy.
  if (keyPoints.length === 0) {
    return data.slice()
  }

  // Create a result array (we will fill it in)
  const result: (number | null)[] = data.slice()

  // Fill in from the beginning to the first key point with the first key value.
  const firstKey = keyPoints[0]
  for (let i = 0; i < firstKey.index; i++) {
    result[i] = firstKey.value
  }

  // Now go through each interval between consecutive key points and interpolate.
  for (let k = 0; k < keyPoints.length - 1; k++) {
    const start = keyPoints[k]
    const end = keyPoints[k + 1]
    const deltaIndex = end.index - start.index
    const deltaValue = end.value - start.value
    for (let i = start.index; i <= end.index; i++) {
      const t = (i - start.index) / deltaIndex // t goes from 0 to 1
      result[i] = start.value + deltaValue * t
    }
  }

  // Fill in from the last key point to the end of the array.
  const lastKey = keyPoints[keyPoints.length - 1]
  for (let i = lastKey.index + 1; i < data.length; i++) {
    result[i] = lastKey.value
  }

  // Finally, ensure that any positions that were originally null remain null.
  for (let i = 0; i < data.length; i++) {
    if (data[i] === null) {
      result[i] = null
    }
  }

  return result
}

function interpolateNullValues(values: (number | null)[], maxStep: number = 0): (number | null)[] {
  const result = []
  for (let i = 0; i < values.length; i++) {
    if (values[i] == null) {
      let j = i
      while (values[j] == null && j < values.length && (j - i) < maxStep) j++
      const start = values[i - 1]
      const end = values[j]

      if (start == null || end == null) {
        for (let k = i; k <= j; k++) {
          result[k] = null
        }
      } else {
        const delta = end - start
        const isInt = Number.isInteger(start) && Number.isInteger(end)
        for (let k = i; k <= j; k++) {
          result[k] = start + delta * (k - i) / (j - i)
          if (isInt) result[k] = Math.round(result[k]!)
        }
      }

      i = j
    } else {
      result[i] = values[i]!
    }
  }
  return result
}

function movingAvg(values: (number | null)[], window: number) {
  const result = []
  for (let i = 0; i < values.length; i++) {
    if (values[i] === null) {
      result.push(null)
      continue
    }

    let sum = 0
    let count = 0
    for (let j = i - window; j <= i + window; j++) {
      if (j < 0 || j >= values.length) continue
      if (values[j] === null) continue
      sum += values[j]!
      count++
    }

    const isInt = Number.isInteger(sum)
    result.push(isInt ? Math.round(sum / count) : sum / count)
  }

  return result
}

const chartData = computed<ChartProps<'bar' | 'line'>['data']>(() => {
  const datasets: ChartProps<'bar' | 'line'>['data']['datasets'] =
    props.data.map((data, i) => {

      let lastNonZero = 0

      let processed: (number | null)[] = []
      processed = data
      if (!props.showDisplayVariant || displayVariant.value != 'delta') {
        processed = data
      } else {
        processed = data
          .map((v, i) => i == 0 || !v || !data[i] || !data[i - 1] ? null : data[i] - data[i - 1]!)
          .map(t => {
            if (lastNonZero == t) return lastNonZero
            if (t) lastNonZero = t
            return t == null ? t : lastNonZero
          })
      }

      if (props.hightFilter) {
        let lastNonHigh = 0
        let last10: number[] = []
        let last10Sum = 0
        for (let i = 0, added = 0; i < processed.length && added < 10; i++) {
          if (!processed[i]) continue
          last10.push(processed[i]!)
          last10Sum += processed[i]!
          added++
        }

        for (let i = 0; i < processed.length; i++) {
          const element = processed[i]
          if (!element) continue

          if (element > last10Sum / 10 * 2 || element < last10Sum / 10 / 2) {
            processed[i] = lastNonHigh
          } else {
            lastNonHigh = element
          }

          last10Sum -= last10.shift()!
          last10.push(element)
          last10Sum += element
        }
      }

      return {
        data: props.shouldSteppedInterpolation ?
          interpolateSteppedData(processed).map(t => t ? Math.round(t) : null) :
          !smoothIsNeeded.value || smooth.value == 0 ? processed : movingAvg(interpolateNullValues(processed, Math.round(processed.length * 0.01)), Math.round(smooth.value)),
        label: bloggerNamesArray[i],
        backgroundColor: bloggerColors[i][0],
        borderColor: bloggerColors[i][1],
        hidden: !enabledBloggers.value[i],
      }
    })

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

const smallScreen = useMediaQuery('(max-width: 700px)')


const logProc = useLogProcessor(2)

const options = computed<ChartProps<'bar'>['options']>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  scales: {
    y: {
      display: !!props.yValues,
      min: props.min,
      max: props.max,
      ticks: props.yValues ? {
        stepSize: 0.05,
        callback: function (value, index, values) {
          if (props.yValues?.includes(value as any)) return props.yIsPercent ? `${(value as number) * 100}%` : value
          return null
        }
      } : undefined
    },
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
          const offset = smallScreen.value ? 0.03 : 0.01
          if (index <= ctx.length * offset || index >= ctx.length * (1 - offset)) return ''

          const t = this.getLabelForValue(value as any) as any as number
          if (t % (smallScreen.value ? targetSkip.value * 2 : targetSkip.value) != 0) return ''

          return targetSkip.value < 60 * 60 * 24 ? formatDateHHMM(t) : formatDateDay(t)
        }
      }
    },
  },
  interaction: {
    intersect: false,
    mode: 'index'
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
      onClick: (e, legendItem, legend) => {
        const datasetIndex = legendItem.datasetIndex
        if (datasetIndex == undefined) return
        enabledBloggers.value[datasetIndex] = !enabledBloggers.value[datasetIndex]
      }
    },
    tooltip: {
      position: 'nearest',
      callbacks: {
        title: t => {
          return `${formatDateFull(t[0].label as any)}`
        },
        label: props.processor ?
          t => `${bloggerNamesArray[t.datasetIndex]}: ${props.processor!(t.parsed.y)}` :
          preferredLogProcessor.value ? t => `${bloggerNamesArray[t.datasetIndex]}: ${logProc(t.parsed.y)}` : undefined,
      },

    },
  },
}))


</script>


<style lang="scss" scoped>
.chart-container {
  aspect-ratio: 2;

  @media screen and (max-width: 900px) {
    aspect-ratio: 1.5;
  }

  .chart-options {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    gap: 5px;
    align-items: flex-start;
    z-index: 3;

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

.slider {
  margin-top: 10px;
  align-items: center;
  gap: 10px;

  input {
    margin: 0;
    margin-bottom: -2px;
  }
}
</style>