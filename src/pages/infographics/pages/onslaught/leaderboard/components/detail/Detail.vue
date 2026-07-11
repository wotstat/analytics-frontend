<template>
  <div class="charts" :class="{ 'loading': loading }">

    <div class="chart">
      <HeaderTooltip :ctx="scoreChart.tooltipCtx.value">
        <template #left>
          <h3>Очки по дням</h3>
        </template>

        <template #right>
          <IntervalSelector v-if="!isZoom" :seasonInterval="props.seasonInterval" v-model="selectedInterval" />
        </template>

        <template #tooltip="{ ctx }">
          <div class="tooltip-container">
            <p class="value">{{ ctx.nearestDataPoints[0].yValue }}</p>
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
          <IntervalSelector v-if="!isZoom" :seasonInterval="props.seasonInterval" v-model="selectedInterval" />
        </template>

        <template #tooltip="{ ctx }">
          <div class="tooltip-container">
            <p class="value">{{ ctx.nearestDataPoints[0].yValue }}</p>
            <p class="date">{{ tooltipDate(ctx) }}</p>
          </div>
        </template>
      </HeaderTooltip>
      <UniversalChartComponent :chart="battleChart" />
    </div>
  </div>
</template>


<script setup lang="ts">
import { computed, markRaw, ref, watch, watchEffect } from 'vue'
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

const route = useRoute()
const isZoom = computed(() => route.query['ab'] == 'zoom')
const loading = ref(true)

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

const selectedInterval = ref<SelectedInterval | null>(null)

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

watch(() => selectedInterval.value, value => {
  scoreChart.setViewInterval(value)
  battleChart.setViewInterval(value)
})

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
  }

}
</style>