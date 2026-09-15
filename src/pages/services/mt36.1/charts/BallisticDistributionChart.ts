import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { AutoLabels } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { labelCandidates } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/labelCandidates'
import { InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { ChartTooltip, TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { Highlight } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/highlight/Highlight'
import { HighlightSynchronizer } from '@/shared/uiKit/chart/universalChart/interaction/composable/sync/HighlightSynchronizer'
import { PlotAreaBorder } from '@/shared/uiKit/chart/universalChart/plot/axis/PlotAreaBorder'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { LinePointHit, LineStrokeHit } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLineInteractionSource'
import { TicksByLabels } from '@/shared/uiKit/chart/universalChart/ticks/TicksByLabels'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { shallowRef } from 'vue'
import { BallisticDistributionData } from '../ballisticDistribution'

export type BallisticDistributionGroup = 'left' | 'right'

type BallisticDistributionPoint = {
  x: number
  y: number
  series: BallisticDistributionGroup
}

export type BallisticDistributionHit = LinePointHit<BallisticDistributionPoint>

export type BallisticDistributionChartState = {
  data: BallisticDistributionData
  enabledSeries: readonly BallisticDistributionGroup[]
}

type Options = {
  highlightSync: HighlightSynchronizer
}

export class BallisticDistributionChart extends UniversalChart {

  readonly tooltipCtx = shallowRef<TooltipCtx<BallisticDistributionHit> | null>(null)
  readonly highlight: Highlight<LineStrokeHit<BallisticDistributionPoint>>

  private readonly leftLine: AutoLine<BallisticDistributionPoint>
  private readonly rightLine: AutoLine<BallisticDistributionPoint>

  constructor(options: Options) {
    super({
      layoutVariant: 'vertical',
      renderManager: globalChartRenderManagerSteps4,
      minLayoutSize: { right: 2 },
      renderBoundsPadding: { top: 0.005 },
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

    this.leftLine = new AutoLine<BallisticDistributionPoint>({
      interactionTag: 'left',
      classes: ['distribution-line', 'left-line'],
      smoothingMethod: 'monotone',
    })
    this.rightLine = new AutoLine<BallisticDistributionPoint>({
      interactionTag: 'right',
      classes: ['distribution-line', 'right-line'],
      smoothingMethod: 'monotone',
    })

    const lineInteractions = this.leftLine.interaction.union(this.rightLine.interaction)
    const selectedPoints = lineInteractions.nearestByAxis('x')
    const hoveredLine = lineInteractions.nearStroke({ maxDistance: 8 }).nearest()
    this.highlight = new Highlight({ selection: hoveredLine, class: 'highlighted' })
      .syncWith(options.highlightSync)

    const interactionController = new InteractionController()
      .addComponent(this.highlight)
      .addComponent(new ChartTooltip({
        selection: selectedPoints,
        tooltipPivot: 'max-y',
        exposeHighlights: [this.highlight],
        onHide: () => this.tooltipCtx.value = null,
        onPositionChange: ctx => this.tooltipCtx.value = ctx,
      }))

    this
      .addPlot(new PlotAreaBorder({ bottom: 'space' }), 'ticks')
      .addSlot('bottom', labelsX, 'labels')
      .addPlot(new TicksByLabels(labelsX), 'ticks')
      .addPlot(this.leftLine, 'lines')
      .addPlot(this.rightLine, 'lines')
      .addPlot(interactionController)
  }

  update(state: BallisticDistributionChartState) {
    const { data, enabledSeries } = state

    this.leftLine.setPoints(enabledSeries.includes('left')
      ? data.left.map((y, index) => y === null ? null : { x: data.labels[index], y, series: 'left' })
      : [])
    this.rightLine.setPoints(enabledSeries.includes('right')
      ? data.right.map((y, index) => y === null ? null : { x: data.labels[index], y, series: 'right' })
      : [])

    if (this.leftLine.getBounds().isEmpty() && this.rightLine.getBounds().isEmpty()) {
      this.setRenderBounds({ minX: 0, maxX: 1, minY: 0, maxY: 1 })
    } else {
      this.setRenderBounds({ minX: 0, maxX: 1, minY: 0, maxY: null })
    }

  }
}
