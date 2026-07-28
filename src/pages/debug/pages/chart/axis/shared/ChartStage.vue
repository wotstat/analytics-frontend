<template>
  <div class="chart-stage debug-stage">
    <p class="stage-caption debug-hint" v-if="caption">{{ caption }}</p>
    <div class="chart-host" ref="host" :style="hostStyle"></div>
  </div>
</template>


<script setup lang="ts">
import { computed, onMounted, onUnmounted, useTemplateRef, watch } from 'vue'
import type { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'

const props = withDefaults(defineProps<{
  chart: UniversalChart
  width?: number | null
  height?: number
  caption?: string
  resizable?: boolean
}>(), {
  width: null,
  height: 200,
  resizable: false,
})

const host = useTemplateRef<HTMLDivElement>('host')

const hostStyle = computed(() => ({
  width: props.width === null ? '100%' : `${props.width}px`,
  height: `${props.height}px`,
  resize: props.resizable ? ('both' as const) : ('none' as const),
}))

watch(() => props.chart, (next, previous) => {
  previous.dispose()
  if (host.value) next.attach(host.value)
})

onMounted(() => {
  if (host.value) props.chart.attach(host.value)
})

onUnmounted(() => {
  props.chart.dispose()
})
</script>


<style scoped lang="scss">
.chart-stage {
  overflow-x: auto;
}

.stage-caption {
  margin: 0 0 0.5em;
  text-align: center;
}

.chart-host {
  position: relative;
  margin: 0 auto;
  overflow: hidden;
  min-width: 40px;
  min-height: 60px;
}

// Движок не приносит своих цветов: у `.tick` в style.scss нет ни stroke, ни ширины,
// поэтому без этих правил тики просто не видны.
:deep(.universal-chart-root) {
  color: rgba(255, 255, 255, 0.75);
  font-size: 11px;

  .chart-axis path {
    fill: none;
    stroke: rgba(255, 255, 255, 0.5);
    stroke-width: 1px;
  }

  .tick {
    stroke: rgba(255, 255, 255, 0.16);
    stroke-width: 1px;
  }

  .zero-line .tick {
    stroke: rgba(255, 130, 130, 0.7);
    stroke-dasharray: 4 3;
  }

  .label {
    fill: rgba(255, 255, 255, 0.85);
    font-weight: 500;
  }

  .main-line {
    fill: none;
    stroke: var(--blue-color);
    stroke-width: 2px;
  }

  .debug-bars {
    .dataset:nth-child(1) .bar {
      fill: rgba(2, 175, 255, 0.55);
    }

    .dataset:nth-child(2) .bar {
      fill: rgba(255, 190, 80, 0.5);
    }

    .dataset:nth-child(3) .bar {
      fill: rgba(150, 230, 150, 0.45);
    }
  }
}
</style>
