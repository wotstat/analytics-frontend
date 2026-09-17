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

export type VehicleHistoryDay = { day: string } & Record<Slot, number | null>
type HistoryPoint = { x: number, y: number, day: string, battles: number | null, slot: Slot }
export type VehicleHistoryHit = LinePointHit<HistoryPoint>

export class VehicleHistoryChart extends UniversalChart {
  readonly tooltipCtx = shallowRef<TooltipCtx<VehicleHistoryHit> | null>(null)

  private readonly line = new AutoLine<HistoryPoint>({ classes: 'history-line', smoothingMethod: 'monotone' })
  private readonly labelsY: AutoLabels
  private readonly zoom: ZoomChartComponent
  private interval: { minX: number, maxX: number } | null = null

  constructor() {
    super({
      layoutVariant: 'vertical',
      renderManager: globalChartRenderManagerSteps4,
      renderBoundsPadding: { top: 0.1, bottom: 0.1 },
      minLayoutSize: { top: 8, right: 8 },
    })

    const clip = new ChartClip('center', { top: -4, bottom: -4 })
    const clipLeft = new ChartClip('left')
    const clipBottom = new ChartClip('bottom')
    const labelsX = new AutoLabels('horizontal', timeLabels()).clipBy(clipBottom)
    this.labelsY = new AutoLabels('vertical', this.yLabels('battles')).clipBy(clipLeft)

    this.zoom = new ZoomChartComponent({ chart: this, zoom: true, panDirection: 'horizontal' })
    const selection = this.line.interaction.nearestByAxis('x')
    const interaction = new InteractionController()
      .addComponent(this.zoom)
      .addComponent(new VerticalLine({ selection, offset: { start: -4, end: 0 } }))
      .addComponent(new MarkerOverlay({ selection, size: 5, markerClasses: 'history-hover-marker' }))
      .addComponent(new ChartTooltip({
        selection,
        onHide: () => this.tooltipCtx.value = null,
        onPositionChange: ctx => this.tooltipCtx.value = ctx,
      }))

    this
      .addPlot(new TicksByLabels(this.labelsY), 'grid')
      .addPlot(new TicksByLabels(labelsX, { classes: 'time-grid' }), 'grid')
      .addPlot(new PlotGroup().addPlot(this.line).clipBy(clip), 'plot')
      .addSlot('bottom', labelsX, 'labels')
      .addSlot('left', this.labelsY, 'labels')
      // Источник интерактива должен видеть геометрию уже отрисованной линии.
      .addPlot(interaction)
      .addDefs(clip, clipLeft, clipBottom)
  }

  setHistory(history: VehicleHistoryDay[], slot: Slot, today: string) {
    this.tooltipCtx.value = null
    this.labelsY.updateOptions(this.yLabels(slot))

    const points: (HistoryPoint | null)[] = []
    let previousX: number | null = null
    for (const row of history) {
      const x = Date.parse(`${row.day}T00:00:00Z`) / 1000 + DAY / 2
      const value = row[slot]
      // Пропущенные дни и NULL остаются разрывами, а не превращаются в нули.
      if (previousX !== null && x - previousX > DAY) points.push(null)
      points.push(value !== null && Number.isFinite(value) ? { x, y: value, day: row.day, battles: row.battles, slot } : null)
      previousX = x
    }
    this.line.setPoints(points)
    const values = points.filter((point): point is HistoryPoint => point !== null)
    const minY = Math.min(...values.map(point => point.y))
    const maxY = Math.max(...values.map(point => point.y))
    const padding = values.length ? Math.max((maxY - minY) * 0.08, Math.abs(maxY) * 0.01, 0.01) : 1
    this.setRenderBoundsPadding({ top: padding, bottom: padding })

    if (!history.length) return
    const minX = Date.parse(`${history[0].day}T00:00:00Z`) / 1000
    const maxX = Date.parse(`${today}T00:00:00Z`) / 1000
    if (this.interval?.minX === minX && this.interval.maxX === maxX) return

    this.interval = { minX, maxX }
    this.zoom.updateOptions({
      chart: this,
      zoom: true,
      panDirection: 'horizontal',
      limits: { minX, maxX, minDeltaX: Math.min(3 * DAY, maxX - minX), maxDeltaX: maxX - minX, elastic: true },
    })
    this.showAllHistory()
  }

  showAllHistory() {
    if (this.interval) this.setRenderBounds({ ...this.interval, minY: null, maxY: null })
  }

  private yLabels(slot: Slot): LabelsOptions {
    const definition = availableSlots[slot]
    const fractional = 'format' in definition && (definition.format === 'decimal' || definition.format === 'percent')
    return {
      values: labelCandidates({
        step: [
          ...(fractional ? [0.01, 0.02, 0.05, 0.1, 0.2, 0.5] : []),
          1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 50000, 100000,
        ]
      }),
      labelForValue: value => formatSlotValue(slot, value),
      keyForValue: value => `${value}`,
      padding: { clip: 8, flow: 8 },
      labelOffset: 8,
      strategy: 'classic-flow',
      from: 0,
      onlyFitted: true,
    }
  }
}
