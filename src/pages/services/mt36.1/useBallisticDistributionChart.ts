import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { AutoLabels } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { labelCandidates } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/labelCandidates'
import { InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { ChartTooltip, TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { Highlight } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/highlight/Highlight'
import { HighlightSynchronizer } from '@/shared/uiKit/chart/universalChart/interaction/composable/sync/HighlightSynchronizer'
import { PlotAreaBorder } from '@/shared/uiKit/chart/universalChart/plot/axis/PlotAreaBorder'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { LinePointHit } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLineInteractionSource'
import { TicksByLabels } from '@/shared/uiKit/chart/universalChart/ticks/TicksByLabels'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { MaybeRefOrGetter, shallowRef, toValue, watchEffect } from 'vue'
import { BallisticDistributionData } from './ballisticDistribution'

export type BallisticDistributionGroup = 'left' | 'right'

type BallisticDistributionPoint = {
  x: number
  y: number
  series: BallisticDistributionGroup
}

export type BallisticDistributionHit = LinePointHit<BallisticDistributionPoint>

type Params = {
  data: MaybeRefOrGetter<BallisticDistributionData>
  enabledSeries: MaybeRefOrGetter<readonly BallisticDistributionGroup[]>
  highlightSync: HighlightSynchronizer
}

export function useBallisticDistributionChart(params: Params) {
  const chart = new UniversalChart({
    layoutVariant: 'vertical',
    renderManager: globalChartRenderManagerSteps4,
    minLayoutSize: { right: 2 },
    renderBoundsPadding: { top: 0.005 }
  })

  const xValues = [0.33, 0.5, 0.66]
  const labelsX = new AutoLabels('horizontal', {
    from: 0,
    to: 1,
    values: labelCandidates({
      values: [xValues, xValues],
      labelForValue: (_, { candidateIndex, valueIndex }) =>
        [['Треть', 'Половина', 'Две трети'], ['1/3', '1/2', '2/3']][candidateIndex]?.[valueIndex] ?? '',
    }),
    strategy: 'classic-flow',
    padding: 5,
    labelOffset: 8,
  })

  const leftLine = new AutoLine<BallisticDistributionPoint>({
    interactionTag: 'left',
    classes: ['distribution-line', 'left-line'],
    smoothingMethod: 'monotone',
  })
  const rightLine = new AutoLine<BallisticDistributionPoint>({
    interactionTag: 'right',
    classes: ['distribution-line', 'right-line'],
    smoothingMethod: 'monotone',
  })

  const lineInteractions = leftLine.interaction.union(rightLine.interaction)
  const selectedPoints = lineInteractions.nearestByAxis('x')
  const hoveredLine = lineInteractions.nearStroke({ maxDistance: 8 }).nearest()
  const lineHighlight = new Highlight({ selection: hoveredLine, class: 'highlighted' })
    .syncWith(params.highlightSync)

  const tooltipCtx = shallowRef<TooltipCtx<BallisticDistributionHit> | null>(null)
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
    .addSlot('bottom', labelsX, 'labels')
    .addPlot(new TicksByLabels(labelsX), 'ticks')
    .addPlot(leftLine, 'lines')
    .addPlot(rightLine, 'lines')
    .addPlot(interactionController)

  watchEffect(() => {
    const data = toValue(params.data)
    const enabled = toValue(params.enabledSeries)

    leftLine.setPoints(enabled.includes('left')
      ? data.left.map((y, index) => y === null ? null : { x: data.labels[index], y, series: 'left' })
      : [])

    rightLine.setPoints(enabled.includes('right')
      ? data.right.map((y, index) => y === null ? null : { x: data.labels[index], y, series: 'right' })
      : [])

    if (leftLine.getBounds().isEmpty() && rightLine.getBounds().isEmpty()) {
      chart.setRenderBounds({ minX: 0, maxX: 1, minY: 0, maxY: 1 })
    } else {
      chart.setRenderBounds({ minX: 0, maxX: 1, minY: 0, maxY: null })
    }
  })

  return { chart, tooltipCtx, lineHighlight }
}
