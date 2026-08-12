import { LinePoint } from './linePoints'

export type SeriesPreset = 'aligned' | 'grids' | 'gap' | 'overlap'

export const seriesPresets = [
  { value: 'aligned', label: 'общая сетка X' },
  { value: 'grids', label: 'разные сетки X' },
  { value: 'gap', label: 'null в победившем X' },
  { value: 'overlap', label: 'совпадающие координаты' },
] as const

const COUNT = 24

// Имя серии живёт в самой точке: по нему стенд красит маркер и строку тултипа,
// а source-индекс для этого искать не приходится
function point(series: string, x: number, y: number): LinePoint {
  return { x, y, label: `${series}${x}`, flagged: false }
}

function wave(series: string, base: number, amplitude: number, phase: number, step = 1): LinePoint[] {
  const points: LinePoint[] = []
  for (let x = 0; x < COUNT; x += step) points.push(point(series, x, base + amplitude * Math.sin(x / 3.5 + phase)))
  return points
}

const SERIES_CLASSES: Record<string, string> = { A: 's0', B: 's1', C: 's2' }

export function seriesClass(datum: LinePoint): string {
  return SERIES_CLASSES[datum.label[0]] ?? 's0'
}

export function presetSeries(preset: SeriesPreset): (LinePoint | null)[][] {
  if (preset === 'grids') return [
    wave('A', 500, 220, 0),
    wave('B', 640, 150, 1.2, 2),
    wave('C', 360, 120, 2.4, 3),
  ]

  if (preset === 'gap') return [
    wave('A', 500, 220, 0),
    wave('B', 640, 150, 1.2).map(p => p.x >= 9 && p.x <= 14 ? null : p),
    wave('C', 360, 120, 2.4),
  ]

  // A и B совпадают точка в точку: две строки тултипа, но одна линия и один маркер
  if (preset === 'overlap') {
    const a = wave('A', 500, 220, 0)
    return [a, a.map(p => point('B', p.x, p.y)), wave('C', 300, 90, 2.4)]
  }

  return [
    wave('A', 500, 220, 0),
    wave('B', 640, 150, 1.2),
    wave('C', 360, 120, 2.4),
  ]
}
