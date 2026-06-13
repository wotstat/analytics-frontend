<template>
  <div class="charts">
    <div class="chart">
      <h3>Очки по дням</h3>
      <UniversalChartComponent :chart="scoreChart" />
      <div class="tooltip"
        :style="{ transform: `translate(${scoreChart.tooltipCtx.value?.absolutePivot.x || 0 + 10}px, ${scoreChart.tooltipCtx.value?.absolutePivot.y || 0}px)` }"
        v-if="scoreChart.tooltipCtx.value">
        <!-- <p>{{ new Date(tooltipPos.nearestDataPoints[0].xValue).toLocaleString() }}</p> -->
        <p>{{ scoreChart.tooltipCtx.value?.nearestDataPoints[0].xValue }}</p>
        <p>{{ scoreChart.tooltipCtx.value?.nearestDataPoints[0].yValue }}</p>
      </div>
    </div>
    <div class="chart">
      <h3>Бои по дням</h3>
      <UniversalChartComponent :chart="battleChart" />
    </div>
  </div>
</template>


<script setup lang="ts">
import { Axis } from '@/shared/uiKit/chart/universalChart/axis/Axis'
import { AutoLabels } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { steppedOverrides } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/steppedGenerator'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { ChartTooltip, TooltipCtx } from '@/shared/uiKit/chart/universalChart/plot/hover/composableHover/components/chartTooltip/ChartTooltip'
import { VerticalLine } from '@/shared/uiKit/chart/universalChart/plot/hover/composableHover/components/lines/VerticalLine'
import { NearestMarker } from '@/shared/uiKit/chart/universalChart/plot/hover/composableHover/components/nearestMarker/NearestMarker'
import { ComposableHover } from '@/shared/uiKit/chart/universalChart/plot/hover/composableHover/ComposableHover'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { AutoMarkers } from '@/shared/uiKit/chart/universalChart/plot/markers/autoMarkers/AutoMarkers'
import { TicksByLabels } from '@/shared/uiKit/chart/universalChart/ticks/TicksByLabels'
import { ChartClip } from '@/shared/uiKit/chart/universalChart/defs/ChartClip'
import { ChartGradient } from '@/shared/uiKit/chart/universalChart/defs/ChartGradient'
import { ChartMask } from '@/shared/uiKit/chart/universalChart/defs/ChartMask'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import { markRaw, Ref, ref, watchEffect } from 'vue'
import UniversalChartComponent from '@/shared/uiKit/chart/universalChart/UniversalChart.vue'
import { dateToDbDate, queryComputed } from '@/db'
import { arrayGenerator } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/arrayGenerator'
import { BattlesChart, ScoreChart } from './Charts'

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


const MINUTE = 1 * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24

const startTime = new Date(props.seasonInterval.start).getTime()


const scoreChart = markRaw(new ScoreChart(props.seasonInterval))
const battleChart = markRaw(new BattlesChart(props.seasonInterval))

watchEffect(() => {
  const score = data.value.data.map(point => point.rating == 0 ? null : {
    x: (new Date(point.recalculationTime).getTime() - startTime) / 1000,
    y: point.rating
  })

  scoreChart.setPoints(score)

  const battles = data.value.data.map(point => point.battlesCount == 0 ? null : {
    x: (new Date(point.recalculationTime).getTime() - startTime) / 1000,
    y: point.battlesCount
  })

  battleChart.setPoints(battles)
})
</script>


<style lang="scss" scoped>
.charts {
  display: flex;
  gap: 30px;
  padding: 20px 30px;
  padding-top: 0;
  cursor: default;

  .chart {
    flex: 1;
    border-radius: 4px;
    aspect-ratio: 2 / 1;

    display: flex;
    flex-direction: column;

    h3 {
      margin: 0 0 10px 0;
      font-size: 16px;
    }

    .tooltip {
      pointer-events: none;
      position: absolute;
      background: rgba(38, 38, 38, 0.8);
      padding: 10px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.5);
      box-sizing: border-box;
      top: 0;
      left: 0;
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

      .x-ticks,
      .y-ticks {
        stroke: rgba(255, 255, 255, 0.1);
      }

      .hover {
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