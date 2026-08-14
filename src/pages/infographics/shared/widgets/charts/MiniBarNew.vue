<template>

  <ServerStatusWrapper :status="status" v-slot="{ showError, status }">
    <div class="chart-container" v-if="status != 'error'" :style="{
      ['--bar-color']: getColor(props.color).main,
      ['--bar-color-highlighted']: getColor(props.color).highlight,
    }">
      <FloatingTooltip :ctx="tooltipCtx" :animated="true" :animation-omega="20" :hideDelay="0" v-slot="{ ctx }"
        :class="'mini-bar-tooltip'" v-if="props.tooltip !== false">
        <div class="tooltip" :class="{
          ['has-label']: props.tooltip?.label,
          ['has-title']: props.tooltip?.title,
        }">
          <h4 v-if="props.tooltip?.title">{{ props.tooltip.title(ctx) }} </h4>
          <p v-if="props.tooltip?.label">{{ props.tooltip.label(ctx) }}</p>
          <p v-if="!props.tooltip?.title && !props.tooltip?.label">{{ ctx.hit.datum }}</p>
        </div>
      </FloatingTooltip>
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
import { PlotAreaBorder } from '@/shared/uiKit/chart/universalChart/plot/axis/PlotAreaBorder'
import { ref, watch, watchEffect } from 'vue'
import { Bar, BarDataset } from '@/shared/uiKit/chart/universalChart/plot/bar/Bar.ts'
import { Classes } from '@/shared/uiKit/chart/universalChart/utils/utils.ts'
import { BloomColorVariant, getColor } from '../../bloomColors.ts'
import { ChartClip } from '@/shared/uiKit/chart/universalChart/defs/ChartClip.ts'
import { InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController.ts'
import { ChartTooltip, TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip.ts'
import { BarItemHit } from '@/shared/uiKit/chart/universalChart/plot/bar/BarInteractionSource.ts'
import FloatingTooltip from '@/shared/ui/chart/FloatingTooltip.vue'
import { Highlight } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/highlight/Highlight.ts'
import { ChartShadowFilter } from '@/shared/uiKit/chart/universalChart/defs/ChartShadowFilter.ts'


const LABELS_OPTIONS: Options = {
  labelOffset: 10,
  padding: 5,
  values: steppedOverrides({
    step: 1,
  }),
  strategy: {
    type: 'cell',
    size: 1,
  }
}


const props = defineProps<{
  status?: Status,
  labels?: (string | number)[],
  color: BloomColorVariant,
  classes?: Classes,
  data: number[] | number[][] | { values: number[], classes: Classes }[],
  blurRadius?: number,
  centerLine?: boolean,
  tooltip?: {
    title?: (ctx: TooltipCtx<BarItemHit<string | number>>) => string,
    label?: (ctx: TooltipCtx<BarItemHit<string | number>>) => string,
  } | false
}>()

const tooltipCtx = ref<TooltipCtx<BarItemHit<string | number>> | null>(null)

const chart = new UniversalChart({ layoutVariant: 'vertical', renderManager: globalChartRenderManagerSteps4 })

const clipMain = new ChartClip('center')
const shadow = new ChartShadowFilter({ color: getColor(props.color).bloom })
const highlightedShadow = new ChartShadowFilter({ color: getColor(props.color).bloom, strength: 0.8 })

const border = new PlotAreaBorder({ bottom: 'full' })
const labelsX = new AutoLabels('horizontal', {
  ...LABELS_OPTIONS,
  from: 0,
  to: -1,
})

const bar = new Bar<string | number>({
  classes: props.classes,
  strategy: {
    type: 'grouped',
    padding: 0.3,
    maxWidth: 30,
  }
})
  .filterBy(shadow)
  .clipBy(clipMain)

// const verticalLine = new

const selectedBarItem = bar.interaction.contains({
  hitArea: 'vertical',
  gaps: 'nearest',
  groupGaps: 'nearest'
})

const interactionController = new InteractionController()
  .addComponent(new ChartTooltip({
    selection: selectedBarItem,
    tooltipPivot: 'avg',
    onHide: () => tooltipCtx.value = null,
    onPositionChange: ctx => tooltipCtx.value = ctx,
  }))
  .addComponent(new Highlight({
    selection: selectedBarItem,
    class: 'highlighted',
    onHighlight: target => highlightedShadow.apply(target),
    onDehighlight: target => highlightedShadow.remove(target),
  }))


chart
  .addPlot(border, 'ticks')
  .addPlot(bar, 'plot')
  .addDefs(clipMain, shadow, highlightedShadow)
  .addPlot(interactionController)

watch(() => props.labels, (labels, old) => {
  if (!old && labels) chart.addSlot('bottom', labelsX, 'labels')
  if (!labels && old) chart.removeSlot(labelsX)
}, { immediate: true })


watchEffect(() => {
  const shadowOptions = {
    color: getColor(props.color).bloom,
    blurRadius: props.blurRadius ?? 5,
  }
  shadow.updateOptions(shadowOptions)
  highlightedShadow.updateOptions(shadowOptions)

  const labels = props.labels
  if (labels) {
    labelsX.updateOptions({
      ...LABELS_OPTIONS,
      from: 0,
      to: labels.length - 1,
      labelForValue: value => `${labels[value] ?? ''}`,
    })
  }


  let datasets: BarDataset[]
  if (Array.isArray(props.data[0]))
    datasets = (props.data as number[][]).map(values => ({ values }))
  else if (typeof props.data[0] === 'object')
    datasets = (props.data as { values: number[], classes: Classes }[]).map(d => ({ values: d.values, classes: d.classes }))
  else
    datasets = [{ values: props.data as number[] }]

  bar.setData({ categories: labels, datasets })

  const size = bar.getBounds()
  const categoryCount = datasets.reduce((max, dataset) => Math.max(max, dataset.values.length), 0)

  chart.setRenderBounds({
    minX: 0,
    maxX: categoryCount,
    maxY: size.maxY * 1.1,
  })
})

</script>

<style lang="scss">
.mini-bar-tooltip {
  --popover-background-color: rgba(0, 0, 0, 0.8);
  --popover-border-color: rgba(255, 255, 255, 0.1);

  .popover-background {
    border-radius: 5px;
  }
}
</style>

<style lang="scss" scoped>
.tooltip {
  padding: 5px 5px;

  &.has-label {
    h4 {
      margin-bottom: 4px;
    }
  }

  h4 {
    margin: 0;
    font-size: 12px;
    font-weight: bold;
    color: rgba(255, 255, 255);
    line-height: 1;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1;
  }
}

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

    .plot-area-border path {
      stroke: rgb(255 255 255 / 15%);
    }

    .bar {
      fill: var(--bar-color);
      transition: fill 0.2s ease;

      &.highlighted {
        fill: var(--bar-color-highlighted);
      }
    }
  }
}
</style>
