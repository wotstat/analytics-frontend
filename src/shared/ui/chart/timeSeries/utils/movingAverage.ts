import type { TimeSeriesPoint } from '../chart/timeSeries'

export function movingAveragePoints<T extends TimeSeriesPoint>(points: readonly (T | null)[], window: number): (T | null)[] {
  if (!Number.isInteger(window) || window < 1 || window % 2 === 0) {
    throw new RangeError('Окно скользящего среднего должно быть положительным нечётным целым числом')
  }

  const averaged = [...points]
  const radius = Math.floor(window / 2)
  let segmentStart = 0

  while (segmentStart < points.length) {
    if (points[segmentStart] === null) {
      segmentStart++
      continue
    }

    let segmentEnd = segmentStart
    while (segmentEnd < points.length && points[segmentEnd] !== null) segmentEnd++

    for (let index = segmentStart; index < segmentEnd; index++) {
      const from = Math.max(segmentStart, index - radius)
      const to = Math.min(segmentEnd, index + radius + 1)

      let sum = 0
      for (let neighbor = from; neighbor < to; neighbor++) sum += points[neighbor]!.y
      averaged[index] = { ...points[index]!, y: sum / (to - from) }
    }

    segmentStart = segmentEnd
  }

  return averaged
}
