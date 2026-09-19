import type { VehicleHistorySplit } from './historySplit'

export const historySeriesColors = ['#0a84ff', '#ff9f0a', '#30d158', '#bf5af2', '#ff375f', '#64d2ff', '#ffd60a', '#ac8e68', '#5e5ce6', '#63e6be'] as const

const resultSeriesColors: Readonly<Record<string, string>> = {
  win: '#30d158',
  loss: '#ff375f',
  draw: '#ffd60a',
}

export function historySeriesColor(index: number) {
  if (index < historySeriesColors.length) return historySeriesColors[index]

  // На разбиении по картам источников может быть несколько десятков.
  // Золотой угол не даёт соседним сериям сливаться и не повторяет первые десять цветов.
  const hue = Math.round((index - historySeriesColors.length) * 137.508 + 18) % 360
  return `hsl(${hue} 72% 64%)`
}

export function historySplitSeriesColor(split: VehicleHistorySplit, key: string, index: number) {
  if (split === 'result') return resultSeriesColors[key] ?? historySeriesColor(index)
  return historySeriesColor(index)
}
