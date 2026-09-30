import { TimeSeriesChart, type TimeSeriesHit } from '@/shared/ui/chart/timeSeries/chart/TimeSeriesChart'
import { TimeSeriesAnnotationLayer } from '@/shared/ui/chart/timeSeries/annotations/TimeSeriesAnnotationLayer'
import { TimeSeriesViewport, minimumTimeSeriesWindow } from '@/shared/ui/chart/timeSeries/chart/TimeSeriesViewport'
import type { TimeSeries } from '@/shared/ui/chart/timeSeries/chart/timeSeries'
import { DAY } from '@/shared/ui/chart/timeSeries/utils/timeSeriesTime'
import { movingAveragePoints } from '@/shared/ui/chart/timeSeries/utils/movingAverage'
import type { VehicleHistoryPeriod, VehicleHistorySeries } from '../shared/types'
import { availableSlots, type Slot } from '../shared/vehicleMetrics'
import { formatSlotValue } from '../shared/formatMetricValue'
import {
  historyDayStart, historyDayString, historyPeriodWindow, nextHistoryPeriod,
  type HistoryAverageWindow, type HistoryStep,
} from './historyStep'
import type { HistoryAnnotation } from './historyAnnotations'
import { historyChartAnnotations } from './historyChartAnnotations'

type HistoryPoint = {
  x: number
  y: number
  periodStart: string
  periodEnd: string
  step: HistoryStep
  battles: number | null
  slot: Slot
}

export type VehicleHistoryHit = TimeSeriesHit<HistoryPoint>

export class VehicleHistoryChart extends TimeSeriesChart<HistoryPoint> {
  private readonly viewport = new TimeSeriesViewport(this)
  private readonly annotationLayer = new TimeSeriesAnnotationLayer(this)
  private readonly historyPoints = new Map<string, {
    history: VehicleHistoryPeriod[]
    key: string
    rawPoints: (HistoryPoint | null)[] | null
    points: (HistoryPoint | null)[] | null
    averageWindow: HistoryAverageWindow
  }>()
  private labelSlot: Slot | null = null
  private historyAnnotations: readonly HistoryAnnotation[] = []
  private outagesVisible = false

  setHistories(series: VehicleHistorySeries[], slot: Slot, today: string, step: HistoryStep, averageWindow: HistoryAverageWindow = null) {
    if (this.labelSlot !== slot) {
      const definition = availableSlots[slot]
      this.setValueFormat({
        formatValue: (value, tickStep) => formatSlotValue(slot, value, tickStep),
        fractional: 'format' in definition && (definition.format === 'decimal' || definition.format === 'percent'),
        minValue: 0,
      })
      this.labelSlot = slot
    }

    const key = JSON.stringify([slot, today, step])
    const tags = new Set(series.map(item => item.tag))
    for (const tag of this.historyPoints.keys()) {
      if (!tags.has(tag)) this.historyPoints.delete(tag)
    }

    const points: TimeSeries<HistoryPoint>[] = series.map(item => {
      let cached = this.historyPoints.get(item.tag)
      if (!cached || cached.history !== item.history || cached.key !== key) {
        cached = { history: item.history, key, rawPoints: null, points: null, averageWindow }
        this.historyPoints.set(item.tag, cached)
      }

      if (item.enabled !== false) {
        cached.rawPoints ??= this.preparePoints(item.history, slot, today, step)
        if (cached.points === null || cached.averageWindow !== averageWindow) {
          cached.points = averageWindow === null ? cached.rawPoints : movingAveragePoints(cached.rawPoints, averageWindow)
          cached.averageWindow = averageWindow
        }
      }
      return { tag: item.tag, points: cached.points ?? [], enabled: item.enabled }
    })

    this.setTimeAxis(step)
    this.setSeries(points)
    const starts = series.flatMap(item => item.history.length ? [historyDayStart(item.history[0].periodStart)] : [])
    if (starts.length) {
      this.viewport.update({
        range: {
          minX: Math.min(...starts, historyDayStart('2024-01-01')),
          maxX: historyDayStart(today),
        },
        minWindow: minimumTimeSeriesWindow(step),
        resetKey: step,
      })
    } else if (!series.length) this.viewport.clear()
  }

  showAll() {
    this.viewport.showAll()
  }

  override dispose() {
    this.annotationLayer.dispose()
    super.dispose()
  }

  setHistoryAnnotations(annotations: readonly HistoryAnnotation[]) {
    this.historyAnnotations = annotations
    this.updateHistoryAnnotations()
  }

  setOutagesVisible(visible: boolean) {
    this.outagesVisible = visible
    this.updateHistoryAnnotations()
  }

  private updateHistoryAnnotations() {
    this.annotationLayer.setAnnotations(historyChartAnnotations(this.historyAnnotations, this.outagesVisible))
  }

  private preparePoints(history: VehicleHistoryPeriod[], slot: Slot, today: string, step: HistoryStep) {
    const points: (HistoryPoint | null)[] = []
    let previousStart: number | null = null
    const todayStart = historyDayStart(today)

    for (const row of history) {
      const { start, end } = historyPeriodWindow(row.periodStart, step, todayStart)
      const value = row[slot] ?? null
      // Пропущенные периоды и NULL остаются разрывами, а не превращаются в нули.
      if (previousStart !== null && start > nextHistoryPeriod(previousStart, step)) points.push(null)
      if (value !== null && Number.isFinite(value)) {
        points.push({
          x: (start + end) / 2,
          y: value,
          periodStart: row.periodStart,
          periodEnd: historyDayString(end - DAY),
          step,
          battles: row.battles,
          slot,
        })
      } else points.push(null)
      previousStart = start
    }

    return points
  }
}
