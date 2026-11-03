import { DAILY_CACHE, IMMUTABLE_CACHE } from '@/db/cache'
import type { HistoryStep } from '../../../timeSeries/period/historyStep'
import type { HistoryRange } from './types'

function periodStart(day: string, step: HistoryStep) {
  const date = new Date(`${day}T00:00:00Z`)
  if (step === 'week') date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7)
  if (step === 'month') date.setUTCDate(1)
  return date.toISOString().slice(0, 10)
}

export function vehicleHistoryRanges(beforeDay: string, step: HistoryStep): HistoryRange[] {
  // Границы недель сдвигаются к понедельнику: один период всегда считается
  // целиком в БД, без объединения готовых квантилей или числа игроков в браузере.
  const year = periodStart(`${beforeDay.slice(0, 4)}-01-01`, step)
  const month = periodStart(`${beforeDay.slice(0, 7)}-01`, step)
  const until = periodStart(beforeDay, step)
  const ranges: HistoryRange[] = [{ from: null, until: year, cache: IMMUTABLE_CACHE, recent: false }]
  if (year < month) ranges.push({ from: year, until: month, cache: IMMUTABLE_CACHE, recent: false })
  if (month < until) ranges.push({ from: month, until, cache: DAILY_CACHE, recent: true })
  return ranges
}

