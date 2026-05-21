<template>
  <div class="charts">
    <div class="chart">
      <h3>Очки по дням</h3>
      <Chart ref="chartElement" />
    </div>
    <div class="chart">
      <h3>Бои по дням</h3>
      <Chart />
      <input type="range" min="-100" max="100" step="0.01" v-model.number="yOffset" />
      <input type="number" v-model.number="yOffset" />
      <input type="range" min="0" max="80" step="0.001" v-model.number="yScale" />

      <hr>
      <input type="range" min="-1000" max="1000" v-model.number="offset" />
      <input type="number" v-model.number="offset" />
      <input type="range" min="0" max="80" step="0.001" v-model.number="xScale" />
    </div>
  </div>
</template>


<script setup lang="ts">
import Chart from '@/shared/uiKit/chart/Chart.vue'
import { AutoLabels } from '@/shared/uiKit/chart/plugins/plots/multiLine/labels/autoLabels/AutoLabels'
import { arrayGenerator } from '@/shared/uiKit/chart/plugins/plots/multiLine/labels/autoLabels/generators/arrayGenerator'
import { steppedOverrides } from '@/shared/uiKit/chart/plugins/plots/multiLine/labels/autoLabels/generators/steppedGenerator'
import { MultiLineChart } from '@/shared/uiKit/chart/plugins/plots/multiLine/MultiLine'
import { SimpleLine } from '@/shared/uiKit/chart/plugins/plots/multiLine/plot/line/SimpleLine'
import { TicksByLabels } from '@/shared/uiKit/chart/plugins/plots/multiLine/ticks/TicksByLabels'
import { onMounted, ref, watchEffect } from 'vue'


const chartElement = ref<InstanceType<typeof Chart> | null>(null)

const props = defineProps<{}>()
const offset = ref(0)
const yOffset = ref(0)
const yScale = ref(1)
const xScale = ref(1)

onMounted(() => {
  if (!chartElement.value) return

  const chart = chartElement.value.chart

  const multiLine = new MultiLineChart({})

  const autoLabelsX = new AutoLabels('horizontal', {
    labelForValue: (v, step) => step < 7 && v == 500 ? `${v.toFixed(10)}` : `${v.toFixed(0)}`,
    padding: 15,
    values: [
      // {
      //   gen: arrayGenerator([0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]),
      //   labelForValue: v => v == 500 ? `${v.toFixed(10)}` : `${v.toFixed(0)}`,
      // },
      ...steppedOverrides({
        step: [1, 2, 5, 10, 25, 50, 100, 200, 250, 500],
        offset: 0,
      })
    ],
    strategy: 'classic-flow',
    // strategy: 'classic',
    // strategy: {
    //   type: 'interval',
    //   placement: 'middle',
    //   fit: true,
    //   offset: [5, 5],
    // },
    // from: 0,
    // to: 1000
    // strategy: {
    //   type: 'interval',
    //   placement: 'middle',
    //   fit: true,
    //   offset: [0, 0],
    // },
    // from: 200, to: 800
  })

  const autoLabelsY = new AutoLabels('vertical', {
    labelForValue: (v, step) => `${v.toFixed(0)}`,
    padding: 15,
    values: [
      // arrayGenerator([-200, -180, -160, -140, -120, -100, -80, -60, -40, -20, 0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200]),
      ...steppedOverrides({
        step: [1, 2, 5, 10, 25, 50, 100, 200, 250, 500],
        offset: 0,
      }),
    ],
    strategy: 'classic-flow',
    // strategy: {
    //   type: 'interval',
    //   placement: 'end',
    //   fit: true,
    //   offset: [5, 5],
    // },
    // from: -50, to: 50
  })

  const sinLine = new SimpleLine(new Array(1000).fill(0).map((_, i) => ({ x: i, y: Math.sin(i / 10) * 50 + 50 })), ['sin'])
  const randomLine = new SimpleLine(new Array(100).fill(0).map((_, i) => ({ x: i * 10, y: 20 + Math.random() * 50 })), ['random'])
  const redLine = new SimpleLine([
    { x: 0, y: 0 },
    { x: 0, y: 100 },
    { x: 1000, y: 100 },
    { x: 1000, y: 0 },
    { x: 0, y: 0 },
  ], ['red'])

  const xTicks = new TicksByLabels(autoLabelsX)
  const yTicks = new TicksByLabels(autoLabelsY)

  multiLine.setXTicks(xTicks)
  multiLine.setYTicks(yTicks)
  multiLine.setXLabels(autoLabelsX)
  multiLine.setYLabels(autoLabelsY)
  multiLine.addPlot(sinLine)
  multiLine.addPlot(randomLine)
  // multiLine.addLine(redLine)

  chart.addPlugin(multiLine)

  // setInterval(() => {
  //   multiLine.setRenderBounds({
  //     minX: (1 + Math.sin(Date.now() / 1000)) * 200 - 200,
  //     maxX: (1 + Math.cos(Date.now() / 1000)) * 200 + 900,
  //     minY: (1 + Math.cos(Date.now() / 1000)) * 50 - 100,
  //     maxY: (1 + Math.sin(Date.now() / 1000)) * 50 + 100,
  //   })
  // }, 16)

  watchEffect(() => {
    multiLine.setRenderBounds({
      minX: -offset.value,
      maxX: -offset.value + 1000 / xScale.value,
      minY: 0 + yOffset.value,
      maxY: yOffset.value + 100 / yScale.value,
    })
  })

})
</script>


<style lang="scss" scoped>
.charts {
  display: flex;
  gap: 20px;
  padding: 20px 20px;
  cursor: default;

  .chart {
    flex: 1;
    background-color: rgba(0, 0, 0, 0.602);
    padding: 10px;
    border-radius: 4px;
    aspect-ratio: 2 / 1;

    display: flex;
    flex-direction: column;

    h3 {
      margin: 0 0 10px 0;
      font-size: 16px;
    }

    :deep(.chart-multiline-root) {
      // useless rule to syntax highlight fix
      background: inherit;

      .labels {
        .y-labels {
          .label {
            text-anchor: end;
          }
        }

        .label {
          color: rgb(255, 255, 255);
          font-size: 14px;
          font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
        }
      }

      .ticks {
        .tick {
          stroke: rgba(255, 255, 255, 0.3);
          stroke-width: 1px;
        }

        .x-ticks {
          .tick {
            stroke-dasharray: 3px 8px;
            stroke-linecap: round;
          }
        }

        .y-ticks {
          .tick {
            stroke: rgba(255, 255, 255, 0.15);
          }
        }
      }

      .line {
        stroke-width: 2px;

        &.sin {
          stroke: rgb(24, 169, 247);
        }

        &.random {
          stroke-width: 1px;
          stroke: rgb(255, 153, 0);
        }

        &.red {
          stroke-width: 1px;
          stroke: rgb(255, 0, 0);
        }
      }
    }
  }
}
</style>