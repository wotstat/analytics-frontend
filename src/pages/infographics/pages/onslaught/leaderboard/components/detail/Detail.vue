<template>
  <div class="charts" :class="{ 'loading': loading }">
    <div class="chart">
      <div class="header">
        <div class="title">
          <h3>Очки по дням</h3>
        </div>
        <IntervalSelector v-if="!isZoom" />
      </div>
      <UniversalChartComponent :chart="scoreChart" />
    </div>
    <div class="chart" ref="battleChartElement">
      <div class="header" :style="{
        opacity: battleChart.tooltipCtx.value ? 0 : 1,
      }">
        <div class="title">
          <h3>Бои по дням</h3>
        </div>
        <IntervalSelector v-if="!isZoom" />
      </div>
      <UniversalChartComponent :chart="battleChart" />
    </div>

    <div class="tooltip tooltip-score" :style="{ transform: tooltipPosition(scoreChart.tooltipCtx.value, scoreWidth) }"
      v-if="scoreChart.tooltipCtx.value" ref="scoreTooltip">
      <p>{{ tooltipDate(scoreChart.tooltipCtx.value) }}</p>
      <div class="data flex">
        <p class="flex-1">Очки:</p>
        <p class="bold">{{ scoreChart.tooltipCtx.value?.nearestDataPoints[0].yValue }}</p>
      </div>
    </div>

    <Transition name="fade">
      <div class="tooltip-2 tooltip-battles"
        :style="{ transform: tooltipPosition2(battleChart.tooltipCtx.value, battleWidth) }"
        v-if="battleChart.tooltipCtx.value" ref="battleTooltip">
        <div class="data flex">
          <p class="bold">{{ battleChart.tooltipCtx.value?.nearestDataPoints[0].yValue }}</p>
        </div>
        <p class="date">{{ tooltipDate(battleChart.tooltipCtx.value) }}</p>
      </div>
    </Transition>
  </div>
</template>


<script setup lang="ts">
import { computed, markRaw, ref, watchEffect } from 'vue'
import UniversalChartComponent from '@/shared/uiKit/chart/universalChart/UniversalChart.vue'
import { dateToDbDate, queryComputed, loading as loadingState } from '@/db'
import { BattlesChart, ScoreChart } from './Charts'

import IntervalSelector from './intervalSelector/IntervalSelector.vue'
import { TooltipCtx } from '@/shared/uiKit/chart/universalChart/hover/composableHover/components/chartTooltip/ChartTooltip'
import { HoverSynchronizer } from '@/shared/uiKit/chart/universalChart/hover/composableHover/sync/HoverSynchronizer'
import { BoundsSynchronizer } from '@/shared/uiKit/chart/universalChart/hover/composableHover/sync/BoundsSynchronizer'
import { useRoute } from 'vue-router'
import { getRegionDayChangeHourOffset } from '@/shared/game/comp7/utils'
import { useElementBounding, useElementSize, useWindowSize } from '@vueuse/core'


const route = useRoute()
const isZoom = computed(() => route.query['ab'] == 'zoom')
const loading = ref(true)

const scoreTooltip = ref<HTMLElement | null>(null)
const battleTooltip = ref<HTMLElement | null>(null)
const battleChartElement = ref<HTMLElement | null>(null)

const { width: windowWidths } = useWindowSize({ includeScrollbar: false })
const { width: scoreWidth } = useElementSize(scoreTooltip, undefined, { box: 'border-box' })
const { width: battleWidth } = useElementSize(battleTooltip, undefined, { box: 'border-box' })
const battleChartBounding = useElementBounding(battleChartElement)


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

function tooltipPosition(ctx: TooltipCtx, tooltipWidth: number = 0) {
  const PADDING = 10

  if (ctx.isTouch) {
    const x = Math.min(Math.max(ctx.absolutePivot.x - tooltipWidth / 2, PADDING), windowWidths.value - tooltipWidth - PADDING)
    return `translate(calc(${x}px), calc(${ctx.absolutePivot.y}px - 100% - 10px))`
  }

  else return `translate(${ctx.absolutePivot.x + 5}px, ${ctx.absoluteCursor.y + 5}px)`
}

function tooltipPosition2(ctx: TooltipCtx, tooltipWidth: number = 0) {
  // if (ctx.isTouch) 
  const PADDING = 10

  // const x = Math.min(Math.max(ctx.absolutePivot.x - tooltipWidth / 2, PADDING), windowWidths.value - tooltipWidth - PADDING)
  // return `translate(calc(${x}px), calc(${ctx.absolutePivot.y}px - 100% - 10px))`

  const x = Math.min(Math.max(ctx.absolutePivot.x - tooltipWidth / 2, battleChartBounding.left.value), battleChartBounding.right.value - tooltipWidth - 5)
  return `translate(calc(${x}px), ${ctx.absoluteChartBox.top - 40}px)`

  return `translate(${ctx.absolutePivot.x + 5}px, ${ctx.absoluteCursor.y + 5}px)`
}

function tooltipDate(ctx: TooltipCtx) {
  return new Date(startTime + ctx.nearestDataPoints[0].xValue * 1000).toLocaleString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).replace(',', '')
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

watchEffect(() => {
  const score = data.value.data.map(point => point.rating == 0 ? null : {
    x: (new Date(point.recalculationTime + 'Z').getTime() - startTime) / 1000,
    y: point.rating
  })

  scoreChart.setPoints(score)

  const battles = data.value.data.map(point => point.battlesCount == 0 ? null : {
    x: (new Date(point.recalculationTime + 'Z').getTime() - startTime) / 1000,
    y: point.battlesCount
  })

  battleChart.setPoints(battles)
})

// setInterval(() => {
//   scoreChart2.setRenderBounds({
//     minX: (1 + Math.sin(Date.now() / 1000)) * 200 - 200,
//     maxX: (1 + Math.cos(Date.now() / 1000)) * 200 + 4000000,
//     minY: (1 + Math.cos(Date.now() / 1000)) * 50 + 5000,
//     maxY: (1 + Math.sin(Date.now() / 1000)) * 5000 + 10000,
//   })
// }, 16)

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

  @container (max-width: 800px) {
    flex-direction: column;
  }

  @container (max-width: 500px) {
    padding: 20px 10px;

    div.chart {
      aspect-ratio: 1.5 / 1;
    }
  }

  .tooltip {
    pointer-events: none;
    touch-action: none;
    position: absolute;
    background: rgba(16, 29, 51, 1);
    padding: 5px 8px;
    border-radius: 8px;
    font-size: 14px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-sizing: border-box;
    backdrop-filter: blur(10px);
    top: 0;
    left: 0;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.3);
    min-width: 140px;
    font-variant-numeric: tabular-nums;
  }

  .tooltip-2 {
    pointer-events: none;
    touch-action: none;
    position: absolute;
    // background: rgba(16, 29, 51, 1);
    padding: 0;
    font-size: 12px;
    box-sizing: border-box;
    top: 0;
    left: 0;
    font-variant-numeric: tabular-nums;
    display: flex;
    flex-direction: column;
    align-items: center;

    .data {
      font-size: 20px;
      line-height: 20px;
    }

    .date {
      font-size: 11px;
      font-weight: bold;
      color: rgba(255, 255, 255, 0.5);
    }
  }

  .chart {
    flex: 1;
    border-radius: 4px;
    aspect-ratio: 1.8 / 1;

    display: flex;
    flex-direction: column;

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: opacity 0.1s;

      .title {
        flex: 1;
      }

      h3 {
        margin: 0 0 10px 0;
        font-size: 16px;
      }

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
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s, filter 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  filter: blur(1px);
}
</style>