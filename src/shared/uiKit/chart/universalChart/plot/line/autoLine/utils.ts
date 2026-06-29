
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


class SvgPathBuffer2 {
  private buffer: Uint8Array
  private pos = 0
  private readonly decoder = new TextDecoder()

  constructor(pointsCount: number) {
    // Tune this based on your coordinate sizes.
    // For common chart coordinates, 64-96 bytes per point is usually enough.
    this.buffer = new Uint8Array(Math.max(128, pointsCount * 80))
  }

  reset(): void {
    this.pos = 0
  }

  getString(): string {
    return this.decoder.decode(this.buffer.subarray(0, this.pos))
  }

  writeMoveTo(x: number, y: number): void {
    this.ensure(32)

    this.ch(77) // M
    this.num2(x)
    this.ch(32)
    this.num2(y)
  }

  writeLineTo(x: number, y: number): void {
    this.ensure(32)

    this.ch(32)
    this.ch(76) // L
    this.num2(x)
    this.ch(32)
    this.num2(y)
  }

  writeSegment(
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number
  ): void {
    this.ensure(80)

    this.ch(32)
    this.ch(67) // C

    this.num2(cp1x)
    this.ch(32)
    this.num2(cp1y)
    this.ch(32)
    this.num2(cp2x)
    this.ch(32)
    this.num2(cp2y)
    this.ch(32)
    this.num2(x)
    this.ch(32)
    this.num2(y)
  }

  private ensure(extra: number): void {
    if (this.pos + extra <= this.buffer.length) return

    let nextSize = this.buffer.length * 2

    while (this.pos + extra > nextSize) {
      nextSize *= 2
    }

    const next = new Uint8Array(nextSize)
    next.set(this.buffer)
    this.buffer = next
  }

  private ch(code: number): void {
    this.buffer[this.pos++] = code
  }

  private num2Old(value: number): void {
    let scaled = Math.round(value * 100)

    if (scaled === 0) {
      this.ch(48) // 0
      return
    }

    if (scaled < 0) {
      this.ch(45) // -
      scaled = -scaled
    }

    const intPart = Math.floor(scaled / 100)
    const frac = scaled - intPart * 100

    this.uint(intPart)

    if (frac === 0) return

    this.ch(46) // .

    const tens = Math.floor(frac / 10)
    const ones = frac - tens * 10

    this.ch(48 + tens)

    // Trim trailing zero:
    // 2.50 -> 2.5
    // 2.05 -> 2.05
    // 2.00 -> 2
    if (ones !== 0) {
      this.ch(48 + ones)
    }
  }

  private num24(value: number): void {
    let scaled = Math.round(value * 100)

    if (scaled === 0) {
      this.ch(48)
      return
    }

    if (scaled < 0) {
      this.ch(45)
      scaled = -scaled
    }

    const intPart = Math.floor(scaled / 100)
    const frac = scaled - intPart * 100

    this.uint(intPart)

    if (frac === 0) return

    this.ch(46)

    const tens = Math.floor(frac / 10)
    const ones = frac - tens * 10

    this.ch(48 + tens)

    if (ones !== 0) {
      this.ch(48 + ones)
    }
  }

  private num2(value: number): void {
    let scaled = Math.round(value * 100)

    if (scaled < 0) {
      this.ch(45)
      scaled = -scaled
    }

    const intPart = Math.floor(scaled / 100)
    const frac = scaled - intPart * 100

    this.uint(intPart)

    this.ch(46)

    const tens = Math.floor(frac / 10)
    const ones = frac - tens * 10

    this.ch(48 + tens)
    this.ch(48 + ones)
  }

  private uint(value: number): void {
    if (value === 0) {
      this.ch(48)
      return
    }

    const start = this.pos

    while (value > 0) {
      this.ch(48 + (value % 10))
      value = Math.floor(value / 10)
    }

    let l = start
    let r = this.pos - 1

    while (l < r) {
      const tmp = this.buffer[l]
      this.buffer[l] = this.buffer[r]
      this.buffer[r] = tmp
      this.buffer[r] = tmp
      l++
      r--
    }
  }
}

export function monotoneXPathOld(points: Point[], smoothing = 1, precision = 2): string {
  const n = points.length
  const p = precision

  if (n === 0) return ''
  if (n === 1) return `M ${points[0].x.toFixed(p)} ${points[0].y.toFixed(p)}`
  if (n === 2) return `M ${points[0].x.toFixed(p)} ${points[0].y.toFixed(p)} L ${points[1].x.toFixed(p)} ${points[1].y.toFixed(p)}`

  const factor = Math.pow(10, p)
  const r = (v: number) => Math.round(v * factor) / factor

  const dx: number[] = new Array(n - 1)
  const dy: number[] = new Array(n - 1)
  const slope: number[] = new Array(n - 1)
  const tangent: number[] = new Array(n)

  // performance.mark('monotoneXPath-start')

  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1].x - points[i].x
    dy[i] = points[i + 1].y - points[i].y
    slope[i] = dy[i] / (dx[i] || 1)
  }

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

  // const d: string[] = [`M ${points[0].x.toFixed(p)} ${points[0].y.toFixed(p)}`]
  // const res: PathData[] = [{
  //   type: 'M',
  //   values: [points[0].x, points[0].y]
  // }]

  const out = new Array<string | number>(3 + (n - 1) * 7)

  let j = 0
  out[j++] = 'M'
  out[j++] = r(points[0].x)
  out[j++] = r(points[0].y)

  let d = ''
  d += `M ${r(points[0].x)} ${r(points[0].y)}`

  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i]
    const p1 = points[i + 1]

    const cp1x = p0.x + (dx[i] / 3) * k
    const cp1y = p0.y + ((tangent[i] * dx[i]) / 3) * k

    const cp2x = p1.x - (dx[i] / 3) * k
    const cp2y = p1.y - ((tangent[i + 1] * dx[i]) / 3) * k

    // d.push(`C ${cp1x.toFixed(p)} ${cp1y.toFixed(p)}, ${cp2x.toFixed(p)} ${cp2y.toFixed(p)}, ${p1.x.toFixed(p)} ${p1.y.toFixed(p)}`)
    // res.push({
    //   type: 'C',
    //   values: [r(cp1x), r(cp1y), r(cp2x), r(cp2y), r(p1.x), r(p1.y)]
    // })

    // d[i + 1] = `C ${r(cp1x)} ${r(cp1y)}, ${r(cp2x)} ${r(cp2y)}, ${r(p1.x)} ${r(p1.y)}`

    d += `C ${r(cp1x)} ${r(cp1y)}, ${r(cp2x)} ${r(cp2y)}, ${r(p1.x)} ${r(p1.y)} `
    // out[j++] = 'C'
    // out[j++] = r(cp1x)
    // out[j++] = r(cp1y)
    // out[j++] = r(cp2x)
    // out[j++] = r(cp2y)
    // out[j++] = r(p1.x)
    // out[j++] = r(p1.y)
  }

  // performance.mark('monotoneXPath-calculate-end')

  // performance.mark('monotoneXPath-stringify')

  // const res = 'resr erserser '

  // const d = res.map(seg => {
  //   switch (seg.type) {
  //     case 'M':
  //       return `M ${seg.values[0]} ${seg.values[1]}`
  //     case 'C':
  //       return `C ${seg.values[0]} ${seg.values[1]}, ${seg.values[2]} ${seg.values[3]}, ${seg.values[4]} ${seg.values[5]}`
  //     default:
  //       return ''
  //   }
  // })

  // performance.mark('monotoneXPath-join-start')
  // const d = out.join(' ')

  // performance.mark('monotoneXPath-end')
  // performance.measure('monotoneXPath', 'monotoneXPath-start', 'monotoneXPath-end')
  // performance.measure('monotoneXPath-stringify', 'monotoneXPath-stringify', 'monotoneXPath-end')
  // performance.measure('monotoneXPath-calculate', 'monotoneXPath-start', 'monotoneXPath-calculate-end')
  // performance.measure('monotoneXPath-join', 'monotoneXPath-join-start', 'monotoneXPath-end')

  return d
}

export function monotoneXPath(
  points: Point[],
  smoothing = 1,
  precision = 2
): string {
  const n = points.length

  if (n === 0) return ''

  const writer = new SvgPathBuffer2(n)

  if (n === 1) {
    writer.writeMoveTo(points[0].x, points[0].y)
    return writer.getString()
  }

  if (n === 2) {
    writer.writeMoveTo(points[0].x, points[0].y)
    writer.writeLineTo(points[1].x, points[1].y)
    return writer.getString()
  }

  // performance.mark('monotoneXPath-start')
  const dx: number[] = new Array(n - 1)
  const dy: number[] = new Array(n - 1)
  const slope: number[] = new Array(n - 1)
  const tangent: number[] = new Array(n)

  for (let i = 0; i < n - 1; i++) {
    dx[i] = points[i + 1].x - points[i].x
    dy[i] = points[i + 1].y - points[i].y
    slope[i] = dy[i] / (dx[i] || 1)
  }

  tangent[0] = slope[0]
  tangent[n - 1] = slope[n - 2]

  for (let i = 1; i < n - 1; i++) {
    const s0 = slope[i - 1]
    const s1 = slope[i]

    tangent[i] = s0 * s1 <= 0 ? 0 : (s0 + s1) / 2
  }

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

  const k = Math.max(0, Math.min(1, smoothing))

  writer.writeMoveTo(points[0].x, points[0].y)

  if (k === 0) {
    for (let i = 1; i < n; i++) {
      writer.writeLineTo(points[i].x, points[i].y)
    }

    return writer.getString()
  }

  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i]
    const p1 = points[i + 1]

    const dxi = dx[i]
    const thirdK = (dxi / 3) * k

    const cp1x = p0.x + thirdK
    const cp1y = p0.y + tangent[i] * thirdK

    const cp2x = p1.x - thirdK
    const cp2y = p1.y - tangent[i + 1] * thirdK

    writer.writeSegment(cp1x, cp1y, cp2x, cp2y, p1.x, p1.y)
  }

  // performance.mark('monotoneXPath-calculate-end')

  // performance.mark('monotoneXPath-stringify')
  const d = writer.getString()

  // performance.mark('monotoneXPath-end')
  // performance.measure('monotoneXPath', 'monotoneXPath-start', 'monotoneXPath-end')
  // performance.measure('monotoneXPath-stringify', 'monotoneXPath-stringify', 'monotoneXPath-end')
  // performance.measure('monotoneXPath-calculate', 'monotoneXPath-start', 'monotoneXPath-calculate-end')

  return d
}