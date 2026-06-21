<template>
  <div class="charts">
    <div class="chart">
      <div class="header">
        <div class="title">
          <h3>Очки по дням</h3>
        </div>
        <IntervalSelector v-if="!isZoom" />
      </div>
      <UniversalChartComponent :chart="scoreChart" />
    </div>
    <div class="chart">
      <div class="header">
        <div class="title">
          <h3>Бои по дням</h3>
        </div>
        <IntervalSelector v-if="!isZoom" />
      </div>
      <UniversalChartComponent :chart="battleChart" />
    </div>

    <div class="tooltip" :style="{ transform: tooltipPosition(scoreChart.tooltipCtx.value) }"
      v-if="scoreChart.tooltipCtx.value">
      <p>{{ new Date(startTime + scoreChart.tooltipCtx.value?.nearestDataPoints[0].xValue *
        1000).toLocaleString(undefined, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).replace(',', '') }}
      </p>
      <div class="data flex">
        <p class="flex-1">Очки:</p>
        <p class="bold">{{ scoreChart.tooltipCtx.value?.nearestDataPoints[0].yValue }}</p>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { computed, markRaw, watchEffect } from 'vue'
import UniversalChartComponent from '@/shared/uiKit/chart/universalChart/UniversalChart.vue'
import { dateToDbDate, queryComputed } from '@/db'
import { BattlesChart, ScoreChart } from './Charts'

import IntervalSelector from './intervalSelector/IntervalSelector.vue'
import { TooltipCtx } from '@/shared/uiKit/chart/universalChart/hover/composableHover/components/chartTooltip/ChartTooltip'
import { useRoute } from 'vue-router'


const route = useRoute()
const isZoom = computed(() => route.query['ab'] == 'zoom')


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
        where recalculationTime between START_DATE and END_DATE and region = '${props.region}'
        group by recalculationTime
        order by recalculationTime
    ),
    player as (
        select recalculationTime, rank, rating, battlesCount
        from Comp7Leaderboard
        where region = '${props.region}' and
            bdid = ${props.bdid} and
            recalculationTime between START_DATE and END_DATE
        order by recalculationTime
    )
  select *
  from player
  right join recalculation using recalculationTime
`)

function tooltipPosition(ctx: TooltipCtx) {
  if (ctx.isTouch)
    return `translate(calc(${ctx.pivot.x}px - 50%), calc(${ctx.pivot.y}px - 100% - 10px))`

  return `translate(${ctx.pivot.x + 5}px, ${ctx.absoluteCursor.y + 5}px)`
}


const MINUTE = 1 * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24

const startTime = props.seasonInterval.start.getTime()
// const endTime = new Date(props.seasonInterval.end).getTime()


const scoreChart = markRaw(new ScoreChart(props.seasonInterval))
const battleChart = markRaw(new BattlesChart(props.seasonInterval))

watchEffect(() => {
  const score = data.value.data.map(point => point.rating == 0 ? null : {
    x: (new Date(point.recalculationTime + 'Z').getTime() - startTime) / 1000,
    y: point.rating
  })

  scoreChart.setPoints(score).setInterval(props.seasonInterval)

  const battles = data.value.data.map(point => point.battlesCount == 0 ? null : {
    x: (new Date(point.recalculationTime + 'Z').getTime() - startTime) / 1000,
    y: point.battlesCount
  })

  battleChart.setPoints(battles).setInterval(props.seasonInterval)
})
</script>


<style lang="scss" scoped>
.charts {
  display: flex;
  gap: 30px;
  padding: 20px 30px;
  padding-top: 0;
  cursor: default;

  @container (max-width: 800px) {
    flex-direction: column;
  }

  @container (max-width: 500px) {
    padding: 20px 10px;
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

  .chart {
    flex: 1;
    border-radius: 4px;
    aspect-ratio: 2 / 1;

    display: flex;
    flex-direction: column;

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;

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
</style>