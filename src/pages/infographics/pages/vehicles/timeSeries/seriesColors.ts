import { seriesColor } from '@/shared/ui/chart/seriesColors'
import type { VehicleHistorySplit } from './historySplit'

const resultSeriesColors: Readonly<Record<string, string>> = {
  win: '#30d158',
  loss: '#ff375f',
  draw: '#ffd60a',
}

export function historySplitSeriesColor(split: VehicleHistorySplit, key: string, index: number) {
  if (split === 'result') return resultSeriesColors[key] ?? seriesColor(index)
  return seriesColor(index)
}
