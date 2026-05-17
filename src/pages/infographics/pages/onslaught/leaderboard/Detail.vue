<template>
  <div class="charts">
    <div class="chart">
      <h3>Очки по дням</h3>
      <Chart ref="chartElement" />
    </div>
    <div class="chart">
      <h3>Бои по дням</h3>
      <Chart />
      <input type="range" min="-1000" max="1000" v-model.number="offset" />
      <input type="number" v-model.number="offset" />
      <input type="range" min="0" max="80" step="0.001" v-model.number="scale" />
    </div>
  </div>
</template>


<script setup lang="ts">
import Chart from '@/shared/uiKit/chart/Chart.vue'
import { arrayGenerator, FixedLabels, stepped, steppedGenerator } from '@/shared/uiKit/chart/plugins/plots/multiLine/labels/FixedLabels'
import { StepLabels } from '@/shared/uiKit/chart/plugins/plots/multiLine/labels/StepLabels'
import { MultiLineChart } from '@/shared/uiKit/chart/plugins/plots/multiLine/MultiLine'
import { SimpleLine } from '@/shared/uiKit/chart/plugins/plots/multiLine/plot/line/SimpleLine'
import { TicksByLabels } from '@/shared/uiKit/chart/plugins/plots/multiLine/ticks/TicksByLabels'
import { onMounted, ref, watchEffect } from 'vue'


const chartElement = ref<InstanceType<typeof Chart> | null>(null)

const props = defineProps<{}>()
const offset = ref(0)
const scale = ref(1)

onMounted(() => {
  if (!chartElement.value) return

  const chart = chartElement.value.chart

  const multiLine = new MultiLineChart({
    // axis: {
    //   xAxis: {
    //     // showEdgeLabels: true,
    //     // showZeroLabel: true,
    //     step: 1,
    //     // offset: 10,
    //     labelForValue: v => `${v}`,
    //   }
    // }
  })

  const xLabels = new StepLabels({
    // showEdgeLabels: true,
    step: [1, 5, 10, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10000],
    offset: 0,
    // padding: 10,
    labelForValue: v => `${v.toFixed(0)}`,
  })

  const fixedLabels = new FixedLabels({
    labelForValue: (v, step) => step < 5 && v == 500 ? `${v.toFixed(10)}` : `${v.toFixed(0)}`,
    // labeledValues: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
    padding: 15,
    values: [
      // {
      //   gen: arrayGenerator([0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]),
      //   labelForValue: v => v == 500 ? `${v.toFixed(10)}` : `${v.toFixed(0)}`,
      // },
      ...stepped({
        step: [1, 2, 5, 10, 25, 50, 100, 200, 250, 500],
        offset: 0,
        // labelForValue: v => `${v.toFixed(0)}`,
        padding: 0
      })
    ],
    from: 0,
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

  const xTicks = new TicksByLabels(fixedLabels)

  multiLine.setXTicks(xTicks)
  multiLine.setXLabels(fixedLabels)
  multiLine.addLine(sinLine)
  multiLine.addLine(randomLine)
  // multiLine.addLine(redLine)

  chart.addPlugin(multiLine)

  // setInterval(() => {
  //   multiLine.setRenderBounds({
  //     minX: (1 + Math.sin(Date.now() / 1000)) * 200 - 200,
  //     maxX: (1 + Math.cos(Date.now() / 1000)) * 200 + 900,
  //   })
  // }, 16)

  watchEffect(() => {
    multiLine.setRenderBounds({
      minX: -offset.value,
      maxX: -offset.value + 1000 / scale.value,
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

      .label {
        fill: white;
        font-size: 14px;
        font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
      }

      .ticks {
        .x-ticks {
          .tick {
            stroke: rgba(255, 255, 255, 0.5);
            stroke-width: 0.5px;
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