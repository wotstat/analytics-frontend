import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { AutoLabels } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { labelCandidates } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/labelCandidates'
import { InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { ChartTooltip, TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { Highlight } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/highlight/Highlight'
import { HighlightSynchronizer } from '@/shared/uiKit/chart/universalChart/interaction/composable/sync/HighlightSynchronizer'
import { ChartAxis } from '@/shared/uiKit/chart/universalChart/plot/axis/ChartAxis'
import { PlotAreaBorder } from '@/shared/uiKit/chart/universalChart/plot/axis/PlotAreaBorder'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { LinePointHit } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLineInteractionSource'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { MaybeRefOrGetter, shallowRef, toValue, watchEffect } from 'vue'
import { ComparisonSeries } from './useComparisonBarChart'

export type DamageDistributionChartData = {
  labels: readonly string[]
  left: readonly (number | null)[]
  right: readonly (number | null)[]
  targetIndex: number
}

type DamageDistributionPoint = {
  x: number
  y: number
  label: string
  series: ComparisonSeries
}

export type DamageDistributionHit = LinePointHit<DamageDistributionPoint>

type Params = {
  data: MaybeRefOrGetter<DamageDistributionChartData>
  enabledSeries: MaybeRefOrGetter<readonly ComparisonSeries[]>
  highlightSync: HighlightSynchronizer
}

export function useDamageDistributionChart(params: Params) {
  const chart = new UniversalChart({
    layoutVariant: 'vertical',
    renderManager: globalChartRenderManagerSteps4,
    minLayoutSize: { top: 4, right: 2 },
  })

  const labelsX = new AutoLabels('horizontal', {
    from: 0,
    to: 1,
    values: labelCandidates({ step: 1 }),
    strategy: 'classic-flow',
    padding: 5,
    labelOffset: 8,
  })
  const centerLine = new ChartAxis('horizontal', -1, 'center-line')
  const leftLine = new AutoLine<DamageDistributionPoint>({
    interactionTag: 'left',
    classes: ['distribution-line', 'left-line'],
  })
  const rightLine = new AutoLine<DamageDistributionPoint>({
    interactionTag: 'right',
    classes: ['distribution-line', 'right-line'],
  })

  const lineInteractions = leftLine.interaction.union(rightLine.interaction)
  const selectedPoints = lineInteractions.nearestByAxis('x')
  const hoveredLine = lineInteractions.nearStroke({ maxDistance: 8 }).nearest()
  const lineHighlight = new Highlight({ selection: hoveredLine, class: 'highlighted' })
    .syncWith(params.highlightSync)
  const tooltipCtx = shallowRef<TooltipCtx<DamageDistributionHit> | null>(null)
  const interactionController = new InteractionController()
    .addComponent(lineHighlight)
    .addComponent(new ChartTooltip({
      selection: selectedPoints,
      tooltipPivot: 'max-y',
      exposeHighlights: [lineHighlight],
      onHide: () => tooltipCtx.value = null,
      onPositionChange: ctx => tooltipCtx.value = ctx,
    }))

  chart
    .addPlot(new PlotAreaBorder({ bottom: 'space' }), 'ticks')
    .addPlot(centerLine, 'ticks')
    .addSlot('bottom', labelsX, 'labels')
    .addPlot(leftLine, 'lines')
    .addPlot(rightLine, 'lines')
    .addPlot(interactionController)

  watchEffect(() => {
    const data = toValue(params.data)
    const enabled = toValue(params.enabledSeries)

    labelsX.updateOptions({
      from: 0,
      to: Math.max(1, data.labels.length - 1),
      values: labelCandidates({
        step: [1, 2, 5, 10, 20, 50, 100],
        labelForValue: value => data.labels[value] ?? '',
      }),
      strategy: 'classic-flow',
      padding: 5,
      labelOffset: 8,
    })
    leftLine.setPoints(enabled.includes('left')
      ? data.left.map((y, index) => y === null ? null : {
        x: index,
        y,
        label: data.labels[index] ?? '',
        series: 'left',
      })
      : [])
    rightLine.setPoints(enabled.includes('right')
      ? data.right.map((y, index) => y === null ? null : {
        x: index,
        y,
        label: data.labels[index] ?? '',
        series: 'right',
      })
      : [])

    centerLine.setValue(data.targetIndex)

    const values = [
      ...(enabled.includes('left') ? data.left : []),
      ...(enabled.includes('right') ? data.right : []),
    ].filter(value => value !== null)
    const maxValue = values.length === 0 ? 1 : Math.max(...values)

    chart.setRenderBounds({
      minX: 0,
      maxX: Math.max(1, data.labels.length - 1),
      minY: 0,
      maxY: Math.max(1, maxValue * 1.08),
    })
  })

  return { chart, tooltipCtx, lineHighlight }
}
