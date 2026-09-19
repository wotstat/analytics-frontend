import { formatStatisticsDay } from '../vehicleListTable/helpers'
import type { HistoryStep } from './historyStep'

const monthFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long', timeZone: 'UTC' })

export function formatHistoryPeriod(start: string, end: string, step: HistoryStep) {
  if (step === 'month') {
    const date = new Date(`${start}T00:00:00Z`)
    const month = monthFormatter.format(date)
    return `${month[0].toUpperCase()}${month.slice(1)} ${date.getUTCFullYear()}`
  }

  const from = formatStatisticsDay(start)
  return start === end ? from : `${from} — ${formatStatisticsDay(end)}`
}
