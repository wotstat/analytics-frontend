import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { ChartShadowFilter } from '@/shared/uiKit/chart/universalChart/defs/ChartShadowFilter'
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

type LineData = readonly (number | null)[]

export type ShotDistributionSeries = 'server' | 'client' | 'shared'

type ShotDistributionPoint = {
  x: number
  y: number
  series: ShotDistributionSeries
}

export type ShotDistributionHit = LinePointHit<ShotDistributionPoint>

export type ShotDistributionChartState = {
  serverMarker: LineData
  clientMarker: LineData
  sharedClient: LineData
  enabledSeries: readonly ShotDistributionSeries[]
}

type Options = {
  highlightSync: HighlightSynchronizer
}

function toPoints(data: LineData, series: ShotDistributionSeries) {
  return data.map((y, x) => y === null ? null : { x, y, series })
}

export class ShotDistributionChart extends UniversalChart {

  readonly tooltipCtx = shallowRef<TooltipCtx<ShotDistributionHit> | null>(null)
  readonly highlight: Highlight<LineStrokeHit<ShotDistributionPoint>>

  private readonly lines: Record<ShotDistributionSeries, AutoLine<ShotDistributionPoint>>

  constructor(options: Options) {
    super({
      layoutVariant: 'vertical',
      renderManager: globalChartRenderManagerSteps4,
      minLayoutSize: { top: 10, right: 2 },
    })

    const labelsY = new AutoLabels('vertical', {
      from: 0,
      to: 100,
      values: labelCandidates({
        step: [20, 25, 50],
        ticks: ['labels', { source: { step: 10 } }],
      }),
      labelForValue: value => `${value}%`,
      strategy: 'classic-flow',
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
      labelOffset: 8,
    })

    const serverShadow = new ChartShadowFilter({ color: '#f78008', blurRadius: 2, opacity: 0.8 })
    const clientShadow = new ChartShadowFilter({ color: '#639e31', blurRadius: 2, opacity: 0.8 })
    const sharedShadow = new ChartShadowFilter({ color: '#5149c6', blurRadius: 2, opacity: 0.8 })

    const serverLine = new AutoLine<ShotDistributionPoint>({
      interactionTag: 'server', smoothingMethod: 'monotone', affectsBounds: false,
      classes: ['distribution-line', 'server-line'],
    }).filterBy(serverShadow)

    const clientLine = new AutoLine<ShotDistributionPoint>({
      interactionTag: 'client', smoothingMethod: 'monotone', affectsBounds: false,
      classes: ['distribution-line', 'client-line'],
    }).filterBy(clientShadow)

    const sharedLine = new AutoLine<ShotDistributionPoint>({
      interactionTag: 'shared',
      smoothingMethod: 'monotone', affectsBounds: false,
      classes: ['distribution-line', 'shared-line'],
    }).filterBy(sharedShadow)

    this.lines = {
      server: serverLine,
      client: clientLine,
      shared: sharedLine,
    }

    const lineInteractions = serverLine.interaction
      .union(clientLine.interaction)
      .union(sharedLine.interaction)

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
      .addPlot(new PlotAreaBorder({ left: 'space', right: 'space' }), 'ticks')
      .addSlot('left', labelsY, 'labels')
      .addSlot('bottom', labelsX, 'labels')
      .addDefs(serverShadow, clientShadow, sharedShadow)
      .addPlot(new TicksByLabels(labelsY), 'ticks')
      .addPlot(new TicksByLabels(labelsX), 'ticks')
      .addPlot(sharedLine, 'lines')
      .addPlot(clientLine, 'lines')
      .addPlot(serverLine, 'lines')
      .addPlot(interactionController)

    this.setRenderBounds({ minX: 0, maxX: 100, minY: 0, maxY: 100 })
  }

  update(state: ShotDistributionChartState) {
    this.setLine('server', state.serverMarker, state.enabledSeries)
    this.setLine('client', state.clientMarker, state.enabledSeries)
    this.setLine('shared', state.sharedClient, state.enabledSeries)
  }

  private setLine(series: ShotDistributionSeries, data: LineData, enabledSeries: readonly ShotDistributionSeries[]) {
    this.lines[series].setPoints(enabledSeries.includes(series) ? toPoints(data, series) : [])
  }
}
