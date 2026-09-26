import { ColorHSVA } from '@/shared/uiKit/colorPicker/ColorHSVA'
import type { VehicleHistorySplit } from './historySplit'

export const historySeriesColors = ['#0a84ff', '#ff9f0a', '#30d158', '#bf5af2', '#ff375f', '#64d2ff', '#ffd60a', '#ac8e68', '#5e5ce6', '#63e6be'] as const

const resultSeriesColors: Readonly<Record<string, string>> = {
  win: '#30d158',
  loss: '#ff375f',
  draw: '#ffd60a',
}

export function historySeriesColor(index: number) {
  if (index < historySeriesColors.length) return historySeriesColors[index]

  const hue = Math.round((index - historySeriesColors.length) * 137.508 + 18) % 360
  const color = new ColorHSVA(0, 0, 0)
  color.setHsla(hue, 0.72, 0.64)
  return `#${color.toHex().slice(0, 6)}`
}

export function historySplitSeriesColor(split: VehicleHistorySplit, key: string, index: number) {
  if (split === 'result') return resultSeriesColors[key] ?? historySeriesColor(index)
  return historySeriesColor(index)
}
