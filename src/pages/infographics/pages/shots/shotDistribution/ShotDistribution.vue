<template>
  <ServerStatusWrapper :status v-slot="{ showError, status }">
    <div class="chart-container" ref="container" v-if="status != 'error'">
      <FloatingTooltip :ctx="tooltipCtx" :animated="true" :animation-omega="20" class="shot-distribution-tooltip"
        v-slot="{ ctx }">
        <div class="tooltip-content">
          <h4><span class="mono-num">{{ ctx.hit.datum.x.toFixed(0) }}</span>% сведения</h4>
          <p class="tooltip-description">Снарядов попало:</p>

          <div class="tooltip-series" v-for="item in enabledTooltipSeries" :key="item.series">
            <span class="series-marker"
              :class="[`${item.series}-marker`, { highlighted: isTooltipSeriesHighlighted(ctx, item.series) }]"></span>
            <span>{{ item.label }}</span>
            <b>{{ tooltipValue(ctx, item.series) }}</b>
          </div>
        </div>
      </FloatingTooltip>

      <Legend :legend="legend" class="legend" toggleable highlightable />

      <UniversalChartComponent :chart="chart" />
    </div>

    <div class="flex flex-1 center pointer" v-else @click="showError">
      <p class="card-main-info error">!</p>
    </div>
  </ServerStatusWrapper>
</template>


<script setup lang="ts">
import { loading, mergeStatuses, queryAsync } from '@/db'
import ServerStatusWrapper from '@/pages/infographics/shared/ServerStatusWrapper.vue'
import { getQueryStatParamsCache, StatParams, whereClause } from '@/shared/query/useQueryStatParams'
import { useElementVisibility } from '@vueuse/core'
import { computed, useTemplateRef, watch } from 'vue'


import FloatingTooltip from '@/shared/ui/chart/FloatingTooltip.vue'
import Legend from '@/shared/ui/chart/Legend.vue'
import { useLegend } from '@/shared/ui/chart/useLegend'
import UniversalChartComponent from '@/shared/uiKit/chart/universalChart/UniversalChart.vue'
import { TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { ShotDistributionHit, ShotDistributionSeries, useShotDistributionChart } from './useShotDistributionChart'

const container = useTemplateRef<HTMLElement>('container')
const visible = useElementVisibility(container)

type LegendSeries = {
  name: string
  color: string
  tag: ShotDistributionSeries
}

const series: LegendSeries[] = [
  { name: 'Серверный', color: '#fbd080', tag: 'server' },
  { name: 'Клиентский', color: '#caffb7', tag: 'client' },
  { name: 'Общий', color: '#d3deff', tag: 'shared' },
]

const legend = useLegend(series)

const { params } = defineProps<{
  params: StatParams
}>()

const emit = defineEmits<{
  'hover:progress': [number | null]
}>()

function getQuery(isServer: boolean) {
  const r = isServer ? 'ballisticResultServer_r' : 'ballisticResultClient_r'
  return `
  select r,
       sum(count) over (rows between unbounded preceding and current row)        as cum,
       round(cum / (select count() from Event_OnShot ${whereClause(params)}), 3) as percent
  from (select round(if(${r} < 2, ${r}, 3), 2) as r, count() as count
      from Event_OnShot
      ${whereClause(params)}
      group by r
      having r <= 1
      order by r);`
}

type Row = { r: number, cum: number, percent: number }
function calc(data: Row[]) {
  const res: (number | null)[] = new Array(101).fill(null)

  for (const row of data) {
    res[Math.round(row.r * 100)] = row.percent * 100
  }

  if (data.length === 0) return res

  let lastValue = 0
  for (let i = 0; i < res.length; i++) {
    const value = res[i]
    if (value === null) res[i] = lastValue
    else lastValue = value
  }

  return res
}

const clientMarkerResult = queryAsync<Row>(getQuery(false), { enabled: visible, settings: getQueryStatParamsCache(params) })
const serverMarkerResult = queryAsync<Row>(getQuery(true), { enabled: visible, settings: getQueryStatParamsCache(params) })
const sharedClientResult = queryAsync<Row>(`
  select r,
       sum(count) over (rows between unbounded preceding and current row)        as cum,
       round(cum / (select count() from Event_OnShot 
          ${whereClause(params, { ignore: ['player', 'level', 'tanks', 'types', 'id'] })}
          ), 3) as percent
  from (select round(if(ballisticResultClient_r < 2, ballisticResultClient_r, 3), 2) as r, count() as count
      from Event_OnShot
      ${whereClause(params, { ignore: ['player', 'level', 'tanks', 'types', 'id'] })}
      group by r
      having r <= 1
      order by r);`, { enabled: visible, settings: getQueryStatParamsCache(params) })

const isLoadingClient = computed(() => clientMarkerResult.value.status === loading)
const isLoadingServer = computed(() => serverMarkerResult.value.status === loading)
const isSharedLoading = computed(() => sharedClientResult.value.status === loading)

const clientMarker = computed(() => calc(clientMarkerResult.value.data))
const serverMarker = computed(() => calc(serverMarkerResult.value.data))
const sharedClient = computed(() => calc(sharedClientResult.value.data))

const status = computed(() => mergeStatuses(clientMarkerResult.value.status, serverMarkerResult.value.status, sharedClientResult.value.status))
const { chart, tooltipCtx, lineHighlight } = useShotDistributionChart({
  serverMarker,
  clientMarker,
  sharedClient,
  enabledSeries: legend.enabledTags,
  highlightSync: legend.highlightSync,
})

const tooltipSeries = [
  { series: 'server', label: 'Серверный' },
  { series: 'client', label: 'Клиентский' },
  { series: 'shared', label: 'Общий' },
] as const

type TooltipSeries = typeof tooltipSeries[number]['series']
const enabledTooltipSeries = computed(() => tooltipSeries.filter(item => legend.enabledTags.value.includes(item.series)))

function tooltipValue(ctx: TooltipCtx<ShotDistributionHit>, series: TooltipSeries) {
  const hit = ctx.hits.find(hit => hit.datum.series === series)
  return hit ? `${Math.round(hit.datum.y)}%` : '-'
}

function isTooltipSeriesHighlighted(ctx: TooltipCtx<ShotDistributionHit>, series: TooltipSeries) {
  const hit = ctx.hits.find(hit => hit.datum.series === series)
  return hit ? ctx.isHighlighted(hit, lineHighlight) : false
}

watch(tooltipCtx, ctx => {
  if (ctx) emit('hover:progress', ctx.hit.datum.x / 100)
  else emit('hover:progress', null)
})

</script>

<style lang="scss">
.shot-distribution-tooltip {
  --popover-background-color: rgba(0, 0, 0, 0.85);
  --popover-border-color: rgba(255, 255, 255, 0.1);

  .popover-background {
    border-radius: 5px;
  }
}
</style>

<style lang="scss" scoped>
.tooltip-content {
  min-width: 150px;
  padding: 7px 8px;

  h4 {
    margin: 0;
    color: white;
    font-size: 13px;
    line-height: 1;
  }

  .tooltip-description {
    margin: 5px 0;
    color: rgba(255, 255, 255, 0.65);
    font-size: 12px;
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

    &.server-marker {
      background: #fbd080;
    }

    &.client-marker {
      background: #caffb7;
    }

    &.shared-marker {
      background: #d3deff;
    }
  }
}

.chart-container {
  flex: 1;
  min-height: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  padding-top: 5px;

  .legend {
    font-size: 14px;
    justify-content: center;
  }

  :deep(.chart-container) {
    flex: 1;
    min-height: 0;
    height: auto;
    position: relative;


    .y-labels {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.9);
    }

    .x-labels {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.9);
    }

    .ticks {
      opacity: 0.2;

      .tick {
        stroke: rgba(255, 255, 255, 1);
      }

      .plot-area-border path {
        stroke: rgba(255, 255, 255, 1);
      }

      .tick-level-1 {
        opacity: 0.2;
      }
    }

    .distribution-line.line {
      stroke-width: 2px;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: none;
      transition: stroke-width 0.15s;
    }

    .distribution-line.line.highlighted,
    .distribution-line.highlighted>.line {
      stroke-width: 3px;
    }

    .server-line {
      stroke: #ffe3ae;
      filter: drop-shadow(0px 0px 2px #f78008b9);
    }

    .client-line {
      stroke: #f1ffec;
      filter: drop-shadow(0px 0px 2px #639e31b9);
    }

    .shared-line {
      stroke: #eff3ff;
      filter: drop-shadow(0px 0px 2px #5149c6b9);
    }

    .interactive-zone {
      cursor: crosshair;
    }
  }
}
</style>
