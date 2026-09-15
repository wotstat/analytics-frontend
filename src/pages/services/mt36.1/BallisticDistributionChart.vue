<template>
  <div class="ballistic-chart">
    <FloatingTooltip :ctx="tooltipCtx" :animated="true" :animation-omega="20" class="ballistic-distribution-tooltip"
      v-slot="{ ctx }">
      <div class="tooltip-content">
        <h4><span class="mono-num">{{ Math.round(ctx.hit.datum.x * 100) }}</span>% сведения</h4>
        <p class="tooltip-description">{{ variant === 'cdf' ? 'Снарядов попало:' : 'Плотность попаданий:' }}</p>

        <div class="tooltip-series" v-for="item in enabledTooltipSeries" :key="item.tag">
          <span class="series-marker" :class="[
            `${item.tag}-marker`,
            { highlighted: isTooltipSeriesHighlighted(ctx, item.tag) },
          ]"></span>
          <span>{{ item.name }}</span>
          <b>{{ tooltipValue(ctx, item.tag) }}</b>
        </div>
      </div>
    </FloatingTooltip>

    <Legend :legend="legend" class="legend" toggleable highlightable />
    <UniversalChartComponent :chart="chart" />
  </div>
</template>


<script setup lang="ts">
import FloatingTooltip from '@/shared/ui/chart/FloatingTooltip.vue'
import Legend from '@/shared/ui/chart/Legend.vue'
import { useLegend } from '@/shared/ui/chart/useLegend'
import UniversalChartComponent from '@/shared/uiKit/chart/universalChart/UniversalChart.vue'
import { TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { computed, watch } from 'vue'
import {
  BallisticDistributionRow,
  BallisticDistributionVariant,
  buildBallisticDistributionSeries,
} from './ballisticDistribution'
import {
  BallisticDistributionGroup,
  BallisticDistributionHit,
  useBallisticDistributionChart,
} from './useBallisticDistributionChart'

const props = defineProps<{
  rows: readonly BallisticDistributionRow[]
  leftVersions: ReadonlySet<string>
  rightVersions: ReadonlySet<string>
  leftLabel: string
  rightLabel: string
  variant: BallisticDistributionVariant
}>()

const emit = defineEmits<{
  'hover:progress': [number | null]
}>()

const series = computed(() => [
  { name: props.leftLabel || 'Группа №1', color: '#4a90e2', tag: 'left' as const },
  { name: props.rightLabel || 'Группа №2', color: '#50e3c2', tag: 'right' as const },
])
const legend = useLegend(series)
const data = computed(() => buildBallisticDistributionSeries(
  props.rows,
  props.leftVersions,
  props.rightVersions,
  props.variant,
))

const { chart, tooltipCtx, lineHighlight } = useBallisticDistributionChart({
  data,
  enabledSeries: legend.enabledTags,
  highlightSync: legend.highlightSync,
})

const enabledTooltipSeries = computed(() => series.value.filter(item => legend.enabledTags.value.includes(item.tag)))

function tooltipValue(ctx: TooltipCtx<BallisticDistributionHit>, series: BallisticDistributionGroup) {
  const hit = ctx.hits.find(hit => hit.datum.series === series)
  if (!hit) return '-'

  const value = hit.datum.y

  if (props.variant === 'pdf') return `${value.toFixed(3)}%`
  return `${value.toFixed(1)}%`
}

function isTooltipSeriesHighlighted(ctx: TooltipCtx<BallisticDistributionHit>, series: BallisticDistributionGroup) {
  const hit = ctx.hits.find(hit => hit.datum.series === series)
  return hit ? ctx.isHighlighted(hit, lineHighlight) : false
}

watch(tooltipCtx, ctx => emit('hover:progress', ctx?.hit.datum.x ?? null))
</script>

<style lang="scss">
.ballistic-distribution-tooltip {
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

    &.left-marker {
      background: #4a90e2;
    }

    &.right-marker {
      background: #50e3c2;
    }
  }
}

.ballistic-chart {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  padding-top: 5px;
  gap: 20px;

  .legend {
    justify-content: center;
    font-size: 14px;
  }

  :deep(.chart-container) {
    position: relative;
    flex: 1;
    min-height: 0;

    .y-labels,
    .x-labels {
      color: rgba(255, 255, 255, 0.9);
      font-size: 12px;
    }

    .ticks {
      opacity: 0.2;

      .tick,
      .plot-area-border path {
        stroke: white;
      }
    }

    .distribution-line.line {
      fill: none;
      stroke-width: 3px;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition: stroke-width 0.15s;
    }

    .distribution-line.line.highlighted,
    .distribution-line.highlighted>.line {
      stroke-width: 4px;
    }

    .left-line {
      stroke: #4a90e2;
    }

    .right-line {
      stroke: #50e3c2;
    }

    .interactive-zone {
      cursor: crosshair;
    }
  }
}
</style>
