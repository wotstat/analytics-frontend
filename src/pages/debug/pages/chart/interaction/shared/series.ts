import type { ChartSeries } from '@/pages/debug/shared/fixtures/types'

export type Extent = { minX: number, maxX: number, minY: number, maxY: number }

const EMPTY: Extent = { minX: 0, maxX: 1, minY: 0, maxY: 1 }

// Лимиты зума задаются в единицах данных, поэтому их надо считать от текущего набора.
export function seriesExtent(series: ChartSeries[]): Extent {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const points of series) {
    for (const point of points) {
      if (!point) continue
      if (point.x < minX) minX = point.x
      if (point.x > maxX) maxX = point.x
      if (point.y < minY) minY = point.y
      if (point.y > maxY) maxY = point.y
    }
  }

  if (!Number.isFinite(minX) || minX === maxX) return EMPTY
  return { minX, maxX, minY, maxY: minY === maxY ? maxY + 1 : maxY }
}
