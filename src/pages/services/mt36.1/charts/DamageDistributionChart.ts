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
import { LinePointHit, LineStrokeHit } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLineInteractionSource'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { shallowRef } from 'vue'
import { ComparisonSeries } from './ComparisonBarChart'

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

export type DamageDistributionChartState = {
  data: DamageDistributionChartData
  enabledSeries: readonly ComparisonSeries[]
}

type Options = {
  highlightSync: HighlightSynchronizer
}

export class DamageDistributionChart extends UniversalChart {

  readonly tooltipCtx = shallowRef<TooltipCtx<DamageDistributionHit> | null>(null)
  readonly highlight: Highlight<LineStrokeHit<DamageDistributionPoint>>

  private readonly labelsX: AutoLabels
  private readonly centerLine: ChartAxis
  private readonly leftLine: AutoLine<DamageDistributionPoint>
  private readonly rightLine: AutoLine<DamageDistributionPoint>

  constructor(options: Options) {
    super({
      layoutVariant: 'vertical',
      renderManager: globalChartRenderManagerSteps4,
      minLayoutSize: { top: 4, right: 2 },
    })

    this.labelsX = new AutoLabels('horizontal', {
      from: 0,
      to: 1,
      values: labelCandidates({ step: 1 }),
      strategy: 'classic-flow',
      padding: 5,
      labelOffset: 8,
    })
    this.centerLine = new ChartAxis('horizontal', -1, 'center-line')
    this.leftLine = new AutoLine<DamageDistributionPoint>({
      interactionTag: 'left',
      classes: ['distribution-line', 'left-line'],
    })
    this.rightLine = new AutoLine<DamageDistributionPoint>({
      interactionTag: 'right',
      classes: ['distribution-line', 'right-line'],
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
      .addPlot(this.centerLine, 'ticks')
      .addSlot('bottom', this.labelsX, 'labels')
      .addPlot(this.leftLine, 'lines')
      .addPlot(this.rightLine, 'lines')
      .addPlot(interactionController)
  }

  update(state: DamageDistributionChartState) {
    const { data, enabledSeries } = state

    this.labelsX.updateOptions({
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
    this.leftLine.setPoints(enabledSeries.includes('left')
      ? data.left.map((y, index) => y === null ? null : {
        x: index,
        y,
        label: data.labels[index] ?? '',
        series: 'left',
      })
      : [])
    this.rightLine.setPoints(enabledSeries.includes('right')
      ? data.right.map((y, index) => y === null ? null : {
        x: index,
        y,
        label: data.labels[index] ?? '',
        series: 'right',
      })
      : [])

    this.centerLine.setValue(data.targetIndex)

    const values = [
      ...(enabledSeries.includes('left') ? data.left : []),
      ...(enabledSeries.includes('right') ? data.right : []),
    ].filter(value => value !== null)
    const maxValue = values.length === 0 ? 1 : Math.max(...values)

    this.setRenderBounds({
      minX: 0,
      maxX: Math.max(1, data.labels.length - 1),
      minY: 0,
      maxY: Math.max(1, maxValue * 1.08),
    })

  }
}
