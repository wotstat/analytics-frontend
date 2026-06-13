

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

export function monotoneXPath(points: Point[], smoothing = 1, precision = 2): string {
  const n = points.length
  const p = precision

  if (n === 0) return ''
  if (n === 1) return `M ${points[0].x.toFixed(p)} ${points[0].y.toFixed(p)}`
  if (n === 2) return `M ${points[0].x.toFixed(p)} ${points[0].y.toFixed(p)} L ${points[1].x.toFixed(p)} ${points[1].y.toFixed(p)}`

  const dx: number[] = []
  const dy: number[] = []
  const slope: number[] = []

  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1].x - points[i].x
    dy[i] = points[i + 1].y - points[i].y
    slope[i] = dy[i] / (dx[i] || 1)
  }

  const tangent: number[] = []

  tangent[0] = slope[0]
  tangent[n - 1] = slope[n - 2]

  for (let i = 1; i < n - 1; i++) {
    const s0 = slope[i - 1]
    const s1 = slope[i]

    if (s0 * s1 <= 0) {
      tangent[i] = 0
    } else {
      tangent[i] = (s0 + s1) / 2
    }
  }

  // Prevent overshoot.
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      tangent[i] = 0
      tangent[i + 1] = 0
    } else {
      const a = tangent[i] / slope[i]
      const b = tangent[i + 1] / slope[i]
      const h = Math.hypot(a, b)

      if (h > 3) {
        const t = 3 / h
        tangent[i] = t * a * slope[i]
        tangent[i + 1] = t * b * slope[i]
      }
    }
  }

  // Smoothing control:
  // 0 = straight lines
  // 1 = fully smooth monotone curve
  const k = Math.max(0, Math.min(1, smoothing))

  const d: string[] = [`M ${points[0].x.toFixed(p)} ${points[0].y.toFixed(p)}`]

  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i]
    const p1 = points[i + 1]

    const cp1x = p0.x + (dx[i] / 3) * k
    const cp1y = p0.y + ((tangent[i] * dx[i]) / 3) * k

    const cp2x = p1.x - (dx[i] / 3) * k
    const cp2y = p1.y - ((tangent[i + 1] * dx[i]) / 3) * k

    d.push(`C ${cp1x.toFixed(p)} ${cp1y.toFixed(p)}, ${cp2x.toFixed(p)} ${cp2y.toFixed(p)}, ${p1.x.toFixed(p)} ${p1.y.toFixed(p)}`)
  }

  return d.join(' ')
}