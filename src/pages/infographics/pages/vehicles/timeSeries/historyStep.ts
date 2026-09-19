import { DAY } from './timeLabels'

export type HistoryStep = 'day' | 'week' | 'month'
export type HistoryAverageWindow = 3 | 5 | 7 | null

export function minimumHistoryWindow(step: HistoryStep): number {
  if (step === 'day') return 3 * DAY
  if (step === 'week') return 3 * 7 * DAY
  return 3 * 31 * DAY
}

export function historyDayStart(day: string): number {
  return Date.parse(`${day}T00:00:00Z`) / 1000
}

export function nextHistoryPeriod(start: number, step: HistoryStep): number {
  if (step === 'day') return start + DAY
  if (step === 'week') return start + 7 * DAY

  const date = new Date(start * 1000)
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1) / 1000
}

export function historyPeriodWindow(periodStart: string, step: HistoryStep, beforeDayStart: number) {
  const start = historyDayStart(periodStart)
  const end = Math.min(nextHistoryPeriod(start, step), beforeDayStart)
  return { start, end }
}

export function historyDayString(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().slice(0, 10)
}
