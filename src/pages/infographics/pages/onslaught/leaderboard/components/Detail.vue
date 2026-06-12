<template>
  <div class="charts">
    <div class="chart">
      <h3>Очки по дням</h3>
      <UniversalChartComponent :chart="scoreChart.chart" />
      <div class="tooltip"
        :style="{ transform: `translate(${scoreTooltip.absolutePivot.x + 10}px, ${scoreTooltip.absolutePivot.y}px)` }"
        v-if="scoreTooltip">
        <!-- <p>{{ new Date(tooltipPos.nearestDataPoints[0].xValue).toLocaleString() }}</p> -->
        <p>{{ scoreTooltip.nearestDataPoints[0].xValue }}</p>
        <p>{{ scoreTooltip.nearestDataPoints[0].yValue }}</p>
      </div>
    </div>
    <div class="chart">
      <h3>Бои по дням</h3>
      <UniversalChartComponent :chart="battleChart.chart" />
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

const scoreTooltip = ref<TooltipCtx | null>(null)
const battleTooltip = ref<TooltipCtx | null>(null)


const MINUTE = 1 * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24

const startTime = new Date(props.seasonInterval.start).getTime()


function createChart(tooltip: Ref<TooltipCtx | null>) {

  const clipMain = new ChartClip('center')
  const clipLeft = new ChartClip('left')
  const clipBottom = new ChartClip('bottom')
  const maskMain = new ChartMask('center')

  const chart = markRaw(new UniversalChart({
    layoutVariant: 'horizontal',
    renderBoundsPadding: { vertical: 5 }
  }))

  const labelsX = new AutoLabels('horizontal', {
    padding: 5,
    labelOffset: 10,
    values: [
      ...steppedOverrides({
        step: [DAY, 2 * DAY, 7 * DAY],
      })
    ],
    strategy: { type: 'interval', },
    from: 0,
  }).clipBy(clipBottom)

  const labelsY = new AutoLabels('vertical', {
    labelForValue: (v, step) => `${v.toFixed(0)}`,
    padding: {
      clip: 10,
      flow: 5,
    },
    labelOffset: 5,
    values: [
      ...steppedOverrides({
        step: [1, 2, 5, 10, 25, 50, 100, 200, 250, 500],
        offset: 0,
      }),
    ],
    strategy: { type: 'interval', },
    // from: 2650
  }).clipBy(clipLeft)

  const gradient = new ChartGradient({ classes: 'blue-gradient' })
  const line = new AutoLine({ classes: 'main-line', area: gradient, smoothingMethod: 'monotone' })

  const plotRoot = new PlotGroup()
    .addPlot(line.maskBy(maskMain))
    .clipBy(clipMain)

  const hover = new ComposableHover('hover')
    .addComponent(new VerticalLine({
      offset: { end: 0.5 },
      position: 'data-point-x',
    }))
    .addComponent(new NearestMarker({
      classes: 'markers',
      markerClasses: 'hover-marker',
      size: 4,
      maskSize: 6,
      classesForDataSource: ['m1', 'm2'],
      targetMasks: [maskMain.root],
      position: 'data-point-x',
    }))
    .addComponent(new ChartTooltip({
      position: 'data-point-x',
      tooltipPivot: 'avg',
      onHide: () => tooltip.value = null,
      onPositionChange: ctx => tooltip.value = ctx,
    }))

  chart
    .addPlot(new TicksByLabels(labelsX, { start: 0 }), 'ticks')
    .addPlot(new TicksByLabels(labelsY, { start: 0 }), 'ticks')
    .addPlot(plotRoot, 'plot')
    .addSlot('bottom', labelsX, 'labels')
    .addSlot('left', labelsY, 'labels')
    .addPlot(hover)
    .addDefs(gradient, clipMain, clipLeft, clipBottom, maskMain)

  return { chart, labelsX, labelsY, line, hover }
}

const scoreChart = createChart(scoreTooltip)
const battleChart = createChart(battleTooltip)


watchEffect(() => {
  const score = data.value.data.map(point => point.rating == 0 ? null : {
    x: (new Date(point.recalculationTime).getTime() - startTime) / 1000,
    y: point.rating
  })
  console.log(score)

  scoreChart.line.setPoints(score)
  scoreChart.hover.setDataSources(score)
  scoreChart.chart.setRenderBounds({
    minX: 0,
    minY: 2650,
    // maxX: (new Date(props.seasonInterval.end).getTime() - startTime) / 1000,
  })

  const battles = data.value.data.map(point => point.battlesCount == 0 ? null : {
    x: (new Date(point.recalculationTime).getTime() - startTime) / 1000,
    y: point.battlesCount
  })
  battleChart.line.setPoints(battles)
  battleChart.hover.setDataSources(battles)
  battleChart.chart.setRenderBounds({
    minX: 0,
    minY: 0,
    // maxX: (new Date(props.seasonInterval.end).getTime() - startTime) / 1000,
  })
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