// Постоянная палитра и алгоритм: изменения UI не перекрашивают старые ссылки.
export const comparisonPalette = ['#0a84ff', '#ff9f0a', '#30d158', '#bf5af2', '#ff375f', '#64d2ff', '#ffd60a', '#ac8e68', '#5e5ce6', '#63e6be'] as const

function hueChannels(hue: number, chroma: number, x: number) {
  if (hue < 1) return [chroma, x, 0]
  if (hue < 2) return [x, chroma, 0]
  if (hue < 3) return [0, chroma, x]
  if (hue < 4) return [0, x, chroma]
  if (hue < 5) return [x, 0, chroma]
  return [chroma, 0, x]
}

export function comparisonColor(color: number | string): string {
  if (typeof color === 'string') return color
  if (color < comparisonPalette.length) return comparisonPalette[color]

  const hue = (Math.round((color - comparisonPalette.length) * 137.508 + 18) % 360) / 60
  const chroma = (1 - Math.abs(2 * 0.64 - 1)) * 0.72
  const x = chroma * (1 - Math.abs(hue % 2 - 1))
  const offset = 0.64 - chroma / 2
  const rgb = hueChannels(hue, chroma, x)

  return '#' + rgb.map(value => Math.round((value + offset) * 255).toString(16).padStart(2, '0')).join('')
}
