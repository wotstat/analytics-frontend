import type { TimeSeriesChart } from './TimeSeriesChart'
import type { TimeSeriesRange, TimeSeriesStep } from './timeSeries'
import { DAY } from '../utils/timeSeriesTime'

type ViewportOptions = {
  range: TimeSeriesRange
  minWindow?: number
  resetKey?: unknown
}

// Необязательная политика: новые границы или ключ сбрасывают окно, остальные обновления сохраняют его.
export class TimeSeriesViewport {
  private range: TimeSeriesRange | null = null
  private minWindow = 0
  private resetKey: unknown

  constructor(private readonly chart: Pick<TimeSeriesChart, 'setZoomLimits' | 'setRenderBounds'>) { }

  update({ range, minWindow = 0, resetKey }: ViewportOptions) {
    const reset = this.range?.minX !== range.minX || this.range.maxX !== range.maxX || this.resetKey !== resetKey
    if (!reset && this.minWindow === minWindow) return

    this.range = { ...range }
    this.minWindow = minWindow
    this.resetKey = resetKey
    this.chart.setZoomLimits({
      ...range,
      minDeltaX: Math.min(minWindow, range.maxX - range.minX),
      maxDeltaX: range.maxX - range.minX,
      elastic: true,
    })
    if (reset) this.showAll()
  }

  clear() {
    this.range = null
    this.resetKey = undefined
  }

  showAll() {
    if (this.range) this.chart.setRenderBounds({ ...this.range, minY: null, maxY: null })
  }
}

// Пресет истории: три периода. Потребитель выбирает его независимо от календарной оси.
export function minimumTimeSeriesWindow(step: TimeSeriesStep): number {
  if (step === 'day') return 3 * DAY
  if (step === 'week') return 3 * 7 * DAY
  return 3 * 31 * DAY
}
