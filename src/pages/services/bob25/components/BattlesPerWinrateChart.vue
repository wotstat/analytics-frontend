<template>
  <div class="winrate-chart">
    <FloatingTooltip :ctx="tooltipCtx" :animated="true" :animation-omega="20" class="winrate-chart-tooltip"
      v-slot="{ ctx }">
      <div class="tooltip-content">
        <h4>Винрейт: {{ ctx.hit.category }}%</h4>
        <p>Боёв: {{ formatPercent(ctx.hit.value) }}</p>
      </div>
    </FloatingTooltip>

    <UniversalChartComponent :chart="chart" />
  </div>
</template>

<script setup lang="ts">
import FloatingTooltip from '@/shared/ui/chart/FloatingTooltip.vue'
import UniversalChartComponent from '@/shared/uiKit/chart/universalChart/UniversalChart.vue'
import type { HoverSynchronizer } from '@/shared/uiKit/chart/universalChart/interaction/composable/sync/HoverSynchronizer'
import { markRaw, watchEffect } from 'vue'
import { BattlesPerWinrateChart } from './BattlesPerWinrateChart'

const props = defineProps<{
  data: number[]
  color: string
  hoverSync: HoverSynchronizer
}>()

const chart = markRaw(new BattlesPerWinrateChart({ color: props.color, hoverSync: props.hoverSync }))
const tooltipCtx = chart.tooltipCtx

watchEffect(() => chart.setData(props.data))

function formatPercent(value: number) {
  return `${Math.round(value * 10000) / 100}%`
}
</script>

<style lang="scss">
.winrate-chart-tooltip {
  --popover-background-color: rgba(0, 0, 0, 0.85);
  --popover-border-color: rgba(255, 255, 255, 0.1);

  .popover-background {
    border-radius: 5px;
  }
}
</style>

<style lang="scss" scoped>
.tooltip-content {
  padding: 6px 8px;

  h4,
  p {
    margin: 0;
    color: white;
    line-height: 1;
  }

  h4 {
    margin-bottom: 5px;
    font-size: 13px;
  }

  p {
    font-size: 12px;
  }
}

.winrate-chart {
  position: relative;
  aspect-ratio: 1;

  :deep(.chart-container) {
    position: absolute;
    inset: 0;

    .x-labels {
      color: rgba(255, 255, 255, 0.87);
      font-size: 12px;
      font-weight: 500;
    }

    .winrate-grid .tick {
      stroke: rgba(255, 255, 255, 0.05);
    }

    .winrate-center-grid .tick {
      stroke: rgba(255, 255, 255, 0.22);
      stroke-width: 1.5px;
    }

    .winrate-hover-line {
      stroke: rgba(255, 255, 255, 0.45);
    }

    .plot-area-border path {
      stroke: rgba(255, 255, 255, 0.1);
    }

    .winrate-bars .bar {
      fill: white;
      transition: opacity 0.15s;

      &.highlighted {
        opacity: 1;
      }
    }

    .interactive-zone {
      cursor: crosshair;
    }
  }
}

@media (max-width: 600px) {
  .winrate-chart {
    aspect-ratio: 1.8;
  }
}
</style>
