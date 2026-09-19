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
import { AutoLabels, type Options as LabelsOptions } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { labelCandidates } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/labelCandidates'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import type { AutoLineInteraction, LinePointHit } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLineInteractionSource'
import { TicksByLabels } from '@/shared/uiKit/chart/universalChart/ticks/TicksByLabels'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import { availableSlots, formatSlotValue, type Slot } from '../vehicleListTable/helpers'
import { DAY, timeLabels } from './timeLabels'
import { historyDayStart, historyDayString, historyPeriodWindow, minimumHistoryWindow, nextHistoryPeriod, type HistoryAverageWindow, type HistoryStep } from './historyStep'
import { ChartMask } from '@/shared/uiKit/chart/universalChart/defs/ChartMask'

export type VehicleHistoryPeriod = { periodStart: string } & Record<Slot, number | null>
export type VehicleHistorySeries = { tag: string, name: string, color: string, history: VehicleHistoryPeriod[], enabled?: boolean }
type HistoryPoint = { series: string, name: string, color: string, x: number, y: number, periodStart: string, periodEnd: string, step: HistoryStep, battles: number | null, slot: Slot }
export type VehicleHistoryHit = LinePointHit<HistoryPoint>

let nextChartStyleScope = 0

export class VehicleHistoryChart extends UniversalChart {
  readonly tooltipCtx = shallowRef<TooltipCtx<VehicleHistoryHit> | null>(null)

  private readonly lines = new Map<string, AutoLine<HistoryPoint>>()
  private readonly plot = new PlotGroup()
  private readonly interaction = new InteractionController()
  private interactionComponents: InteractionComponent[] = []
  private readonly mask = new ChartMask('center', { top: -4, bottom: -4 })
  private readonly seriesStyle = document.createElementNS('http://www.w3.org/2000/svg', 'style')
  private readonly styleScopeClass = `vehicle-history-chart-${nextChartStyleScope++}`
  private seriesClassByTag = new Map<string, string>()
  private readonly labelsX: AutoLabels
  private readonly labelsY: AutoLabels
  private readonly zoom: ZoomChartComponent
  private labelStep: HistoryStep = 'day'
  private interval: { minX: number, maxX: number, step: HistoryStep } | null = null

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
    this.labelsX = new AutoLabels('horizontal', timeLabels('day')).clipBy(clipBottom)
    this.labelsY = new AutoLabels('vertical', this.yLabels('battles')).clipBy(clipLeft)
    this.svg.classList.add(this.styleScopeClass)
    this.svg.appendChild(this.seriesStyle)

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

  setHistory(history: VehicleHistoryPeriod[], slot: Slot, today: string, step: HistoryStep, averageWindow: HistoryAverageWindow = null) {
    this.setHistories([{ tag: 'vehicle', name: '', color: 'var(--blue-thin-color)', history }], slot, today, step, averageWindow)
  }

  setHistories(series: VehicleHistorySeries[], slot: Slot, today: string, step: HistoryStep, averageWindow: HistoryAverageWindow = null) {
    this.tooltipCtx.value = null
    if (this.labelStep !== step) {
      this.labelsX.updateOptions(timeLabels(step))
      this.labelStep = step
    }
    this.labelsY.updateOptions(this.yLabels(slot))
    const tags = new Set(series.map(item => item.tag))
    const nextSeriesClassByTag = new Map<string, string>()
    const colorRules: string[] = []
    let changed = false
    for (const [tag, line] of this.lines) {
      if (tags.has(tag)) continue
      this.plot.removePlot(line)
      this.lines.delete(tag)
      changed = true
    }
    for (const [index, item] of series.entries()) {
      let line = this.lines.get(item.tag)
      if (!line) {
        line = new AutoLine<HistoryPoint>({ classes: 'history-line', interactionTag: item.tag })
        this.lines.set(item.tag, line)
        this.plot.addPlot(line)
        changed = true
      }
      const previousClass = this.seriesClassByTag.get(item.tag)
      const seriesClass = `history-series-${index}`
      if (previousClass && previousClass !== seriesClass) line.getRootElement().classList.remove(previousClass)
      line.getRootElement().classList.add(seriesClass)
      nextSeriesClassByTag.set(item.tag, seriesClass)
      colorRules.push(`.${this.styleScopeClass} .${seriesClass} { color: ${item.color}; }`)
      const points = item.enabled === false ? [] : this.historyPoints(item, slot, today, step)
      line.setPoints(averageWindow === null ? points : this.averagePoints(points, averageWindow))
    }
    this.seriesClassByTag = nextSeriesClassByTag
    this.seriesStyle.textContent = colorRules.join('\n')
    if (changed) this.updateInteractions()

    const starts = series.flatMap(item => item.history.length ? [historyDayStart(item.history[0].periodStart)] : [])
    if (!starts.length) {
      if (!series.length) this.interval = null
      return
    }
    const minX = Math.min(...starts, historyDayStart('2024-01-01'))
    const maxX = historyDayStart(today)
    if (this.interval?.minX === minX && this.interval.maxX === maxX && this.interval.step === step) return

    this.interval = { minX, maxX, step }
    this.zoom.updateOptions({
      chart: this,
      zoom: true,
      panDirection: 'horizontal',
      limits: {
        minX, maxX,
        minDeltaX: Math.min(minimumHistoryWindow(step), maxX - minX),
        maxDeltaX: maxX - minX,
        elastic: true
      },
    })
    this.showAllHistory()
  }

  private updateInteractions() {
    for (const component of this.interactionComponents) this.interaction.removeComponent(component)
    this.interactionComponents = []
    const lines = [...this.lines.values()]
    if (!lines.length) return
    const interactions = lines.slice(1).reduce<AutoLineInteraction<HistoryPoint>>((source, line) => source.union(line.interaction), lines[0].interaction)
    const selection = interactions.nearestByAxis('x')
    // У точек выбранной даты одинаковый X, поэтому nearest выбирает ближайшую по Y.
    const nearest = selection.nearest()
    const highlight = lines.length > 1
      ? new Highlight({
        selection: {
          interactionSources: selection.interactionSources,
          resolve: ctx => ctx.frame.resolve(nearest).map(hit => ({
            ...hit,
            targets: interactions.sources.flatMap(source => source.getTargets(hit.datum.series)),
          })),
        },
        class: 'highlighted',
      })
      : null
    if (highlight && this.highlightSync) highlight.syncWith(this.highlightSync)
    this.interactionComponents = [
      ...(highlight ? [highlight] : []),
      new VerticalLine({ selection, offset: { start: -4, end: 0 } }),
      new MarkerOverlay({
        selection,
        size: 4,
        maskSize: 6,
        markerClasses: 'history-hover-marker',
        classesForHit: hit => this.seriesClassByTag.get(hit.datum.series) ?? [],
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

  private historyPoints(series: VehicleHistorySeries, slot: Slot, today: string, step: HistoryStep) {
    const points: (HistoryPoint | null)[] = []
    let previousStart: number | null = null
    const todayStart = historyDayStart(today)
    for (const row of series.history) {
      const { start, end } = historyPeriodWindow(row.periodStart, step, todayStart)
      const x = (start + end) / 2
      const value = row[slot]
      // Пропущенные периоды и NULL остаются разрывами, а не превращаются в нули.
      if (previousStart !== null && start > nextHistoryPeriod(previousStart, step)) points.push(null)
      points.push(value !== null && Number.isFinite(value) ? {
        series: series.tag, name: series.name, color: series.color, x, y: value, periodStart: row.periodStart, periodEnd: historyDayString(end - DAY), step, battles: row.battles, slot
      } : null)
      previousStart = start
    }
    return points
  }

  showAllHistory() {
    if (this.interval) this.setRenderBounds({ ...this.interval, minY: null, maxY: null })
  }

  private averagePoints(points: (HistoryPoint | null)[], window: NonNullable<HistoryAverageWindow>): (HistoryPoint | null)[] {
    const averaged = [...points]
    const radius = Math.floor(window / 2)
    let segmentStart = 0

    while (segmentStart < points.length) {
      if (points[segmentStart] === null) {
        segmentStart++
        continue
      }

      let segmentEnd = segmentStart
      while (segmentEnd < points.length && points[segmentEnd] !== null) segmentEnd++

      for (let index = segmentStart; index < segmentEnd; index++) {
        const from = Math.max(segmentStart, index - radius)
        const to = Math.min(segmentEnd, index + radius + 1)
        let sum = 0
        for (let neighbor = from; neighbor < to; neighbor++) sum += points[neighbor]!.y
        averaged[index] = { ...points[index]!, y: sum / (to - from) }
      }

      segmentStart = segmentEnd
    }

    return averaged
  }

  private yLabels(slot: Slot): LabelsOptions {
    const definition = availableSlots[slot]
    const fractional = 'format' in definition && (definition.format === 'decimal' || definition.format === 'percent')

    const steps = [
      ...(fractional ? [0.01, 0.02, 0.05, 0.1, 0.2, 0.5] : []),
      1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000,
    ]
    const candidates = labelCandidates({ step: steps })
    const candidateSteps = candidates.map(candidate => (candidate.source as { step: number }).step)

    return {
      values: candidates,
      labelForValue: (value, ctx) => formatSlotValue(slot, value, candidateSteps[ctx.candidateIndex]),
      keyForValue: value => `${value}`,
      padding: { clip: 20, flow: 8 },
      labelOffset: 8,
      strategy: 'classic-flow',
      from: 0,
      onlyFitted: true,
    }
  }
}
