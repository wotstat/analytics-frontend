import { isFinitePoint, Point } from '../../../../utils/Point'

export function smoothPath(points: Point[], smoothing = 1, precision = 2): { path: string, nodes: Float64Array } {
  if (points.length === 0 || !points.every(isFinitePoint) || !Number.isFinite(smoothing))
    return { path: '', nodes: new Float64Array(0) }

  const nodes = new Float64Array(points.length * 6).fill(NaN)
  const coordinates = points.map((point, i) => {
    const x = point.x.toFixed(precision)
    const y = point.y.toFixed(precision)
    nodes[i * 6] = Number(x)
    nodes[i * 6 + 1] = Number(y)
    return `${x} ${y}`
  })

  if (points.length < 3) {
    const path = coordinates.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point}`).join(' ')
    return { path, nodes }
  }

  const d: string[] = []

  d.push(`M ${coordinates[0]}`)

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2

    const cp1x = (p1.x + ((p2.x - p0.x) / 6) * smoothing).toFixed(precision)
    const cp1y = (p1.y + ((p2.y - p0.y) / 6) * smoothing).toFixed(precision)

    const cp2x = (p2.x - ((p3.x - p1.x) / 6) * smoothing).toFixed(precision)
    const cp2y = (p2.y - ((p3.y - p1.y) / 6) * smoothing).toFixed(precision)

    nodes.set([Number(cp1x), Number(cp1y), Number(cp2x), Number(cp2y)], (i + 1) * 6 + 2)
    d.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${coordinates[i + 1]}`)
  }

  return { path: d.join(' '), nodes }
}
