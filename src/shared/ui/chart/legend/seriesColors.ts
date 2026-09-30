import { ColorHSVA } from '@/shared/uiKit/colorPicker/ColorHSVA'

export const seriesColors = ['#0a84ff', '#ff9f0a', '#30d158', '#bf5af2', '#ff375f', '#64d2ff', '#ffd60a', '#ac8e68', '#5e5ce6', '#63e6be'] as const

export function seriesColor(index: number) {
  if (index < seriesColors.length) return seriesColors[index]

  const hue = Math.round((index - seriesColors.length) * 137.508 + 18) % 360
  const color = new ColorHSVA(0, 0, 0)
  color.setHsla(hue, 0.72, 0.64)
  return `#${color.toHex().slice(0, 6)}`
}
