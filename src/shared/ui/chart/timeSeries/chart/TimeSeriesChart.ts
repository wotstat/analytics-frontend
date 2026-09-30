import { shallowRef } from 'vue'
import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { ChartClip } from '@/shared/uiKit/chart/universalChart/defs/ChartClip'
import { ChartTooltip, type TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { VerticalLine } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/lines/VerticalLine'
import { MarkerOverlay } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/markerOverlay/MarkerOverlay'
import { ZoomChartComponent } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/zoomChartComponent/ZoomChartComponent'
import { Highlight } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/highlight/Highlight'
import type { HighlightSynchronizer } from '@/shared/uiKit/chart/universalChart/interaction/composable/sync/HighlightSynchronizer'
import { InteractionController, type InteractionComponent } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { CallbackComponent } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/callback/CallbackComponent'
import { InteractionFrame } from '@/shared/uiKit/chart/universalChart/interaction/core/InteractionFrame'
import type { ClickInteractionEvent } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/BaseInteractionController'
import { AutoLabels, type Options as LabelsOptions } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { labelCandidates } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/labelCandidates'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import type { AutoLineInteraction, LinePointHit } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLineInteractionSource'
import { TicksByLabels } from '@/shared/uiKit/chart/universalChart/ticks/TicksByLabels'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import { EventEmitter } from '@/shared/uiKit/chart/universalChart/utils/EventEmitter'
import { timeLabels } from '../utils/timeLabels'
import type { TimeSeries, TimeSeriesPoint, TimeSeriesStep, TimeSeriesValueFormat, TimeSeriesZoomLimits } from './timeSeries'
import { ChartMask } from '@/shared/uiKit/chart/universalChart/defs/ChartMask'

export type TimeSeriesHit<T extends TimeSeriesPoint = TimeSeriesPoint> = LinePointHit<T>

export class TimeSeriesChart<T extends TimeSeriesPoint = TimeSeriesPoint> extends UniversalChart {
  readonly tooltipCtx = shallowRef<TooltipCtx<TimeSeriesHit<T>> | null>(null)
  readonly onSeriesClick = new EventEmitter<{ tag: string, event: ClickInteractionEvent }>()

  private readonly seriesState = new Map<string, {
    line: AutoLine<T>
    className: string
    points: readonly (T | null)[]
    enabled: boolean
  }>()
  private readonly plot = new PlotGroup()

  private readonly interaction = new InteractionController()
  private interactionComponents: InteractionComponent[] = []

  private readonly mask = new ChartMask('center', { top: -4, bottom: -4 })
  private nextSeriesClass = 0
  private seriesColors = new Map<string, string | undefined>()

  private readonly labelsX: AutoLabels
  private readonly labelsY: AutoLabels
  private readonly zoom: ZoomChartComponent
  private timeAxis: TimeSeriesStep | 'auto' = 'auto'

  constructor(private readonly highlightSync?: HighlightSynchronizer) {
    super({
      layoutVariant: 'vertical',
      renderManager: globalChartRenderManagerSteps4,
      renderBoundsPxPadding: { top: 12, bottom: 12 },
      minLayoutSize: { top: 8, right: 8 },
    })

    const clip = new ChartClip('center', { top: -4, bottom: -4 })
    const mask = this.mask
    const clipLeft = new ChartClip('left')
    const clipBottom = new ChartClip('bottom')

    this.labelsX = new AutoLabels('horizontal', timeLabels()).clipBy(clipBottom)
    this.labelsY = new AutoLabels('vertical', this.yLabels({ formatValue: value => value.toLocaleString('ru-RU') })).clipBy(clipLeft)

    this.zoom = new ZoomChartComponent({ chart: this, zoom: true, panDirection: 'horizontal' })
    this.interaction.addComponent(this.zoom)
    this.plot.clipBy(clip).maskBy(mask)

    this
      .addPlot(new TicksByLabels(this.labelsY), 'grid')
      .addPlot(new TicksByLabels(this.labelsX, { classes: 'time-grid' }), 'grid')
      .addPlot(this.plot, 'plot')
      .addSlot('bottom', this.labelsX, 'labels')
      .addSlot('left', this.labelsY, 'labels')
      .addPlot(this.interaction)
      .addDefs(clip, clipLeft, clipBottom, mask)
  }

  setZoomLimits(limits?: TimeSeriesZoomLimits) {
    this.zoom.updateOptions({ chart: this, zoom: true, panDirection: 'horizontal', limits })
  }

  setValueFormat(format: TimeSeriesValueFormat) {
    this.labelsY.updateOptions(this.yLabels(format))
  }

  setTimeAxis(mode: TimeSeriesStep | 'auto' = 'auto') {
    if (this.timeAxis === mode) return
    this.labelsX.updateOptions(timeLabels(mode))
    this.timeAxis = mode
  }

  setSeriesColors(series: readonly { tag: string, color?: string }[]) {
    this.seriesColors = new Map(series.map(item => [item.tag, item.color]))
    for (const [tag, state] of this.seriesState) state.line.setColor(this.seriesColors.get(tag))
  }

  setSeries(series: readonly TimeSeries<T>[]) {
    this.tooltipCtx.value = null

    const tags = new Set(series.map(item => item.tag))
    let changed = false

    for (const [tag, state] of this.seriesState) {
      if (tags.has(tag)) continue

      this.plot.removePlot(state.line)
      this.seriesState.delete(tag)
      changed = true
    }

    for (const item of series) {
      let state = this.seriesState.get(item.tag)
      if (!state) {
        const className = `time-series-series-${this.nextSeriesClass++}`
        const line = new AutoLine<T>({ classes: ['time-series-line', className], interactionTag: item.tag, color: this.seriesColors.get(item.tag) })
        state = { line, className, points: [], enabled: false }
        this.seriesState.set(item.tag, state)
        this.plot.addPlot(line)
        changed = true
      }

      const enabled = item.enabled !== false
      if (state.enabled !== enabled || (enabled && state.points !== item.points)) {
        state.line.setPoints(enabled ? [...item.points] : [])
      }
      state.points = item.points
      state.enabled = enabled
    }

    if (changed) this.updateInteractions()
  }

  private updateInteractions() {
    for (const component of this.interactionComponents) this.interaction.removeComponent(component)
    this.interactionComponents = []

    const lines = [...this.seriesState.values()].map(state => state.line)
    if (!lines.length) return

    const interactions = lines.slice(1).reduce<AutoLineInteraction<T>>(
      (source, line) => source.union(line.interaction), lines[0].interaction)
    const selection = interactions.nearestByAxis('x')
    const strokeSelection = interactions.nearStroke({ maxDistance: 20 }).nearest()
    const callbacks = new CallbackComponent()
    callbacks.on('click', event => {
      if (!this.onSeriesClick.hasListeners) return
      const frame = new InteractionFrame(event.space, {
        key: Symbol('click'),
        pointer: { point: event.point, cursor: event.cursor, isTouch: event.isTouch },
      })
      const [hit] = frame.resolve(strokeSelection)
      if (typeof hit?.interactionTag === 'string') this.onSeriesClick.emit({ tag: hit.interactionTag, event })
    })

    let highlight: Highlight | null = null

    if (lines.length > 1) {
      highlight = new Highlight({
        selection: strokeSelection,
        class: 'highlighted',
      })

      if (this.highlightSync) highlight.syncWith(this.highlightSync)
    }

    this.interactionComponents = [
      callbacks,
      ...(highlight ? [highlight] : []),
      new VerticalLine({ selection, offset: { start: -4, end: 0 } }),
      new MarkerOverlay({
        selection,
        size: 4,
        maskSize: 6,
        markerClasses: 'time-series-hover-marker',
        classesForHit: hit => typeof hit.interactionTag === 'string' ? this.seriesState.get(hit.interactionTag)?.className ?? [] : [],
        colorForHit: hit => typeof hit.interactionTag === 'string' ? this.seriesColors.get(hit.interactionTag) : undefined,
        targetMasks: [this.mask.root],
      }),
      new ChartTooltip({
        selection,
        tooltipPivot: 'nearest',
        exposeHighlights: highlight ? [highlight] : [],
        onHide: () => this.tooltipCtx.value = null,
        onPositionChange: ctx => this.tooltipCtx.value = ctx,
      }),
    ]

    for (const component of this.interactionComponents) this.interaction.addComponent(component)
  }

  private yLabels({ formatValue, fractional = false, minValue }: TimeSeriesValueFormat): LabelsOptions {
    const steps = [
      ...(fractional ? [0.01, 0.02, 0.05, 0.1, 0.2, 0.5] : []),
      1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000,
    ]
    const candidates = labelCandidates({ step: steps })
    const candidateSteps = candidates.map(candidate => (candidate.source as { step: number }).step)

    return {
      values: candidates,
      labelForValue: (value, ctx) => formatValue(value, candidateSteps[ctx.candidateIndex]),
      keyForValue: value => `${value}`,
      padding: { clip: 20, flow: 8 },
      labelOffset: 8,
      strategy: 'classic-flow',
      from: minValue,
      onlyFitted: true,
    }
  }
}
