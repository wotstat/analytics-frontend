<template>
  <div class="charts" :class="{ 'loading': loading, 'full-season': isFullSeason }">

    <div class="chart">
      <HeaderTooltip :ctx="scoreChart.tooltipCtx.value">
        <template #left>
          <h3>Очки по дням</h3>
        </template>

        <template #right>
          <IntervalSelector v-if="!isZoom" :seasonInterval="props.seasonInterval" :modelValue="selectedInterval"
            @update:modelValue="updateInterval" v-model:isOpen="isFirstSelectOpen" />
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
      <UniversalChartComponent :chart="scoreChart" />
    </div>

    <div class="chart" ref="battleChartElement">
      <HeaderTooltip :ctx="battleChart.tooltipCtx.value">
        <template #left>
          <h3>Бои по дням</h3>
        </template>

        <template #right>
          <IntervalSelector v-if="!isZoom" :seasonInterval="props.seasonInterval" :modelValue="selectedInterval"
            @update:modelValue="updateInterval" v-model:isOpen="isSecondSelectOpen" />
        </template>

        <template #tooltip="{ ctx }">
          <div class="tooltip-container">
            <div class="value-row">
              <span v-if="pointDelta(ctx)" class="delta spacer" aria-hidden="true">
                <TriangleUp class="triangle" /> {{ Math.abs(pointDelta(ctx)!) }}
              </span>
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
      <UniversalChartComponent :chart="battleChart" />
    </div>
  </div>
</template>


<script setup lang="ts">
import { computed, markRaw, nextTick, ref, watch, watchEffect } from 'vue'
import UniversalChartComponent from '@/shared/uiKit/chart/universalChart/UniversalChart.vue'
import { dateToDbDate, queryComputed, loading as loadingState } from '@/db'
import { BattlesChart, ScoreChart } from './Charts'

import IntervalSelector, { type SelectedInterval } from './intervalSelector/IntervalSelector.vue'
import { TooltipCtx } from '@/shared/uiKit/chart/universalChart/hover/composableHover/components/chartTooltip/ChartTooltip'
import { HoverSynchronizer } from '@/shared/uiKit/chart/universalChart/hover/composableHover/sync/HoverSynchronizer'
import { BoundsSynchronizer } from '@/shared/uiKit/chart/universalChart/hover/composableHover/sync/BoundsSynchronizer'
import { useRoute } from 'vue-router'
import { getRegionDayChangeHourOffset } from '@/shared/game/comp7/utils'
import HeaderTooltip from '@/shared/ui/chart/HeaderTooltip.vue'
import TriangleUp from '../../assets/triangle-up.svg'

const route = useRoute()
const isZoom = computed(() => route.query['ab'] == 'zoom')
const loading = ref(true)

const isFirstSelectOpen = ref(false)
const isSecondSelectOpen = ref(false)

const captureClose = defineModel<boolean>('captureClose')

watch([isFirstSelectOpen, isSecondSelectOpen], ([first, second]) => {
  if (first || second) captureClose.value = true
  else setTimeout(() => captureClose.value = false, 10)
})

const props = defineProps<{
  bdid: number
  region: string
  seasonInterval: { start: Date, end: Date, length: number }
}>()

const data = queryComputed<{ recalculationTime: string, rank: number, rating: number, battlesCount: number }>(() => `
  with
    '${dateToDbDate(props.seasonInterval.start)}' as START_DATE,
    '${dateToDbDate(props.seasonInterval.end)}' as END_DATE,
    recalculation as (
        select recalculationTime
        from Comp7Leaderboard
        where recalculationTime between START_DATE and END_DATE + interval 5 day and region = '${props.region}'
        group by recalculationTime
        order by recalculationTime
    ),
    player as (
        select recalculationTime, rank, rating, battlesCount
        from Comp7Leaderboard
        where region = '${props.region}' and
            bdid = ${props.bdid} and
            recalculationTime between START_DATE and END_DATE + interval 5 day
        order by recalculationTime
    )
  select *
  from player
  right join recalculation using recalculationTime
`)

watchEffect(() => {
  loading.value = data.value.status == loadingState
})

const selectedInterval = defineModel<SelectedInterval | null>('selectedInterval', { default: null })
const isFullSeason = computed(() => selectedInterval.value == null || selectedInterval.value.name == 'Весь сезон')

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

const MINUTE = 1 * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24

const startTime = props.seasonInterval.start.getTime() + getRegionDayChangeHourOffset(props.region)

const sync = {
  hover: new HoverSynchronizer(),
  bounds: new BoundsSynchronizer('horizontal')
}
const scoreChart = markRaw(new ScoreChart(props.seasonInterval, sync))
const battleChart = markRaw(new BattlesChart(props.seasonInterval, sync))

updateInterval(selectedInterval.value)

function updateInterval(value: SelectedInterval | null) {
  scoreChart.setViewInterval(value)
  battleChart.setViewInterval(value)
  selectedInterval.value = value
}

scoreChart.onSetRenderBounds.on(bounds => {
  const { minX, maxX } = bounds
  if (minX == null || maxX == null) return

  const delta = maxX - minX
  const fullDelta = props.seasonInterval.length * DAY

  if (delta > fullDelta - HOUR) {
    selectedInterval.value = { start: props.seasonInterval.start, end: props.seasonInterval.end, name: 'Весь сезон' }
  } else {
    selectedInterval.value = { start: new Date(startTime + minX * 1000), end: new Date(startTime + maxX * 1000) }
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
  const score = data.value.data.map(point => point.rating == 0 ? null : {
    x: (new Date(point.recalculationTime + 'Z').getTime() - startTime) / 1000,
    y: point.rating
  })

  const battles = data.value.data.map(point => point.battlesCount == 0 ? null : {
    x: (new Date(point.recalculationTime + 'Z').getTime() - startTime) / 1000,
    y: point.battlesCount
  })

  if (isFullSeason.value) {
    const scoreDays = groupByDays(score)
    const battleDays = groupByDays(battles)
    scoreChart.setPoints(scoreDays.line).setMinMaxPoints(scoreDays.max, scoreDays.min)
    battleChart.setPoints(battleDays.line)
  } else {
    scoreChart.setPoints(score).setMinMaxPoints([], [])
    battleChart.setPoints(battles)
  }
})


</script>


<style lang="scss" scoped>
.charts {
  display: flex;
  gap: 30px;
  padding: 20px 30px;
  padding-top: 0;
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

  @container (width <=1000px) {
    flex-direction: column;
  }

  @container (width <=1000px) and (width >=500px) {
    div.chart {
      aspect-ratio: 2 / 1;
    }
  }

  @container (width <=500px) {
    padding: 20px 10px;

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
</style>