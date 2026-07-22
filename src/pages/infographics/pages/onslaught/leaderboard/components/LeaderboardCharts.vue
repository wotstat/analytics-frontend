<template>
  <div class="charts-section">
    <div class="charts" :class="{ 'loading': loading, 'full-season': isFullSeason }">
      <div class="chart">
        <TipZoomChart class="tip-bubble" ref="tipZoomChart" :display="true" />
        <HeaderTooltip :ctx="thresholdChart.tooltipCtx.value">
          <template #left>
            <h3>Порог для легенды</h3>
          </template>

          <template #right>
            <DaySelector v-model="selectedDays" v-model:is-open="isFirstSelectOpen"
              :season-interval="props.seasonInterval" :region="props.region" selection-mode="interval" />
          </template>

          <template #tooltip="{ ctx }">
            <div class="tooltip-container">
              <div class="value-row">
                <Transition name="fade">
                  <span v-if="pointDelta(ctx)" class="delta spacer"
                    :class="{ up: pointDelta(ctx)! > 0, down: pointDelta(ctx)! < 0 }">
                    <TriangleUp class="triangle" /> {{ Math.abs(pointDelta(ctx)!) }}
                  </span>
                </Transition>
                <p class="value">{{ ctx.nearestDataPoints[0].yValue }}</p>
                <Transition name="fade">
                  <span v-if="pointDelta(ctx)" class="delta"
                    :class="{ up: pointDelta(ctx)! > 0, down: pointDelta(ctx)! < 0 }">
                    <TriangleUp class="triangle" /> {{ Math.abs(pointDelta(ctx)!) }}
                  </span>
                </Transition>
              </div>
              <p class="date">{{ tooltipDate(ctx) }}</p>
            </div>
          </template>
        </HeaderTooltip>
        <UniversalChartComponent :chart="thresholdChart" />
      </div>

      <div class="chart">
        <HeaderTooltip :ctx="playersChart.tooltipCtx.value">
          <template #left>
            <h3>Игроков в легенде</h3>
          </template>

          <template #right>
            <DaySelector v-model="selectedDays" v-model:is-open="isSecondSelectOpen"
              :season-interval="props.seasonInterval" :region="props.region" selection-mode="interval" />
          </template>

          <template #tooltip="{ ctx }">
            <div class="tooltip-container">
              <div class="value-row">
                <Transition name="fade">
                  <span v-if="pointDelta(ctx)" class="delta spacer"
                    :class="{ up: pointDelta(ctx)! > 0, down: pointDelta(ctx)! < 0 }">
                    <TriangleUp class="triangle" /> {{ Math.abs(pointDelta(ctx)!) }}
                  </span>
                </Transition>
                <p class="value">{{ ctx.nearestDataPoints[0].yValue }}</p>
                <Transition name="fade">
                  <span v-if="pointDelta(ctx)" class="delta"
                    :class="{ up: pointDelta(ctx)! > 0, down: pointDelta(ctx)! < 0 }">
                    <TriangleUp class="triangle" /> {{ Math.abs(pointDelta(ctx)!) }}
                  </span>
                </Transition>
              </div>
              <p class="date">{{ tooltipDate(ctx) }}</p>
            </div>
          </template>
        </HeaderTooltip>
        <UniversalChartComponent :chart="playersChart" />
      </div>
    </div>

    <Transition name="notice">
      <div v-if="!isFullSeason" class="noise-notice">
        <p>
          Шум графика это не баг WotStat. Такие же колебания присутствуют в игровой таблице лидеров.
        </p>
        <OnslaughtCheckbox v-model="usePlaceBoundary" class="smooth-toggle">Сглаживать шум</OnslaughtCheckbox>
      </div>
    </Transition>
  </div>
</template>


<script setup lang="ts">
import { computed, markRaw, ref, watchEffect, useTemplateRef } from 'vue'
import UniversalChartComponent from '@/shared/uiKit/chart/universalChart/UniversalChart.vue'
import { dateToDbDate, queryComputed, loading as loadingState } from '@/db'
import { BattlesChart, ScoreChart } from './detail/Charts'
import DaySelector from '../../shared/daySelector/DaySelector.vue'
import type { SelectedInterval } from './detail/types.ts'
import type { TooltipCtx } from '@/shared/uiKit/chart/universalChart/hover/composableHover/components/chartTooltip/ChartTooltip'
import { HoverSynchronizer } from '@/shared/uiKit/chart/universalChart/hover/composableHover/sync/HoverSynchronizer'
import { BoundsSynchronizer } from '@/shared/uiKit/chart/universalChart/hover/composableHover/sync/BoundsSynchronizer'
import { getRegionDayChangeHourOffset } from '@/shared/game/comp7/utils'
import HeaderTooltip from '@/shared/ui/chart/HeaderTooltip.vue'
import TriangleUp from '../assets/triangle-up.svg'
import TipZoomChart from './tips/TipZoomChart.vue'
import { useDisposer } from '@/shared/ui/disposer/disposer.ts'
import OnslaughtCheckbox from '../../shared/Checkbox.vue'
import { useLocalStorage } from '@vueuse/core'

const props = defineProps<{
  region: string
  seasonInterval: { start: Date, end: Date, length: number }
  refreshKey: number
}>()

const loading = ref(true)
const usePlaceBoundary = useLocalStorage('onslaught:leaderboard:smooth-elite-chart', false)
const tipZoomChart = useTemplateRef<InstanceType<typeof TipZoomChart>>('tipZoomChart')
const isFirstSelectOpen = ref(false)
const isSecondSelectOpen = ref(false)

const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const DAY_MS = DAY * 1000
const legendShare = computed(() => props.region.toUpperCase() == 'RU' ? 0.05 : 0.15)

const data = queryComputed<{
  recalculationTime: string
  eliteThreshold: number
  elitePlayers: number
  placeEliteThreshold: number
  placeElitePlayers: number
}>(() => `
  with
    '${dateToDbDate(props.seasonInterval.start)}' as START_DATE,
    '${dateToDbDate(props.seasonInterval.end)}' as END_DATE
  select
    recalculationTime,
    minIf(rating, elite) as eliteThreshold,
    uniqExactIf(bdid, elite) as elitePlayers,
    quantileExactHigh(${1 - legendShare.value})(rating) as placeEliteThreshold,
    greatest(1, toUInt32(floor(max(rank) * ${legendShare.value}))) as placeElitePlayers
  from Comp7LeaderboardByRank
  where region = '${props.region}' and
    recalculationTime between START_DATE and END_DATE + interval 5 day
  group by recalculationTime
  order by recalculationTime
  -- refresh-key: ${props.refreshKey}
`, { allowCache: false })

watchEffect(() => {
  loading.value = data.value.status == loadingState
})

const selectedInterval = ref<SelectedInterval | null>(null)
const isFullSeason = computed(() => selectedInterval.value == null)

const seasonDays = computed(() => Array.from(
  { length: Math.ceil(props.seasonInterval.length) },
  (_, index) => new Date(props.seasonInterval.start.getTime() + index * DAY_MS).toISOString().slice(0, 10)
))
const seasonDayIndex = computed(() => new Map(seasonDays.value.map((day, index) => [day, index])))

const selectedDays = computed<string[]>({
  get() {
    const interval = selectedInterval.value
    if (!interval) return []

    const seasonStart = props.seasonInterval.start.getTime()
    const from = Math.min(seasonDays.value.length, Math.max(
      0,
      Math.floor((interval.start.getTime() - seasonStart) / DAY_MS)
    ))
    const to = Math.max(0, Math.min(
      seasonDays.value.length,
      Math.ceil((interval.end.getTime() - seasonStart) / DAY_MS)
    ))

    return seasonDays.value.slice(from, Math.max(from + 1, to))
  },
  set(days) {
    if (days.length === 0) {
      updateInterval(null)
      return
    }

    const indexes = [...new Set(days)]
      .map(day => seasonDayIndex.value.get(day))
      .filter((index): index is number => index !== undefined)
      .sort((a, b) => a - b)
    if (indexes.length === 0) return

    if (indexes[0] === 0 && indexes.at(-1) === seasonDays.value.length - 1) {
      updateInterval(null)
      return
    }

    const seasonStart = props.seasonInterval.start.getTime()
    updateInterval({
      start: new Date(seasonStart + indexes[0] * DAY_MS),
      end: new Date(seasonStart + (indexes.at(-1)! + 1) * DAY_MS),
    })
  },
})

function tooltipDate(ctx: TooltipCtx) {
  const x = ctx.nearestDataPoints[0].xValue

  if (isFullSeason.value) return new Date(startTime + (x - DAY) * 1000).toLocaleDateString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return new Date(startTime + x * 1000).toLocaleString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).replace(',', '')
}

function pointDelta(ctx: TooltipCtx): number | null {
  const dp = ctx.nearestDataPoints[0]
  if (!dp) return null

  if (isFullSeason.value) {
    for (let i = dp.pointIndex - 1; i >= 0; i--) {
      const prev = dp.dataSource[i]
      if (prev) return dp.yValue - prev.y
    }

    return null
  }

  const dayStart = Math.floor((dp.xValue - 20 * MINUTE) / DAY) * DAY + 20 * MINUTE
  let baseline: { x: number, y: number } | null = null
  for (let i = dp.pointIndex; i >= 0; i--) {
    const point = dp.dataSource[i]
    if (!point) continue
    if (point.x < dayStart) break
    baseline = point
  }

  if (!baseline) return null
  return dp.yValue - baseline.y
}

const startTime = props.seasonInterval.start.getTime() + getRegionDayChangeHourOffset(props.region)
const sync = {
  hover: new HoverSynchronizer(),
  bounds: new BoundsSynchronizer('horizontal')
}
const thresholdChart = markRaw(new ScoreChart(props.seasonInterval, sync))
const playersChart = markRaw(new BattlesChart(props.seasonInterval, sync))

useDisposer()
  .add(thresholdChart.callback.on('touchZoomBegin', () => tipZoomChart.value?.accept()))
  .add(thresholdChart.callback.on('wheelZoom', () => tipZoomChart.value?.accept()))

function updateInterval(value: SelectedInterval | null) {
  selectedInterval.value = value
  thresholdChart.setViewInterval(value)
  playersChart.setViewInterval(value)
}

thresholdChart.onSetRenderBounds.on(bounds => {
  const { minX, maxX } = bounds
  if (minX == null || maxX == null) return

  const delta = maxX - minX
  const fullDelta = props.seasonInterval.length * DAY

  if (delta > fullDelta - HOUR) {
    selectedInterval.value = null
  } else {
    const seasonStart = props.seasonInterval.start.getTime()
    selectedInterval.value = {
      start: new Date(seasonStart + minX * 1000),
      end: new Date(seasonStart + maxX * 1000),
    }
  }
})

function groupByDays(points: ({ x: number, y: number } | null)[]) {
  const byDay = new Map<number, { last: { x: number, y: number }, min: number, max: number }>()

  for (const point of points) {
    if (!point || point.x < 0) continue
    const day = Math.ceil((point.x - 20 * MINUTE) / DAY) - 1
    const current = byDay.get(day)
    if (!current) {
      byDay.set(day, { last: point, min: point.y, max: point.y })
    } else {
      if (point.x > current.last.x) current.last = point
      current.min = Math.min(current.min, point.y)
      current.max = Math.max(current.max, point.y)
    }
  }

  const line: ({ x: number, y: number } | null)[] = []
  const min: ({ x: number, y: number } | null)[] = []
  const max: ({ x: number, y: number } | null)[] = []
  if (byDay.size == 0) return { line, min, max }

  const maxDay = Math.max(...byDay.keys())
  for (let day = 0; day <= maxDay; day++) {
    const value = byDay.get(day)
    const x = (day + 1) * DAY
    line.push(value ? { x, y: value.last.y } : null)
    min.push(value ? { x, y: value.min } : null)
    max.push(value ? { x, y: value.max } : null)
  }

  return { line, min, max }
}

watchEffect(() => {
  const displayPlaceBoundary = usePlaceBoundary.value && !isFullSeason.value
  const threshold = data.value.data.map(point => {
    const value = displayPlaceBoundary ? point.placeEliteThreshold : point.eliteThreshold
    return value == 0 ? null : {
      x: (new Date(point.recalculationTime + 'Z').getTime() - startTime) / 1000,
      y: value
    }
  })
  const players = data.value.data.map(point => ({
    x: (new Date(point.recalculationTime + 'Z').getTime() - startTime) / 1000,
    y: displayPlaceBoundary ? point.placeElitePlayers : point.elitePlayers
  }))

  if (isFullSeason.value) {
    const thresholdDays = groupByDays(threshold)
    const playerDays = groupByDays(players)
    thresholdChart.setPoints(thresholdDays.line).setMinMaxPoints(thresholdDays.max, thresholdDays.min)
    playersChart.setPoints(playerDays.line).setMinMaxPoints(playerDays.max, playerDays.min)
  } else {
    thresholdChart.setPoints(threshold).setMinMaxPoints([], [])
    playersChart.setPoints(players).setMinMaxPoints([], [])
  }
})
</script>


<style lang="scss" scoped>
.charts-section {
  padding-bottom: 20px;
}

.charts {
  display: flex;
  gap: 30px;
  cursor: default;

  :deep(.universal-chart-root) {
    opacity: 1;
    transition: opacity 0.2s;
  }

  &.loading {
    .chart {
      :deep(.chart-container) {
        position: relative;

        .universal-chart-root {
          opacity: 0;
        }

        &::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 10px;

          $color: rgba(255, 255, 255, 0.01);
          $highlight-color: rgba(255, 255, 255, 0.05);

          background: linear-gradient(90deg, $color 8%, $highlight-color 18%, $color 33%);
          background-size: 200% 100%;
          animation: shine 1.8s infinite linear;
          background-position: 100% 0;

          @keyframes shine {
            to {
              background-position: -100% 0;
            }
          }
        }
      }
    }
  }

  @container (width <=900px) {
    flex-direction: column;
  }

  @container (width <=900px) and (width >=500px) {
    div.chart {
      aspect-ratio: 2 / 1;
    }
  }

  @container (width <=500px) {
    div.chart {
      aspect-ratio: 1.5 / 1;
    }
  }

  :deep(.chart-container) {
    margin-right: -5px;
  }

  .chart {
    flex: 1;
    border-radius: 4px;
    aspect-ratio: 1.8 / 1;
    display: flex;
    flex-direction: column;
    position: relative;

    .tip-bubble {
      position: absolute;
      top: 40px;
      left: 40px;
      z-index: 1;
    }

    :deep(.universal-chart-root) {
      background: inherit;

      .main-line {
        stroke-width: 2px;
        stroke: rgba(2, 175, 255, 1);
        stroke-linecap: round;

        &.area {
          stroke: none;
        }
      }

      .minmax-area .area {
        fill: rgba(2, 175, 255, 0.15);
      }

      .diagonal-fill-pattern {
        stroke: rgba(255, 255, 255, 0.1);
        stroke-width: 1;
      }

      .ticks {
        opacity: 0.1;

        .y-ticks {
          stroke: rgba(255, 255, 255, 1);
        }

        .day-ticks {
          stroke: rgba(255, 255, 255, 0.1);
        }

        .week-ticks {
          stroke: rgba(255, 255, 255, 1);
        }
      }

      .label {
        font-weight: bold;
        font-size: 11px;
      }

      .hover {
        .interactive-zone {
          cursor: crosshair;
        }

        &.pan-active {
          .interactive-zone {
            cursor: grabbing;
          }
        }

        .hover-marker {
          fill: rgba(2, 175, 255, 1);
        }
      }

      .blue-gradient {
        .stop-1 {
          stop-color: rgba(29, 108, 255, 0.2);
        }

        .stop-2 {
          stop-color: rgba(29, 108, 255, 0);
        }
      }
    }
  }

  h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
    padding-right: 10px;
  }

  .tooltip-container {
    display: flex;
    flex-direction: column;
    align-items: center;

    .value-row {
      display: flex;
    }

    .value {
      font-size: 20px;
      line-height: 20px;
      font-weight: bold;
      color: white;
    }

    .date {
      font-size: 11px;
      line-height: 1;
      font-weight: bold;
      color: rgba(255, 255, 255, 0.5);
      margin-top: 3px;
      margin-bottom: 3px;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .delta {
      margin-left: 4px;
      display: flex;
      align-items: flex-end;
      gap: 2px;
      font-size: 13px;
      line-height: 1;
      font-weight: bold;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;

      .triangle {
        height: 0.6em;
        margin-bottom: 2px;
      }

      &.spacer {
        margin-left: 0;
        margin-right: 4px;
        visibility: hidden;
      }

      &.up {
        color: #57ff6e;
      }

      &.down {
        color: #ff6060;

        .triangle {
          transform: rotate(180deg);
        }
      }
    }
  }

  &.full-season {

    .fade-enter-active,
    .fade-leave-active {
      transition-delay: 0s;
    }
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.1s, filter 0.1s;
    transition-delay: 0.2s;
  }

  .fade-leave-active {
    transition-delay: 0s;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
    filter: blur(2px);
  }
}

.noise-notice {
  margin-top: 14px;
  padding: 2px 0 2px 12px;
  border-left: 2px solid rgba(2, 175, 255, 1);
  font-size: 14px;
  line-height: 1.45;

  p {
    margin: 0;
  }
}

.smooth-toggle {
  font-size: 14px;
}

.notice-enter-active,
.notice-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.notice-enter-from,
.notice-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
