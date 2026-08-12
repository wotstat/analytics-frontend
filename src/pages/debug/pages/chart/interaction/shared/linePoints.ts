import { seededRandom } from '@/pages/debug/shared/fixtures/syntheticSeries'

// Доменный объект вместо голого {x, y}: AutoLine generic, и ровно эта ссылка обязана прийти в hit.datum
export type LinePoint = {
  x: number
  y: number
  label: string
  flagged: boolean
}

function point(index: number, x: number, y: number): LinePoint {
  return { x, y, label: `p${index}`, flagged: index % 5 === 0 }
}

// Точек заметно меньше, чем пикселей: маркер обязан прыгать между ними, а не ползти за курсором
export function wavePoints(count = 24): LinePoint[] {
  return Array.from({ length: count }, (_, i) => point(i, i, 500 + 260 * Math.sin(i / 3.5) + 90 * Math.sin(i / 1.3)))
}

// Длинный разрыв посередине: с maxAxisDistance внутри него не должно остаться ни линии, ни маркера
export function gapPoints(): (LinePoint | null)[] {
  return Array.from({ length: 30 }, (_, i) => {
    if (i >= 11 && i <= 19) return null
    return point(i, i, 500 + 200 * Math.sin(i / 4))
  })
}

// Точек кратно больше, чем пикселей: monotone-путь выбрасывает почти все вершины
export function densePoints(count = 20_000): LinePoint[] {
  const random = seededRandom(7)
  let value = 500

  return Array.from({ length: count }, (_, i) => {
    value += (random() - 0.5) * 12
    value += (500 - value) * 0.02
    return point(i, i, value)
  })
}

// Три точки на одном X: bucket по равенству исходного значения возвращает их все
export function duplicateXPoints(): LinePoint[] {
  const xs = [0, 1, 2, 3, 4, 4, 4, 5, 6, 7, 8, 8, 9, 10, 11]
  return xs.map((x, i) => point(i, x, 400 + 60 * i * (i % 2 === 0 ? 1 : -1) / (1 + x)))
}

// Один сплошной сегмент (без null), но с большим горизонтальным разрывом между соседними исходными
// точками: nearStroke обязан находить centerline и посередине разрыва, где данных нет вовсе
export function sparsePoints(): LinePoint[] {
  const left = Array.from({ length: 6 }, (_, i) => point(i, i, 480 + 60 * Math.sin(i)))
  const right = Array.from({ length: 6 }, (_, i) => point(6 + i, 26 + i, 520 + 60 * Math.cos(i)))
  return [...left, ...right]
}

// Пересекаются примерно на середине X: distance до centerline обеих линий сходится к нулю в одной
// точке — удобно проверять tie-order nearStroke().nearest()
export function crossingPair(): [LinePoint[], LinePoint[]] {
  const a = Array.from({ length: 20 }, (_, i) => point(i, i, 380 + 16 * i))
  const b = Array.from({ length: 20 }, (_, i) => point(i, i, 380 + 16 * (19 - i)))
  return [a, b]
}

// Постоянное смещение по Y: линии всюду близки, но не совпадают — nearStroke обязан различать их
// по distance, а не сливать в одну
export function parallelPair(): [LinePoint[], LinePoint[]] {
  const a = wavePoints(20)
  const b = a.map((p, i) => point(i, p.x, p.y + 18))
  return [a, b]
}
