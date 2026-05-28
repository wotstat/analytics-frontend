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
import { Axis } from '@/shared/uiKit/chart/plugins/multiLine/axis/Axis'
import { AutoLabels } from '@/shared/uiKit/chart/plugins/multiLine/labels/autoLabels/AutoLabels'
import { steppedOverrides } from '@/shared/uiKit/chart/plugins/multiLine/labels/autoLabels/generators/steppedGenerator'
import { MultiLineChart } from '@/shared/uiKit/chart/plugins/multiLine/MultiLine'
import { HorizontalLine } from '@/shared/uiKit/chart/plugins/multiLine/plot/hover/composableHover/components/lines/HorizontalLine'
import { VerticalLine } from '@/shared/uiKit/chart/plugins/multiLine/plot/hover/composableHover/components/lines/VerticalLine'
import { ComposableHover } from '@/shared/uiKit/chart/plugins/multiLine/plot/hover/composableHover/ComposableHover'
import { AutoLine } from '@/shared/uiKit/chart/plugins/multiLine/plot/line/autoLine/AutoLine'
import { AutoMarkers } from '@/shared/uiKit/chart/plugins/multiLine/plot/markers/autoMarkers/AutoMarkers'
import { TicksByLabels } from '@/shared/uiKit/chart/plugins/multiLine/ticks/TicksByLabels'
import { ChartClip } from '@/shared/uiKit/chart/plugins/multiLine/utils/ChartClip'
import { ChartGradient } from '@/shared/uiKit/chart/plugins/multiLine/utils/ChartGradient'
import { ChartMask } from '@/shared/uiKit/chart/plugins/multiLine/utils/ChartMask'
import { PlotGroup } from '@/shared/uiKit/chart/plugins/multiLine/utils/PlotGroup'
import { onMounted, ref, watchEffect } from 'vue'


const chartElement = ref<InstanceType<typeof Chart> | null>(null)

const props = defineProps<{}>()
const offset = ref(0)
const yOffset = ref(0)
const yScale = ref(1)
const xScale = ref(1)

function mulberry32(a: number) {
  return function () {
    var t = a += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

const seed = 12345
const rand = mulberry32(seed)

const gradientId = ref('')

onMounted(() => {
  if (!chartElement.value) return

  const chart = chartElement.value.chart

  const multiLine = new MultiLineChart({
    layoutVariant: 'horizontal',
    renderBoundsPadding: {
      vertical: 5,
    }
  })

  const clipMain = new ChartClip('center')
  const clipLeft = new ChartClip('left')
  const clipBottom = new ChartClip('bottom')
  const maskMain = new ChartMask('center')

  const labelsX = new AutoLabels('horizontal', {
    labelForValue: (v, step) => step < 7 && v == 500 ? `${v.toFixed(10)}` : `${v.toFixed(0)}`,
    padding: 15,
    labelOffset: 10,
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
    //   fit: false,
    //   offset: [0, 0],
    //   direction: 'backward',
    // },
    // from: 0,
    // to: 1000
    // strategy: {
    //   type: 'interval',
    //   placement: 'middle',
    //   fit: true,
    //   offset: [0, 0],
    // },
    from: 0, to: 1000
  }).clipBy(clipBottom)

  const labelsY = new AutoLabels('vertical', {
    labelForValue: (v, step) => `${v.toFixed(0)}`,
    padding: {
      clip: 10,
      flow: 5,
    },
    labelOffset: 5,
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
    //   placement: 'middle',
    //   fit: true,
    //   offset: [5, 5],
    // },
    // from: -50, to: 50
  }).clipBy(clipLeft)


  const xTicks = new TicksByLabels(labelsX, { start: 0 })
  const yTicks = new TicksByLabels(labelsY, { start: 0 })

  const axis = new Axis({
    left: 'space',
    bottom: 'space',
  })



  const points: ({ x: number, y: number } | null)[] = new Array(101).fill(0).map((_, i) => ({ x: i * 10, y: 20 + rand() * 50 }))

  points[10] = null
  points[11] = null
  points[20] = null
  points[23] = null

  // const sinLine = new SimpleLine(new Array(1000).fill(0).map((_, i) => ({ x: i, y: Math.sin(i / 10) * 50 + 50 })), ['sin'])
  // const randomLine = new SimpleLine(points, ['random'])
  const redLine = new AutoLine({ classes: ['red'] })
    .setPoints([
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: 1000, y: 100 },
      { x: 1000, y: 0 },
      { x: 0, y: 0 },
    ])

  const smoothRandom = new AutoLine({ classes: ['random', 'smooth'], area: false, smoothingMethod: 'smooth' })
    .setPoints(points)

  const monotoneRandom = new AutoLine({ classes: ['random', 'monotone'], area: true, smoothingMethod: 'monotone' })
    .setPoints(points)

  const sinLine = new AutoLine({ classes: ['sin', 'smooth'], area: false })
    .setPoints(new Array(1000).fill(0).map((_, i) => ({ x: i, y: Math.sin(i / 10) * 50 + 50 })))

  const gradient = new ChartGradient({
    classes: 'green-gradient',
  })

  gradientId.value = gradient.getClipPath()

  const markers = new AutoMarkers({
    classes: 'markers',
    size: 2.5,
    maskSize: 4.5,
    targetMasks: [maskMain.root]
  }).setMarkers(points.filter(p => p !== null))

  const hover = new ComposableHover('hover')
    .addComponent(new VerticalLine({ offset: { end: 0.5 } }))
    .addComponent(new HorizontalLine({ offset: { start: 0.5 } }))

  const plotRoot = new PlotGroup()
    // .addPlot(sinLine)
    // .addPlot(randomLine)
    .addPlot(smoothRandom.maskBy(maskMain))
    .addPlot(monotoneRandom.maskBy(maskMain))
    // .addPlot(redLine)
    .clipBy(clipMain)


  multiLine
    .addPlot(axis, 'ticks')
    .addPlot(xTicks, 'ticks')
    .addPlot(yTicks, 'ticks')
    .addPlot(plotRoot, 'plot')
    .addPlot(markers, 'plot')
    .addSlot('bottom', labelsX, 'labels')
    .addSlot('left', labelsY, 'labels')
    .addPlot(hover)
    .addDefs(gradient, clipMain, clipLeft, clipBottom, maskMain)

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
        opacity: 0.3;

        .chart-axis {
          path {
            stroke: rgba(255, 255, 255, 1);
            stroke-width: 1px;
            stroke-linejoin: round;
          }
        }

        .tick {
          stroke: rgba(255, 255, 255, 1);
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
            stroke: rgba(255, 255, 255, 0.5);
          }
        }
      }

      .plot {

        .line {
          stroke-width: 2px;

          &.sin {
            stroke: rgb(24, 169, 247);
          }

          &.random {
            stroke-width: 1px;
            stroke: rgb(20, 153, 255);
          }

          &.smooth {
            stroke-width: 1px;
            stroke: rgb(255, 191, 0);
          }

          &.monotone {
            stroke-width: 2px;
            stroke: rgb(45, 212, 45);
          }

          &.red {
            stroke-width: 1px;
            stroke: rgb(255, 0, 0);
          }
        }

        .area {
          &.sin {
            fill: rgba(24, 247, 95, 0.1);
          }

          &.random {
            // fill: rgba(0, 255, 128, 0.1);
            fill: v-bind('gradientId');
          }
        }

        .markers {
          circle {
            fill: rgb(45, 212, 45);
          }
        }
      }

      .green-gradient {
        .stop-1 {
          stop-color: rgba(45, 212, 45, 0.3);
        }

        .stop-2 {
          stop-color: rgba(45, 212, 45, 0);
        }
      }
    }
  }
}
</style>