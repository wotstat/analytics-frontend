<template>
  <div class="comparison-bar-chart">
    <FloatingTooltip :ctx="tooltipCtx" :animated="true" :animation-omega="20" class="comparison-bar-tooltip"
      v-slot="{ ctx }">
      <div class="tooltip-content">
        <h4>{{ tooltipTitle(ctx.hit.category ?? '') }}</h4>

        <div class="tooltip-series" v-for="hit in ctx.hits" :key="hit.datum.series">
          <span class="series-marker" :class="[
            `${hit.datum.series}-marker`,
            { highlighted: ctx.isHighlighted(hit, barHighlight) },
          ]"></span>
          <span>{{ labelForSeries(hit.datum.series) }}</span>
          <b>{{ tooltipValue(ctx, hit) }}</b>
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
import { computed, markRaw, watchEffect } from 'vue'
import {
  ComparisonBarChart,
  ComparisonBarChartData,
  ComparisonBarHit,
  ComparisonSeries,
} from './ComparisonBarChart'

const props = withDefaults(defineProps<{
  data: ComparisonBarChartData
  leftLabel: string
  rightLabel: string
  tooltipTitle: (label: string | number) => string
  valueFormatter: (value: number) => string
  yLabelFormatter?: (value: number) => string
  ySteps?: readonly number[]
  minY?: number
  showYLabels?: boolean
  showDelta?: boolean
}>(), {
  minY: 0,
  showYLabels: false,
  showDelta: false,
})

const series = computed(() => [
  { name: props.leftLabel || 'Группа №1', color: '#4a90e2', tag: 'left' as const },
  { name: props.rightLabel || 'Группа №2', color: '#50e3c2', tag: 'right' as const },
])
const legend = useLegend(series)
const chart = markRaw(new ComparisonBarChart({
  highlightSync: legend.highlightSync,
}))
const tooltipCtx = chart.tooltipCtx
const barHighlight = chart.highlight

watchEffect(() => chart.update({
  data: props.data,
  enabledSeries: legend.enabledTags.value,
  showYLabels: props.showYLabels,
  minY: props.minY,
  ySteps: props.ySteps,
  yLabelFormatter: props.yLabelFormatter,
}))

function labelForSeries(series: ComparisonSeries) {
  return series === 'left' ? seriesLabel(props.leftLabel, 'Группа №1') : seriesLabel(props.rightLabel, 'Группа №2')
}

function seriesLabel(label: string, fallback: string) {
  return label || fallback
}

function tooltipValue(ctx: TooltipCtx<ComparisonBarHit>, hit: ComparisonBarHit) {
  const value = props.valueFormatter(hit.value)
  if (!props.showDelta) return value

  const minValue = Math.min(...ctx.hits.map(hit => hit.value))
  const delta = hit.value - minValue
  return value + (delta > 0 ? ` | +${props.valueFormatter(delta)}` : '')
}
</script>

<style lang="scss">
.comparison-bar-tooltip {
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

    &.left-marker {
      background: #4a90e2;
    }

    &.right-marker {
      background: #50e3c2;
    }
  }
}

.comparison-bar-chart {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: 12px;

  .legend {
    justify-content: center;
    font-size: 13px;
  }

  :deep(.chart-container) {
    position: relative;
    flex: 1;
    min-height: 0;

    .x-labels,
    .y-labels {
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

    .bar {
      transition: filter 0.15s, opacity 0.15s;
    }

    .left-bars {
      fill: #4a90e2;

      &.highlighted {
        filter: brightness(1.2);
      }
    }

    .right-bars {
      fill: #50e3c2;

      &.highlighted {
        filter: brightness(1.2);
      }
    }

    .interactive-zone {
      cursor: crosshair;
    }
  }
}
</style>
