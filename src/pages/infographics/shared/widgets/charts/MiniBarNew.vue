<template>

  <ServerStatusWrapper :status="status" v-slot="{ showError, status }">
    <div class="chart-container" v-if="status != 'error'" :style="{
      ['--bar-color']: getColor(props.color).main,
      ['--bar-bloom-color']: getColor(props.color).bloom,
      ['--bar-blur-radius']: props.blurRadius ? `${props.blurRadius}px` : undefined,
    }">
      <!-- <ShadowBar :data="chartData" :options="options" /> -->
      <UniversalChartComponent :chart="chart" />
    </div>
    <div class="flex flex-1 center pointer" v-else @click="showError">
      <p class="card-main-info error">!</p>
    </div>
  </ServerStatusWrapper>
</template>


<script setup lang="ts">
import UniversalChartComponent from '@/shared/uiKit/chart/universalChart/UniversalChart.vue'
import ServerStatusWrapper from '../../ServerStatusWrapper.vue'
import { Status } from '@/db'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart.ts'
import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager.ts'
import { AutoLabels, Options } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels.ts'
import { steppedOverrides } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/steppedGenerator.ts'
import { Axis } from '@/shared/uiKit/chart/universalChart/axis/Axis.ts'
import { watchEffect } from 'vue'
import { Bar } from '@/shared/uiKit/chart/universalChart/plot/bar/Bar.ts'
import { Classes } from '@/shared/uiKit/chart/universalChart/utils/utils.ts'
import { BloomColorVariant, getColor } from '../../bloomColors.ts'
import { ChartClip } from '@/shared/uiKit/chart/universalChart/defs/ChartClip.ts'

const LABELS_OPTIONS: Options = {
  labelOffset: 10,
  padding: 5,
  values: steppedOverrides({
    step: 1,
  }),
  strategy: {
    type: 'interval',
    placement: 'middle',
    offset: [0, 0]
  }
}


const props = defineProps<{
  status?: Status,
  labels: (string | number)[],
  color: BloomColorVariant,
  classes?: Classes,
  data: number[] | number[][] | { values: number[], classes: Classes }[],
  blurRadius?: number,
}>()


const chart = new UniversalChart({ layoutVariant: 'vertical', renderManager: globalChartRenderManagerSteps4 })


const clipMain = new ChartClip('center')

const axis = new Axis({ bottom: 'full' })
const labelsX = new AutoLabels('horizontal', {
  ...LABELS_OPTIONS,
  from: 0,
  to: -1,
})

const bar = new Bar({
  classes: props.classes,
  strategy: {
    type: 'stacked',
    padding: 0.3,
    maxWidth: 30,
  }
}).clipBy(clipMain)

chart
  .addSlot('bottom', labelsX, 'labels')
  .addPlot(axis, 'ticks')
  .addPlot(bar, 'plot')
  .addDefs(clipMain)


watchEffect(() => {
  labelsX.updateOptions({
    ...LABELS_OPTIONS,
    from: 0,
    to: props.labels.length,
    labelForValue: (value) => `${props.labels[value] ?? ''}`,
  })

  if (Array.isArray(props.data[0])) {
    bar.setDatasets((props.data as number[][]).map((values, i) => ({ values })))
  } else if (typeof props.data[0] === 'object') {
    bar.setDatasets((props.data as { values: number[], classes: Classes }[]).map((d) => ({ values: d.values, classes: d.classes })))
  } else {
    bar.setDatasets([{ values: props.data as number[] }])
  }

  const size = bar.getBounds()

  chart.setRenderBounds({
    minX: 0,
    maxX: props.labels.length,
    maxY: size.maxY * 1.1,
  })
  console.log('MiniBarNew props changed', props.labels, props.data)
})

</script>


<style lang="scss" scoped>
.chart-container {
  flex: 1;
  position: relative;

  :deep(.chart-container) {
    width: 100%;
    height: 100%;
    position: relative;

    .universal-chart-root {
      left: 0;
    }

    .labels {
      .x-labels {
        font-size: 12px;
      }
    }

    .chart-axis path {
      stroke: rgb(255 255 255 / 15%);
    }

    .bar {
      fill: var(--bar-color);
      filter: drop-shadow(0px 0px var(--bar-blur-radius, 5px) var(--bar-bloom-color));
    }
  }
}
</style>