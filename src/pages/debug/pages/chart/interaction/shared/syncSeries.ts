import { LinePoint } from './linePoints'

function point(index: number, x: number, y: number): LinePoint {
  return { x, y, label: `p${index}`, flagged: false }
}

// Комплементарные разрывы и разные Y-масштабы: один и тот же hover показывает оба направления.
// Случай «gap на source chart, datum на follower chart» наводится наведением на chart A (разрыв 8..14
// у A, но не у B), обратный случай — наведением на chart B (разрыв 2..7 у B, но не у A)
export function syncSeriesA(): (LinePoint | null)[] {
  return Array.from({ length: 24 }, (_, i) => {
    if (i >= 8 && i <= 14) return null
    return point(i, i, 500 + 220 * Math.sin(i / 3.2))
  })
}

// Y на порядок больше, чем у A: withInput() проецирует только X, поэтому несовпадающие Y-масштабы
// не мешают nearestByAxis('x')
export function syncSeriesB(): (LinePoint | null)[] {
  return Array.from({ length: 24 }, (_, i) => {
    if (i >= 2 && i <= 7) return null
    return point(i, i, 6000 + 1800 * Math.cos(i / 2.6))
  })
}
