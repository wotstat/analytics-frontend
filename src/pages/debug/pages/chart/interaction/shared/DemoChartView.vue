<template>
  <div class="demo-chart" :style="{ height: `${height ?? 240}px`, width: width }">
    <UniversalChartComponent :chart="chart" />
  </div>
</template>


<script setup lang="ts">
import UniversalChartComponent from '@/shared/uiKit/chart/universalChart/UniversalChart.vue'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'

defineProps<{
  chart: UniversalChart
  height?: number
  width?: string
}>()

</script>


<style scoped lang="scss">
.demo-chart {
  position: relative;
  max-width: 100%;

  :deep(.chart-container) {
    position: absolute;
    inset: 0;
  }

  :deep(.universal-chart-root) {
    font-size: 11px;
    color: #ffffff60;

    .main-line {
      stroke-width: 2px;
      fill: none;

      &.s0 {
        stroke: #02afff;
      }

      &.s1 {
        stroke: #57ff6e;
      }

      &.s2 {
        stroke: #ffb057;
      }
    }

    .ticks {
      opacity: 0.12;
    }

    .label {
      font-weight: bold;
      fill: #ffffff80;
    }

    .hover {
      .interactive-zone {
        cursor: crosshair;
      }

      &.pan-active .interactive-zone {
        cursor: grabbing;
      }

      .hover-line {
        stroke: #ffffff60;
      }

      .hover-marker {
        fill: #02afff;

        &.m1 {
          fill: #57ff6e;
        }

        &.m2 {
          fill: #ffb057;
        }
      }
    }
  }
}
</style>
