<template>
  <div class="chart-stage debug-stage">
    <div class="chart-box" :class="{ resizable }" :style="{ height: `${height}px` }">
      <UniversalChartComponent :chart="chart" :key="version" />
    </div>

    <slot></slot>
  </div>
</template>


<script setup lang="ts">
import UniversalChartComponent from '@/shared/uiKit/chart/universalChart/UniversalChart.vue'
import type { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'

withDefaults(defineProps<{
  chart: UniversalChart
  version?: number
  height?: number
  resizable?: boolean
}>(), { version: 0, height: 240, resizable: false })

</script>


<style scoped lang="scss">
.chart-stage {
  padding: 0.75em;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}

.chart-box {
  position: relative;
  width: 100%;
  min-width: 0;
  border-radius: 4px;
  background: #0000004d;

  &.resizable {
    resize: both;
    overflow: hidden;
    max-width: 100%;
    min-width: 100px;
    min-height: 60px;
  }

  :deep(.chart-container) {
    position: absolute;
    inset: 0;
  }
}

:deep(.universal-chart-root) {
  .series-a {
    color: #38b6ff;
  }

  .series-b {
    color: #ffb02e;
  }

  .series-c {
    color: #6ee7a0;
  }

  .series-d {
    color: #ff7a7a;
  }

  .series-e {
    color: #c58cff;
  }

  .line {
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .area.solid-area {
    fill: currentColor;
    fill-opacity: 0.18;
    stroke: none;
  }
}
</style>
