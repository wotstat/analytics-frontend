import wasmInit from './monotoneXPath.wasm?init'

let monotoneXPathWasm: ((x: number, y: number) => number) | null = null

wasmInit().then((instance) => {
  const { add } = instance.exports as any
  monotoneXPathWasm = add
  console.log('WASM module initialized', instance.exports)
})

function fmt2(value: number) {
  return Math.round(value * 100) / 100
}

type Bounds = {
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
}

export class MonotoneXPath {

  private dx: number[]
  private slope: number[]
  private tangent: number[]
  private x: number[]
  private y: number[]


  constructor(points: { x: number, y: number }[]) {
    const n = points.length
    this.dx = new Array(n - 1)
    this.slope = new Array(n - 1)
    this.tangent = new Array(n)
    this.x = new Array(n)
    this.y = new Array(n)

    for (let i = 0; i < n; i++) {
      this.x[i] = points[i].x
      this.y[i] = points[i].y
    }
  }

  getPath(smoothing = 1, bounds: Bounds, layout: Bounds): string {
    const n = this.x.length

    if (n === 0) return ''
    if (n === 1) return `M${fmt2(this.x[0])} ${fmt2(this.y[0])}`
    if (n === 2) return `M${fmt2(this.x[0])} ${fmt2(this.y[0])} L${fmt2(this.x[1])} ${fmt2(this.y[1])}`

    if (monotoneXPathWasm) {
      console.log('Using WASM implementation for monotone path')
    } else {
      console.log('Using fallback implementation for monotone path')
    }

    return monotoneXPathFallback({
      x: this.x,
      y: this.y,
      dx: this.dx,
      slope: this.slope,
      tangent: this.tangent,
      smoothing: smoothing,
      bounds: bounds,
      layout: layout
    })
  }

  dispose() {
    this.dx = []
    this.slope = []
    this.tangent = []
    this.x = []
    this.y = []
  }

}

function monotoneXPathFallback(options: {
  x: number[],
  y: number[],
  dx: number[],
  slope: number[],
  tangent: number[],
  smoothing: number,
  bounds: Bounds,
  layout: Bounds
}): string {

  const { dx, slope, tangent, smoothing, bounds, layout } = options

  const w = bounds.maxX - bounds.minX
  const h = bounds.maxY - bounds.minY

  const lW = layout.maxX - layout.minX
  const lH = layout.maxY - layout.minY

  const transformX = (x: number) => (x - bounds.minX) / w * lW + layout.minX
  const transformY = (y: number) => (bounds.maxY - y) / h * lH + layout.minY

  const x = options.x.map((v, i) => transformX(v))
  const y = options.y.map((v, i) => transformY(v))

  const n = x.length

  if (n === 0) return ''
  if (n === 1) return `M${fmt2(x[0])} ${fmt2(y[0])}`
  if (n === 2) return `M${fmt2(x[0])} ${fmt2(y[0])} L${fmt2(x[1])} ${fmt2(y[1])}`


  for (let i = 0; i < n - 1; i++) {
    dx[i] = x[i + 1] - x[i]
    const dy = y[i + 1] - y[i]
    slope[i] = dy / (dx[i] || 1)
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

  const k = Math.max(0, Math.min(1, smoothing))

  let d = ''
  d += `M ${fmt2(x[0])} ${fmt2(y[0])}`

  for (let i = 0; i < n - 1; i++) {
    const p0 = { x: x[i], y: y[i] }
    const p1 = { x: x[i + 1], y: y[i + 1] }

    const cp1x = p0.x + (dx[i] / 3) * k
    const cp1y = p0.y + ((tangent[i] * dx[i]) / 3) * k

    const cp2x = p1.x - (dx[i] / 3) * k
    const cp2y = p1.y - ((tangent[i + 1] * dx[i]) / 3) * k

    d += `C ${fmt2(cp1x)} ${fmt2(cp1y)}, ${fmt2(cp2x)} ${fmt2(cp2y)}, ${fmt2(p1.x)} ${fmt2(p1.y)} `
  }

  return d
}