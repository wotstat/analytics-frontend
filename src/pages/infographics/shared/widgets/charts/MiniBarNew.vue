<template>

  <ServerStatusWrapper :status="status" v-slot="{ showError, status }">
    <div class="chart-container" v-if="status != 'error'">
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
  data: number[] | number[][],
}>()

const chart = new UniversalChart({ layoutVariant: 'vertical', renderManager: globalChartRenderManagerSteps4 })

const axis = new Axis({ bottom: 'full' })
const labelsX = new AutoLabels('horizontal', {
  ...LABELS_OPTIONS,
  from: 0,
  to: -1,
})

chart
  .addSlot('bottom', labelsX, 'labels')
  .addPlot(axis, 'ticks')


watchEffect(() => {
  labelsX.updateOptions({
    ...LABELS_OPTIONS,
    from: 0,
    to: props.labels.length,
    labelForValue: (value) => `${props.labels[value] ?? ''}`,
  })

  chart.setRenderBounds({
    minX: 0,
    maxX: props.labels.length,
    minY: 0,
    maxY: 0,
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
  }
}
</style>