<template>
  <div class="card">
    <div class="time-series-chart">
      <div class="chart-options">
        <DropDown :variants="periodVariants" v-model="period" />
        <DropDown :variants="filtererStepVariants" v-model="step" />
      </div>

      <Legend :legend="legend" class="chart-legend" toggleable highlightable />

      <div class="chart-options right">
        <DropDown v-if="showDisplayVariant" :variants="displayVariants" v-model="displayVariant" />
      </div>

      <FloatingTooltip :ctx="tooltipCtx" :animated="true" :animation-omega="20" class="blogger-chart-tooltip"
        v-slot="{ ctx }">
        <div class="tooltip-content">
          <h4>{{ formatDateFull(ctx.hit.datum.x) }}</h4>

          <div class="tooltip-series" v-for="hit in ctx.hits" :key="hit.datum.series">
            <span class="series-marker" :style="{ backgroundColor: bloggerColors[hit.datum.seriesIndex] }"
              :class="{ highlighted: ctx.isHighlighted(hit, lineHighlight) }"></span>
            <span>{{ hit.datum.series }}</span>
            <b>{{ tooltipValue(hit.datum.y) }}</b>
          </div>
        </div>
      </FloatingTooltip>

      <div class="chart-surface">
        <UniversalChartComponent :chart="chart" />
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
import FloatingTooltip from '@/shared/ui/chart/FloatingTooltip.vue'
import Legend from '@/shared/ui/chart/Legend.vue'
import { useLegend } from '@/shared/ui/chart/useLegend'
import Tooltip from '@/shared/ui/components/Tooltip.vue'
import DropDown from '@/shared/uiKit/dropdown/DropDown.vue'
import UniversalChartComponent from '@/shared/uiKit/chart/universalChart/UniversalChart.vue'
import { useLocalStorage, useMediaQuery } from '@vueuse/core'
import { computed, markRaw, watch, watchEffect } from 'vue'
import { createFixedSpaceProcessor, createLogProcessor } from '@/shared/utils/processors/processors'
import { displayVariant, displayVariants, preferredLogProcessor } from '../store'
import { bloggerNamesArray } from './bloggerNames'
import { periodVariants, period, step, stepVariants } from './queryLoader'
import { BloggerTimeSeriesChart, formatDateFull } from './TimeSeriesChart'

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

const bloggerColors = ['#f931a3', '#fffb35', '#ff2a2a', '#1679ff']

const props = defineProps<{
  data: (number | null)[][]
  labels: number[]
  showDisplayVariant?: boolean
  processor?: (value: number) => string
  min?: number
  max?: number
  yValues?: number[]
  yIsPercent?: boolean
  hightFilter?: boolean
  shouldSteppedInterpolation?: boolean
  smoothIfNeed?: boolean
}>()

const enabledBloggers = useLocalStorage('bob25-enabled-blogers', bloggerNamesArray.map(() => true))
const smooth = useLocalStorage('bob25-chart-smooth', 0)
const smoothIsNeeded = computed(() => props.smoothIfNeed && props.labels.length > 300)
const smallScreen = useMediaQuery('(max-width: 700px)')
const filtererStepVariants = computed(() => stepVariants.filter(variant => periodToStep[period.value].includes(variant.value)))

watch(period, () => {
  if (!periodToStep[period.value].includes(step.value)) step.value = defaultValues[period.value]
})

const series = bloggerNamesArray.map((name, index) => ({
  name,
  color: bloggerColors[index],
  tag: name,
}))
const legend = useLegend(series)

watch(enabledBloggers, enabled => {
  for (let index = 0; index < series.length; index++) {
    const shouldBeEnabled = enabled[index] !== false
    if (legend.isEnabled(series[index]) !== shouldBeEnabled) legend.toggle(series[index])
  }
}, { deep: true, immediate: true })

watch(legend.enabledTags, tags => {
  const enabled = new Set(tags)
  const next = series.map(item => enabled.has(item.tag))
  if (next.some((value, index) => value !== enabledBloggers.value[index])) enabledBloggers.value = next
})

const chart = markRaw(new BloggerTimeSeriesChart({
  series: bloggerNamesArray,
  highlightSync: legend.highlightSync,
}))
const tooltipCtx = chart.tooltipCtx
const lineHighlight = chart.highlight

const processedData = computed(() => props.data.map(data => {
  let lastNonZero = 0
  let processed: (number | null)[] = [...data]

  if (props.showDisplayVariant && displayVariant.value === 'delta') {
    processed = data
      .map((value, index) => index === 0 || !value || !data[index - 1] ? null : value - data[index - 1]!)
      .map(value => {
        if (lastNonZero === value) return lastNonZero
        if (value) lastNonZero = value
        return value == null ? value : lastNonZero
      })
  }

  if (props.hightFilter) filterHighValues(processed)

  if (props.shouldSteppedInterpolation) {
    return interpolateSteppedData(processed).map(value => value ? Math.round(value) : null)
  }
  if (!smoothIsNeeded.value || smooth.value === 0) return processed

  return movingAvg(
    interpolateNullValues(processed, Math.round(processed.length * 0.01)),
    Math.round(smooth.value),
  )
}))

watchEffect(() => chart.update({
  labels: props.labels,
  data: processedData.value,
  enabledSeries: legend.enabledTags.value,
  min: props.min,
  max: props.max,
  yValues: props.yValues,
  yIsPercent: props.yIsPercent,
  smallScreen: smallScreen.value,
}))

const logProcessor = createLogProcessor(2)
const spaceProcessor = createFixedSpaceProcessor(0)

function tooltipValue(value: number) {
  if (props.processor) return props.processor(value)
  if (preferredLogProcessor.value) return logProcessor(value)
  return spaceProcessor(value)
}

function interpolateSteppedData(data: (number | null)[]): (number | null)[] {
  const keyPoints: { index: number, value: number }[] = []
  data.forEach((value, index) => {
    if (value === null) return
    if (keyPoints.length === 0 || keyPoints[keyPoints.length - 1].value !== value || index - keyPoints[keyPoints.length - 1].index > 3) {
      keyPoints.push({ index, value })
    }
  })

  if (keyPoints.length === 0) return data.slice()

  const result = data.slice()
  const firstKey = keyPoints[0]
  for (let index = 0; index < firstKey.index; index++) result[index] = firstKey.value

  for (let keyIndex = 0; keyIndex < keyPoints.length - 1; keyIndex++) {
    const start = keyPoints[keyIndex]
    const end = keyPoints[keyIndex + 1]
    const deltaIndex = end.index - start.index
    const deltaValue = end.value - start.value
    for (let index = start.index; index <= end.index; index++) {
      const progress = (index - start.index) / deltaIndex
      result[index] = start.value + deltaValue * progress
    }
  }

  const lastKey = keyPoints[keyPoints.length - 1]
  for (let index = lastKey.index + 1; index < data.length; index++) result[index] = lastKey.value
  for (let index = 0; index < data.length; index++) if (data[index] === null) result[index] = null

  return result
}

function interpolateNullValues(values: (number | null)[], maxStep = 0): (number | null)[] {
  const result: (number | null)[] = []
  for (let index = 0; index < values.length; index++) {
    if (values[index] != null) {
      result[index] = values[index]
      continue
    }

    let endIndex = index
    while (values[endIndex] == null && endIndex < values.length && endIndex - index < maxStep) endIndex++
    const start = values[index - 1]
    const end = values[endIndex]

    if (start == null || end == null) {
      for (let fillIndex = index; fillIndex <= endIndex; fillIndex++) result[fillIndex] = null
    } else {
      const delta = end - start
      const isInt = Number.isInteger(start) && Number.isInteger(end)
      for (let fillIndex = index; fillIndex <= endIndex; fillIndex++) {
        result[fillIndex] = start + delta * (fillIndex - index) / (endIndex - index)
        if (isInt) result[fillIndex] = Math.round(result[fillIndex]!)
      }
    }

    index = endIndex
  }
  return result
}

function movingAvg(values: (number | null)[], window: number) {
  return values.map((value, index) => {
    if (value === null) return null

    let sum = 0
    let count = 0
    for (let offset = index - window; offset <= index + window; offset++) {
      if (offset < 0 || offset >= values.length || values[offset] === null) continue
      sum += values[offset]!
      count++
    }

    return Number.isInteger(sum) ? Math.round(sum / count) : sum / count
  })
}

function filterHighValues(values: (number | null)[]) {
  let lastNonHigh = 0
  const last10 = values.filter((value): value is number => !!value).slice(0, 10)
  let last10Sum = last10.reduce((sum, value) => sum + value, 0)
  if (last10.length === 0) return

  for (let index = 0; index < values.length; index++) {
    const value = values[index]
    if (!value) continue

    const average = last10Sum / last10.length
    if (value > average * 2 || value < average / 2) values[index] = lastNonHigh
    else lastNonHigh = value

    last10Sum -= last10.shift() ?? 0
    last10.push(value)
    last10Sum += value
  }
}
</script>


<style lang="scss">
.blogger-chart-tooltip {
  --popover-background-color: rgba(0, 0, 0, 0.85);
  --popover-border-color: rgba(255, 255, 255, 0.1);

  .popover-background {
    border-radius: 5px;
  }
}
</style>

<style lang="scss" scoped>
.tooltip-content {
  min-width: 145px;
  padding: 7px 8px;

  h4 {
    margin: 0 0 6px;
    color: white;
    font-size: 13px;
    line-height: 1;
  }

  .tooltip-series {
    display: grid;
    grid-template-columns: 8px 1fr auto;
    gap: 6px;
    align-items: center;
    margin-top: 4px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 12px;
    line-height: 1;

    b {
      color: white;
      font-variant-numeric: tabular-nums;
    }
  }

  .series-marker {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    transition: transform 0.15s;

    &.highlighted {
      transform: scale(1.4);
    }
  }
}

.time-series-chart {
  position: relative;
  aspect-ratio: 2;

  .chart-options {
    position: absolute;
    z-index: 3;
    top: 0;
    left: 0;
    display: flex;
    align-items: flex-start;
    gap: 5px;

    &.right {
      right: 0;
      left: unset;
    }
  }

  .chart-legend {
    position: absolute;
    z-index: 2;
    top: 5px;
    right: 90px;
    left: 90px;
    justify-content: center;
    color: rgba(255, 255, 255, 0.87);
    font-size: 12px;
  }

  .chart-surface {
    position: absolute;
    inset: 28px 0 0;
  }

  :deep(.chart-container) {
    position: absolute;
    inset: 0;

    .x-labels,
    .y-labels {
      color: rgba(255, 255, 255, 0.87);
      font-size: 12px;
      font-weight: 500;
    }

    .time-grid .tick,
    .value-grid .tick {
      stroke: rgba(255, 255, 255, 0.05);
    }

    .plot-area-border path {
      stroke: rgba(255, 255, 255, 0.1);
    }

    .blogger-line.line {
      stroke-width: 3px;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition: filter 0.15s, stroke-width 0.15s;

      &.highlighted {
        stroke-width: 4px;
        filter: brightness(1.2);
      }
    }

    .blogger-line-0 {
      stroke: #f931a3;
    }

    .blogger-line-1 {
      stroke: #fffb35;
    }

    .blogger-line-2 {
      stroke: #ff2a2a;
    }

    .blogger-line-3 {
      stroke: #1679ff;
    }

    .interactive-zone {
      cursor: crosshair;
    }
  }
}

.slider {
  align-items: center;
  gap: 10px;
  margin-top: 10px;

  input {
    margin: 0 0 -2px;
  }
}

@media screen and (max-width: 900px) {
  .time-series-chart {
    aspect-ratio: 1.5;

    .chart-legend {
      top: 35px;
      right: 0;
      left: 0;
    }

    .chart-surface {
      inset: 58px 0 0;
    }
  }
}
</style>
