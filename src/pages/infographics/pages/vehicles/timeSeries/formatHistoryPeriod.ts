import { formatStatisticsDay } from '../shared/formatStatisticsDay'
import type { HistoryStep } from './historyStep'

const monthFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long', timeZone: 'UTC' })
const weekdayFormatter = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', timeZone: 'UTC' })

export function formatHistoryPeriod(start: string, end: string, step: HistoryStep) {
  if (step === 'month') {
    const date = new Date(`${start}T00:00:00Z`)
    const month = monthFormatter.format(date)
    return `${month[0].toUpperCase()}${month.slice(1)} ${date.getUTCFullYear()}`
  }

  const from = formatStatisticsDay(start)
  if (step === 'day') {
    const weekday = weekdayFormatter.format(new Date(`${start}T00:00:00Z`)).replace('.', '')
    return `${from} · ${weekday}`
  }

  return start === end ? from : `${from} — ${formatStatisticsDay(end)}`
}
