import { metricTileFor, type Slot } from '../../vehicles/vehicleMetricSelector/vehicleMetrics/vehicleMetrics'

export const achievementHistoryColors = ['#db34f2', '#3cd3fe', '#30d158', '#ffd600']

export function achievementLabel(slot: Slot) {
  if (slot === 'marks_p100') return '100%'
  return metricTileFor(slot).label
}

export function achievementSeriesTag(sourceTag: string, slot: Slot) {
  return JSON.stringify([sourceTag, slot])
}

export function achievementSeriesColor(color: string, index: number, count: number) {
  const opacity = count <= 1 ? 100 : 100 - 60 * index / (count - 1)
  return `color-mix(in srgb, ${color} ${opacity}%, transparent)`
}
