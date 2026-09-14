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
import { MaybeRefOrGetter, shallowRef, toValue, watch } from 'vue'

type LineData = readonly (number | null)[]
export type ShotDistributionSeries = 'server' | 'client' | 'shared'

type ShotDistributionPoint = {
  x: number
  y: number
  series: ShotDistributionSeries
}

export type ShotDistributionHit = LinePointHit<ShotDistributionPoint>

type Params = {
  serverMarker: MaybeRefOrGetter<LineData>
  clientMarker: MaybeRefOrGetter<LineData>
  sharedClient: MaybeRefOrGetter<LineData>
  enabledSeries: MaybeRefOrGetter<readonly ShotDistributionSeries[]>
  highlightSync: HighlightSynchronizer
}

function toPoints(data: LineData, series: ShotDistributionSeries) {
  return data.map((y, x) => y === null ? null : { x, y, series })
}

export function useShotDistributionChart(params: Params) {
  const chart = new UniversalChart({
    layoutVariant: 'vertical',
    renderManager: globalChartRenderManagerSteps4,
    minLayoutSize: { top: 10, right: 2 }
  })

  const labelsY = new AutoLabels('vertical', {
    from: 0,
    to: 100,
    values: labelCandidates({
      step: [20, 25, 50],
      ticks: ['labels', { source: { step: 10 } }]
    }),
    labelForValue: (value) => `${value}%`,
    strategy: 'classic-flow'
  })

  const xValues = [33, 50, 67]
  const labelsX = new AutoLabels('horizontal', {
    from: 0,
    to: 100,
    values: labelCandidates({
      values: [xValues, xValues],
      labelForValue: (_, { candidateIndex, valueIndex }) =>
        [['Треть', 'Половина', 'Две трети'], ['1/3', '1/2', '2/3']][candidateIndex]?.[valueIndex] ?? '',
    }),
    strategy: 'classic-flow',
    padding: 5,
    labelOffset: 8
  })

  const ticksY = new TicksByLabels(labelsY, {})
  const ticksX = new TicksByLabels(labelsX, {})
  const serverLine = new AutoLine<ShotDistributionPoint>({
    interactionTag: 'server', classes: ['distribution-line', 'server-line'], smoothingMethod: 'monotone', affectsBounds: false
  })
  const clientLine = new AutoLine<ShotDistributionPoint>({
    interactionTag: 'client', classes: ['distribution-line', 'client-line'], smoothingMethod: 'monotone', affectsBounds: false
  })
  const sharedLine = new AutoLine<ShotDistributionPoint>({
    interactionTag: 'shared', classes: ['distribution-line', 'shared-line'], smoothingMethod: 'monotone', affectsBounds: false
  })

  const lines = {
    server: serverLine,
    client: clientLine,
    shared: sharedLine,
  }

  const lineInteractions = serverLine.interaction
    .union(clientLine.interaction)
    .union(sharedLine.interaction)

  const selectedPoints = lineInteractions.nearestByAxis('x')
  const hoveredLine = lineInteractions.nearStroke({ maxDistance: 8 }).nearest()
  const lineHighlight = new Highlight({ selection: hoveredLine, class: 'highlighted' })
    .syncWith(params.highlightSync)

  const tooltipCtx = shallowRef<TooltipCtx<ShotDistributionHit> | null>(null)

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
    .addPlot(new PlotAreaBorder({ left: 'space', right: 'space' }), 'ticks')
    .addSlot('left', labelsY, 'labels')
    .addSlot('bottom', labelsX, 'labels')
    .addPlot(ticksY, 'ticks')
    .addPlot(ticksX, 'ticks')
    .addPlot(sharedLine, 'lines')
    .addPlot(clientLine, 'lines')
    .addPlot(serverLine, 'lines')
    .addPlot(interactionController)

  chart.setRenderBounds({ minX: 0, maxX: 100, minY: 0, maxY: 100 })

  function bindLine(series: ShotDistributionSeries, data: MaybeRefOrGetter<LineData>) {
    watch([() => toValue(data), () => toValue(params.enabledSeries)], ([data, enabled]) => {
      lines[series].setPoints(enabled.includes(series) ? toPoints(data, series) : [])
    }, { immediate: true })
  }

  bindLine('server', params.serverMarker)
  bindLine('client', params.clientMarker)
  bindLine('shared', params.sharedClient)

  return { chart, tooltipCtx, lineHighlight }
}
