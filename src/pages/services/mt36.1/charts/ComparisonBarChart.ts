import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { ChartClip } from '@/shared/uiKit/chart/universalChart/defs/ChartClip'
import { AutoLabels } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { labelCandidates } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/labelCandidates'
import { InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { ChartTooltip, TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { Highlight } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/highlight/Highlight'
import { HighlightSynchronizer } from '@/shared/uiKit/chart/universalChart/interaction/composable/sync/HighlightSynchronizer'
import { PlotAreaBorder } from '@/shared/uiKit/chart/universalChart/plot/axis/PlotAreaBorder'
import { Bar } from '@/shared/uiKit/chart/universalChart/plot/bar/Bar'
import { BarItemHit } from '@/shared/uiKit/chart/universalChart/plot/bar/BarInteractionSource'
import { TicksByLabels } from '@/shared/uiKit/chart/universalChart/ticks/TicksByLabels'
import { PlotRenderer, UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { shallowRef } from 'vue'

export type ComparisonSeries = 'left' | 'right'

export type ComparisonBarChartData = {
  labels: readonly (string | number)[]
  left: readonly number[]
  right: readonly number[]
}

export type ComparisonBarDatum = {
  value: number
  series: ComparisonSeries
}

export type ComparisonBarHit = BarItemHit<string | number, ComparisonBarDatum>

export type ComparisonBarChartState = {
  data: ComparisonBarChartData
  enabledSeries: readonly ComparisonSeries[]
  showYLabels: boolean
  minY: number
  ySteps?: readonly number[]
  yLabelFormatter?: (value: number) => string
}

type Options = {
  highlightSync: HighlightSynchronizer
}

const DEFAULT_Y_STEPS = [
  0.01, 0.02, 0.05, 0.1, 0.2, 0.5,
  1, 2, 5, 10, 20, 50,
  100, 200, 500, 1000, 2000, 5000,
]

export class ComparisonBarChart extends UniversalChart {

  readonly tooltipCtx = shallowRef<TooltipCtx<ComparisonBarHit> | null>(null)
  readonly highlight: Highlight<ComparisonBarHit>

  private readonly labelsX: AutoLabels
  private readonly labelsY: AutoLabels
  private readonly ticksY: TicksByLabels
  private readonly bar: Bar<string | number, ComparisonBarDatum>

  private dataMaxY = 1
  private requestedMinY = 0
  private yLabelsVisible = false

  constructor(options: Options) {
    super({
      layoutVariant: 'vertical',
      renderManager: globalChartRenderManagerSteps4,
      minLayoutSize: { top: 10, right: 2 },
    })

    this.labelsX = new AutoLabels('horizontal', {
      from: 0,
      to: 0,
      values: labelCandidates({ step: 1 }),
      strategy: { type: 'cell', size: 1 },
      padding: 5,
      labelOffset: 8,
    })
    this.labelsY = new AutoLabels('vertical', {
      from: 0,
      values: labelCandidates({ step: DEFAULT_Y_STEPS }),
      labelForValue: value => value.toFixed(),
      onlyFitted: true,
      strategy: 'classic-flow',
    })
    this.ticksY = new TicksByLabels(this.labelsY)

    const clip = new ChartClip('center')
    this.bar = new Bar<string | number, ComparisonBarDatum>({
      classes: 'comparison-bars',
      strategy: {
        type: 'grouped',
        padding: 0.25,
        innerPadding: 0.1,
        maxWidth: 44,
        radius: 2,
      },
    }).clipBy(clip)

    const selectedItem = this.bar.interaction.contains({
      hitArea: 'vertical',
      gaps: 'nearest',
      groupGaps: 'nearest',
    })

    this.highlight = new Highlight({ selection: selectedItem, class: 'highlighted' })
      .syncWith(options.highlightSync)

    const interactionController = new InteractionController()
      .addComponent(this.highlight)
      .addComponent(new ChartTooltip({
        selection: selectedItem.related('group'),
        tooltipPivot: 'max-y',
        exposeHighlights: [this.highlight],
        onHide: () => this.tooltipCtx.value = null,
        onPositionChange: ctx => this.tooltipCtx.value = ctx,
      }))

    // AutoLabels chooses its step during layout. Re-layout synchronously so only rounded bounds reach render.
    const maxYRounder: PlotRenderer = {
      afterLayout: (space, overflow) => {
        if (!this.yLabelsVisible) return

        for (let attempt = 0; attempt < 4; attempt++) {
          const frame = this.labelsY.calculateLabelsFrame(space, { start: overflow.top, end: overflow.bottom })
          const values = [...new Set(frame.tickLevels[0]?.values ?? [])].sort((a, b) => a - b)
          if (values.length < 2) return

          const step = values[1] - values[0]
          if (!Number.isFinite(step) || step <= 0) return

          const anchor = values[0]
          const stepsToDataMax = Math.ceil((this.dataMaxY - anchor) / step - 1e-10)
          const nextMaxY = Math.max(this.requestedMinY + step, anchor + stepsToDataMax * step)
          if (Math.abs(nextMaxY - space.bounds.maxY) <= step * 1e-9) return

          this.setRenderBounds({ maxY: nextMaxY }, true)
        }
      },
    }

    this
      .addPlot(new PlotAreaBorder({ bottom: 'space' }), 'ticks')
      .addSlot('bottom', this.labelsX, 'labels')
      .addPlot(this.bar, 'plot')
      .addPlot(maxYRounder)
      .addPlot(interactionController)
      .addDefs(clip)
  }

  update(state: ComparisonBarChartState) {
    const { data, enabledSeries, minY } = state
    const ySteps = state.ySteps ?? DEFAULT_Y_STEPS
    const yLabelFormatter = state.yLabelFormatter ?? ((value: number) => value.toFixed())

    this.setYLabelsVisible(state.showYLabels)

    const datasets = []
    if (enabledSeries.includes('left')) datasets.push({
      classes: 'left-bars',
      interactionTag: 'left' as const,
      values: data.left.map(value => ({ value, series: 'left' as const })),
    })
    if (enabledSeries.includes('right')) datasets.push({
      classes: 'right-bars',
      interactionTag: 'right' as const,
      values: data.right.map(value => ({ value, series: 'right' as const })),
    })

    this.bar.setData({ categories: data.labels, datasets })
    this.labelsX.updateOptions({
      from: 0,
      to: Math.max(0, data.labels.length - 1),
      values: labelCandidates({
        step: [1, 2, 3, 5, 10],
        labelForValue: value => `${data.labels[value] ?? ''}`,
      }),
      strategy: { type: 'cell', size: 1 },
      padding: 5,
      labelOffset: 8,
    })
    this.labelsY.updateOptions({
      from: minY,
      values: labelCandidates({ step: ySteps }),
      labelForValue: yLabelFormatter,
      onlyFitted: true,
      strategy: 'classic-flow',
    })

    const values = [
      ...(enabledSeries.includes('left') ? data.left : []),
      ...(enabledSeries.includes('right') ? data.right : []),
    ].filter(Number.isFinite)
    const maxValue = values.length === 0 ? minY + 1 : Math.max(...values)
    const maxY = maxValue > minY ? maxValue + (maxValue - minY) * 0.08 : minY + 1

    this.dataMaxY = maxValue
    this.requestedMinY = minY
    this.setRenderBounds({
      minX: 0,
      maxX: Math.max(1, data.labels.length),
      minY,
      maxY,
    })

  }

  private setYLabelsVisible(visible: boolean) {
    if (visible === this.yLabelsVisible) return
    this.yLabelsVisible = visible

    if (visible) {
      this.addSlot('left', this.labelsY, 'labels')
      this.addPlot(this.ticksY, 'ticks')
    } else {
      this.removeSlot(this.labelsY)
      this.removePlot(this.ticksY)
    }
  }
}
