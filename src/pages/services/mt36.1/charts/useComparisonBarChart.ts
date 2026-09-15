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
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import type { PlotRenderer } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { MaybeRefOrGetter, shallowRef, toValue, watch, watchEffect } from 'vue'

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

type Params = {
  data: MaybeRefOrGetter<ComparisonBarChartData>
  enabledSeries: MaybeRefOrGetter<readonly ComparisonSeries[]>
  highlightSync: HighlightSynchronizer
  showYLabels: MaybeRefOrGetter<boolean>
  minY: MaybeRefOrGetter<number>
  ySteps?: readonly number[]
  yLabelFormatter?: (value: number) => string
}

const DEFAULT_Y_STEPS = [
  0.01, 0.02, 0.05, 0.1, 0.2, 0.5,
  1, 2, 5, 10, 20, 50,
  100, 200, 500, 1000, 2000, 5000,
]

export function useComparisonBarChart(params: Params) {
  const chart = new UniversalChart({
    layoutVariant: 'vertical',
    renderManager: globalChartRenderManagerSteps4,
    minLayoutSize: { top: 10, right: 2 },
  })

  let dataMaxY = 1
  let requestedMinY = 0

  const labelsX = new AutoLabels('horizontal', {
    from: 0,
    to: 0,
    values: labelCandidates({ step: 1 }),
    strategy: { type: 'cell', size: 1 },
    padding: 5,
    labelOffset: 8,
  })
  const labelsY = new AutoLabels('vertical', {
    from: 0,
    values: labelCandidates({ step: params.ySteps ?? DEFAULT_Y_STEPS }),
    labelForValue: params.yLabelFormatter ?? (value => value.toFixed()),
    onlyFitted: true,
    strategy: 'classic-flow',
  })
  const ticksY = new TicksByLabels(labelsY)

  const clip = new ChartClip('center')
  const bar = new Bar<string | number, ComparisonBarDatum>({
    classes: 'comparison-bars',
    strategy: {
      type: 'grouped',
      padding: 0.25,
      innerPadding: 0.1,
      maxWidth: 44,
      radius: 2,
    },
  }).clipBy(clip)

  const selectedItem = bar.interaction.contains({
    hitArea: 'vertical',
    gaps: 'nearest',
    groupGaps: 'nearest',
  })

  const tooltipCtx = shallowRef<TooltipCtx<ComparisonBarHit> | null>(null)
  const barHighlight = new Highlight({ selection: selectedItem, class: 'highlighted' }).syncWith(params.highlightSync)
  const interactionController = new InteractionController()
    .addComponent(barHighlight)
    .addComponent(new ChartTooltip({
      selection: selectedItem.related('group'),
      tooltipPivot: 'max-y',
      exposeHighlights: [barHighlight],
      onHide: () => tooltipCtx.value = null,
      onPositionChange: ctx => tooltipCtx.value = ctx,
    }))

  // AutoLabels chooses its step during layout. Re-layout synchronously so only rounded bounds reach render.
  const maxYRounder: PlotRenderer = {
    afterLayout: (space, overflow) => {
      if (!toValue(params.showYLabels)) return

      for (let attempt = 0; attempt < 4; attempt++) {
        const frame = labelsY.calculateLabelsFrame(space, { start: overflow.top, end: overflow.bottom })
        const values = [...new Set(frame.tickLevels[0]?.values ?? [])].sort((a, b) => a - b)
        if (values.length < 2) return

        const step = values[1] - values[0]
        if (!Number.isFinite(step) || step <= 0) return

        const anchor = values[0]
        const stepsToDataMax = Math.ceil((dataMaxY - anchor) / step - 1e-10)
        const nextMaxY = Math.max(requestedMinY + step, anchor + stepsToDataMax * step)
        if (Math.abs(nextMaxY - space.bounds.maxY) <= step * 1e-9) return

        chart.setRenderBounds({ maxY: nextMaxY }, true)
      }
    },
  }

  chart
    .addPlot(new PlotAreaBorder({ bottom: 'space' }), 'ticks')
    .addSlot('bottom', labelsX, 'labels')
    .addPlot(bar, 'plot')
    .addPlot(maxYRounder)
    .addPlot(interactionController)
    .addDefs(clip)

  watch(() => toValue(params.showYLabels), (show, previous) => {
    if (show && !previous) {
      chart.addSlot('left', labelsY, 'labels')
      chart.addPlot(ticksY, 'ticks')
    } else if (!show && previous) {
      chart.removeSlot(labelsY)
      chart.removePlot(ticksY)
    }
  }, { immediate: true })

  watchEffect(() => {
    const data = toValue(params.data)
    const enabled = toValue(params.enabledSeries)
    const minY = toValue(params.minY)
    const datasets = []

    if (enabled.includes('left')) datasets.push({
      classes: 'left-bars',
      interactionTag: 'left',
      values: data.left.map(value => ({ value, series: 'left' as const })),
    })
    if (enabled.includes('right')) datasets.push({
      classes: 'right-bars',
      interactionTag: 'right',
      values: data.right.map(value => ({ value, series: 'right' as const })),
    })

    bar.setData({ categories: data.labels, datasets })
    labelsX.updateOptions({
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
    labelsY.updateOptions({
      from: minY,
      values: labelCandidates({ step: params.ySteps ?? DEFAULT_Y_STEPS }),
      labelForValue: params.yLabelFormatter ?? (value => value.toFixed()),
      onlyFitted: true,
      strategy: 'classic-flow',
    })

    const values = [
      ...(enabled.includes('left') ? data.left : []),
      ...(enabled.includes('right') ? data.right : []),
    ].filter(Number.isFinite)
    const maxValue = values.length === 0 ? minY + 1 : Math.max(...values)
    const maxY = maxValue > minY ? maxValue + (maxValue - minY) * 0.08 : minY + 1

    dataMaxY = maxValue
    requestedMinY = minY

    chart.setRenderBounds({
      minX: 0,
      maxX: Math.max(1, data.labels.length),
      minY,
      maxY,
    })
  })

  return { chart, tooltipCtx, barHighlight }
}
