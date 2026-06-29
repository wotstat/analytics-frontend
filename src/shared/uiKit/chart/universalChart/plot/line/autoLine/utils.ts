
type Point = { x: number, y: number }

export function smoothPath(points: Point[], smoothing = 1, precision = 2): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x.toFixed(precision)} ${points[0].y.toFixed(precision)}`
  if (points.length === 2) return `M ${points[0].x.toFixed(precision)} ${points[0].y.toFixed(precision)} L ${points[1].x.toFixed(precision)} ${points[1].y.toFixed(precision)}`

  const d: string[] = []

  d.push(`M ${points[0].x.toFixed(precision)} ${points[0].y.toFixed(precision)}`)

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2

    const cp1x = p1.x + ((p2.x - p0.x) / 6) * smoothing
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * smoothing

    const cp2x = p2.x - ((p3.x - p1.x) / 6) * smoothing
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * smoothing

    d.push(
      `C ${cp1x.toFixed(precision)} ${cp1y.toFixed(precision)}, ${cp2x.toFixed(precision)} ${cp2y.toFixed(precision)}, ${p2.x.toFixed(precision)} ${p2.y.toFixed(precision)}`
    )
  }

  return d.join(' ')
}
