import type { TimeSeriesStep } from './timeSeries'

export const DAY = 24 * 60 * 60

export function utcDayStart(day: string): number {
  return Date.parse(`${day}T00:00:00Z`) / 1000
}

export function nextTimeSeriesPeriod(start: number, step: TimeSeriesStep): number {
  if (step === 'day') return start + DAY
  if (step === 'week') return start + 7 * DAY

  const date = new Date(start * 1000)
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1) / 1000
}

export function timeSeriesPeriodWindow(periodStart: string, step: TimeSeriesStep, beforeDayStart: number) {
  const start = utcDayStart(periodStart)
  const end = Math.min(nextTimeSeriesPeriod(start, step), beforeDayStart)
  return { start, end }
}

export function utcDayString(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().slice(0, 10)
}
