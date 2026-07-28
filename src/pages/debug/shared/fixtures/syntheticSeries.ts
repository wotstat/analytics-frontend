// Синтетические данные для дебаг-страниц. Всё детерминировано: одинаковая картинка
// при каждой перезагрузке, иначе визуальную регрессию не поймать глазом.

import type { ChartPoint, ChartSeries, TableRow } from './types'

export function seededRandom(seed: number) {
  let state = seed >>> 0

  return function next() {
    state = (state + 0x6D2B79F5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Наборы-«злые случаи»: каждый ломает график по-своему.
export const seriesKinds = [
  { value: 'smooth', label: 'Гладкая' },
  { value: 'noisy', label: 'Шумная' },
  { value: 'gaps', label: 'С пропусками' },
  { value: 'huge', label: '100k точек' },
  { value: 'negative', label: 'С отрицательными' },
  { value: 'flat', label: 'Константа' },
  { value: 'single', label: 'Одна точка' },
  { value: 'empty', label: 'Пустой' },
] as const

export type SeriesKind = typeof seriesKinds[number]['value']

const HUGE_COUNT = 100_000

// count игнорируется для huge/single/empty.
export function syntheticSeries(kind: SeriesKind, seed = 1, count = 120): ChartSeries {
  const random = seededRandom(seed)

  switch (kind) {
    case 'smooth':
      return range(count).map(x => ({ x, y: 500 + 300 * Math.sin(x / 14) + 120 * Math.sin(x / 5) }))

    case 'noisy':
      return randomWalk(count, random, 500, 60)

    case 'gaps': {
      const points = randomWalk(count, random, 500, 40)
      // Три разрыва разной длины: одиночный, короткий и длинный.
      const holes = new Set<number>([
        17,
        ...range(6).map(i => 40 + i),
        ...range(15).map(i => 80 + i),
      ])
      return points.map((point, i) => holes.has(i) ? null : point)
    }

    case 'huge':
      // Проверка децимации в MonotoneXPath: точек кратно больше, чем пикселей.
      return randomWalk(HUGE_COUNT, random, 500, 8)

    case 'negative':
      return range(count).map(x => ({ x, y: 400 * Math.sin(x / 11) - 60 + 80 * (random() - 0.5) }))

    case 'flat':
      // Нулевая высота bounds — частый источник делений на ноль в масштабировании.
      return range(count).map(x => ({ x, y: 500 }))

    case 'single':
      return [{ x: 0, y: 500 }]

    case 'empty':
      return []
  }
}

// Несколько рядов сразу — для нескольких линий в одном чарте и для синхронизации.
export function syntheticMultiSeries(seriesCount = 3, seed = 1, count = 120): ChartSeries[] {
  return range(seriesCount).map(i => {
    const random = seededRandom(seed + i * 977)
    return randomWalk(count, random, 300 + i * 250, 35)
  })
}

// Совпадает с формой `BarDataset`.
export function syntheticBarDatasets(datasetCount = 3, categories = 12, seed = 1): { values: number[] }[] {
  return range(datasetCount).map(i => {
    const random = seededRandom(seed + i * 421)
    return { values: range(categories).map(() => Math.round(20 + random() * 80)) }
  })
}

export function syntheticTableRows(count = 200, seed = 1): TableRow[] {
  const random = seededRandom(seed)

  return range(count).map(i => ({
    id: i,
    name: `${pick(NAME_PARTS, random)}_${pick(NAME_SUFFIXES, random)}${i}`,
    battles: Math.round(10 + random() * 4000),
    damage: Math.round(600 + random() * 3200),
    winrate: Math.round((35 + random() * 30) * 100) / 100,
  }))
}

const NAME_PARTS = ['Shadow', 'Steel', 'Iron', 'Thunder', 'Frost', 'Crimson', 'Silent', 'Rapid']
const NAME_SUFFIXES = ['Wolf', 'Hunter', 'Panzer', 'Ace', 'Sniper', 'Ranger']

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)]
}

function range(count: number) {
  return Array.from({ length: count }, (_, i) => i)
}

function randomWalk(count: number, random: () => number, start: number, step: number): ChartPoint[] {
  let value = start

  return range(count).map(x => {
    value += (random() - 0.5) * step
    // Мягкий возврат к среднему, иначе ряд уходит в бесконечность.
    value += (start - value) * 0.02
    return { x, y: value }
  })
}
