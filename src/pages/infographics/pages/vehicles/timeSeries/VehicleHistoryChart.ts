import { shallowRef } from 'vue'
import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { ChartClip } from '@/shared/uiKit/chart/universalChart/defs/ChartClip'
import { ChartTooltip, type TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { VerticalLine } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/lines/VerticalLine'
import { MarkerOverlay } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/markerOverlay/MarkerOverlay'
import { ZoomChartComponent } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/zoomChartComponent/ZoomChartComponent'
import { InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { AutoLabels, type Options as LabelsOptions } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { labelCandidates } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/labelCandidates'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import type { LinePointHit } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLineInteractionSource'
import { TicksByLabels } from '@/shared/uiKit/chart/universalChart/ticks/TicksByLabels'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import { availableSlots, formatSlotValue, type Slot } from '../vehicleListTable/helpers'
import { DAY, timeLabels } from './timeLabels'
import { historyDayStart, historyDayString, historyPeriodWindow, minimumHistoryWindow, nextHistoryPeriod, type HistoryStep } from './historyStep'
import { ChartMask } from '@/shared/uiKit/chart/universalChart/defs/ChartMask'

export type VehicleHistoryPeriod = { periodStart: string } & Record<Slot, number | null>
type HistoryPoint = { x: number, y: number, periodStart: string, periodEnd: string, battles: number | null, slot: Slot }
export type VehicleHistoryHit = LinePointHit<HistoryPoint>

export class VehicleHistoryChart extends UniversalChart {
  readonly tooltipCtx = shallowRef<TooltipCtx<VehicleHistoryHit> | null>(null)

  private readonly line = new AutoLine<HistoryPoint>({ classes: 'history-line', smoothingMethod: 'monotone' })
  private readonly labelsX: AutoLabels
  private readonly labelsY: AutoLabels
  private readonly zoom: ZoomChartComponent
  private labelStep: HistoryStep = 'day'
  private interval: { minX: number, maxX: number, step: HistoryStep } | null = null

  constructor() {
    super({
      layoutVariant: 'vertical',
      renderManager: globalChartRenderManagerSteps4,
      renderBoundsPxPadding: { top: 12, bottom: 12 },
      minLayoutSize: { top: 8, right: 8 },
    })

    const clip = new ChartClip('center', { top: -4, bottom: -4 })
    const mask = new ChartMask('center', { top: -4, bottom: -4 })
    const clipLeft = new ChartClip('left')
    const clipBottom = new ChartClip('bottom')
    this.labelsX = new AutoLabels('horizontal', timeLabels('day')).clipBy(clipBottom)
    this.labelsY = new AutoLabels('vertical', this.yLabels('battles')).clipBy(clipLeft)

    this.zoom = new ZoomChartComponent({ chart: this, zoom: true, panDirection: 'horizontal' })
    const selection = this.line.interaction.nearestByAxis('x')
    const interaction = new InteractionController()
      .addComponent(this.zoom)
      .addComponent(new VerticalLine({ selection, offset: { start: -4, end: 0 } }))
      .addComponent(new MarkerOverlay({ selection, size: 4, maskSize: 6, markerClasses: 'history-hover-marker', targetMasks: [mask.root] }))
      .addComponent(new ChartTooltip({
        selection,
        onHide: () => this.tooltipCtx.value = null,
        onPositionChange: ctx => this.tooltipCtx.value = ctx,
      }))

    const plot = new PlotGroup()
      .addPlot(this.line)
      .clipBy(clip)
      .maskBy(mask)

    this
      .addPlot(new TicksByLabels(this.labelsY), 'grid')
      .addPlot(new TicksByLabels(this.labelsX, { classes: 'time-grid' }), 'grid')
      .addPlot(plot, 'plot')
      .addSlot('bottom', this.labelsX, 'labels')
      .addSlot('left', this.labelsY, 'labels')
      .addPlot(interaction)
      .addDefs(clip, clipLeft, clipBottom, mask)
  }

  setHistory(history: VehicleHistoryPeriod[], slot: Slot, today: string, step: HistoryStep) {
    this.tooltipCtx.value = null
    if (this.labelStep !== step) {
      this.labelsX.updateOptions(timeLabels(step))
      this.labelStep = step
    }
    this.labelsY.updateOptions(this.yLabels(slot))

    const points: (HistoryPoint | null)[] = []
    let previousStart: number | null = null
    const todayStart = historyDayStart(today)
    for (const row of history) {
      const { start, end } = historyPeriodWindow(row.periodStart, step, todayStart)
      const x = (start + end) / 2
      const value = row[slot]
      // Пропущенные периоды и NULL остаются разрывами, а не превращаются в нули.
      if (previousStart !== null && start > nextHistoryPeriod(previousStart, step)) points.push(null)
      points.push(value !== null && Number.isFinite(value) ? {
        x, y: value, periodStart: row.periodStart, periodEnd: historyDayString(end - DAY), battles: row.battles, slot
      } : null)
      previousStart = start
    }
    this.line.setPoints(points)

    if (!history.length) return
    const minX = Math.min(historyDayStart(history[0].periodStart), historyDayStart('2024-01-01'))
    const maxX = todayStart
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

  showAllHistory() {
    if (this.interval) this.setRenderBounds({ ...this.interval, minY: null, maxY: null })
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
