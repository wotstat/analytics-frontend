import wasmInit from './monotoneXPath/monotoneXPath.wasm?init'

type MonotoneXPathWasm = {
  memory: WebAssembly.Memory
  allocF64: (len: number) => number
  freeF64: (ptr: number, len: number) => void
  buildMonotoneXPath: (
    xPtr: number,
    yPtr: number,
    len: number,
    smoothing: number,
    boundsMinX: number, boundsMaxX: number, boundsMinY: number, boundsMaxY: number,
    layoutMinX: number, layoutMaxX: number, layoutMinY: number, layoutMaxY: number,
    visibleMinX: number, visibleMaxX: number, visibleMinY: number, visibleMaxY: number
  ) => number
  resultPtr: () => number
  resultLen: () => number
}

let monotoneXPathWasm: MonotoneXPathWasm | null = null

wasmInit()
  .then((instance) => monotoneXPathWasm = instance.exports as unknown as MonotoneXPathWasm)
  .catch(() => monotoneXPathWasm = null)

const pathDecoder = new TextDecoder()

type Bounds = {
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
}

export class MonotoneXPath {

  private x: Float64Array
  private y: Float64Array
  private wasm: MonotoneXPathWasm | null = null
  private wasmXPtr = 0
  private wasmYPtr = 0

  constructor(points: { x: number, y: number }[]) {
    const n = points.length
    this.x = new Float64Array(n)
    this.y = new Float64Array(n)

    for (let i = 0; i < n; i++) {
      this.x[i] = points[i].x
      this.y[i] = points[i].y
    }
  }

  getPath(smoothing = 1, bounds: Bounds, layout: Bounds, visibleLayout: Bounds): string {
    const n = this.x.length

    if (n === 0) return ''

    const visibleBounds = getVisibleChartBounds(bounds, layout, visibleLayout)

    const wasm = monotoneXPathWasm

    if (wasm) {
      try {
        if (this.ensureWasmBuffers(wasm)) {

          const ok = wasm.buildMonotoneXPath(
            this.wasmXPtr, this.wasmYPtr, n, smoothing,
            bounds.minX, bounds.maxX, bounds.minY, bounds.maxY,
            layout.minX, layout.maxX, layout.minY, layout.maxY,
            visibleBounds.minX, visibleBounds.maxX, visibleBounds.minY, visibleBounds.maxY
          )

          if (ok) {
            const ptr = wasm.resultPtr()
            const len = wasm.resultLen()
            const res = pathDecoder.decode(new Uint8Array(wasm.memory.buffer, ptr, len))
            return res
          }
        }
      } catch {
        this.freeWasmBuffers()
      }
    }

    return monotoneXPathFallback({
      x: this.x,
      y: this.y,
      smoothing: smoothing,
      bounds: bounds,
      layout: layout,
      visibleBounds: visibleBounds
    })
  }

  dispose() {
    this.freeWasmBuffers()
    this.x = new Float64Array(0)
    this.y = new Float64Array(0)
  }

  private ensureWasmBuffers(wasm: MonotoneXPathWasm): boolean {
    if (this.wasm === wasm && this.wasmXPtr !== 0 && this.wasmYPtr !== 0) return true

    this.freeWasmBuffers()

    const n = this.x.length
    const xPtr = wasm.allocF64(n)
    const yPtr = wasm.allocF64(n)

    if (xPtr === 0 || yPtr === 0) {
      if (xPtr !== 0) wasm.freeF64(xPtr, n)
      if (yPtr !== 0) wasm.freeF64(yPtr, n)
      return false
    }

    new Float64Array(wasm.memory.buffer, xPtr, n).set(this.x)
    new Float64Array(wasm.memory.buffer, yPtr, n).set(this.y)

    this.wasm = wasm
    this.wasmXPtr = xPtr
    this.wasmYPtr = yPtr

    return true
  }

  private freeWasmBuffers() {
    const wasm = this.wasm

    if (wasm) {
      try {
        if (this.wasmXPtr !== 0) wasm.freeF64(this.wasmXPtr, this.x.length)
        if (this.wasmYPtr !== 0) wasm.freeF64(this.wasmYPtr, this.y.length)
      } catch {
        // Ignore allocator failures and let the instance fall back to JS.
      }
    }

    this.wasm = null
    this.wasmXPtr = 0
    this.wasmYPtr = 0
  }

}

function fmt2(value: number) {
  return Math.round(value * 100) / 100
}

function monotoneXPathFallback(options: {
  x: Float64Array,
  y: Float64Array,
  smoothing: number,
  bounds: Bounds,
  layout: Bounds,
  visibleBounds: Bounds
}): string {

  const { smoothing, bounds, layout, visibleBounds } = options

  const w = bounds.maxX - bounds.minX
  const h = bounds.maxY - bounds.minY

  const lW = layout.maxX - layout.minX
  const lH = layout.maxY - layout.minY

  const transformX = (x: number) => (x - bounds.minX) / w * lW + layout.minX
  const transformY = (y: number) => (bounds.maxY - y) / h * lH + layout.minY

  const visibleRange = getVisiblePointRange(options.x, options.y, visibleBounds)
  if (!visibleRange) return ''

  let n = visibleRange.end - visibleRange.start + 1
  const x = new Array<number>(n)
  const y = new Array<number>(n)

  for (let i = 0; i < n; i++) {
    const sourceIndex = visibleRange.start + i
    x[i] = transformX(options.x[sourceIndex])
    y[i] = transformY(options.y[sourceIndex])
  }

  n = simplifyPointsInPlace(x, y, n)

  if (n === 1) return `M ${fmt2(x[0])} ${fmt2(y[0])}`
  if (n === 2) return `M ${fmt2(x[0])} ${fmt2(y[0])} L ${fmt2(x[1])} ${fmt2(y[1])}`


  const dx = new Array(Math.max(0, n - 1))
  const slope = new Array(Math.max(0, n - 1))
  const tangent = new Array(n)

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

const PIXEL_COLUMN_WIDTH = 1
const COLLINEAR_EPS = 0.05
const MIN_CORRIDOR_DX = 1e-6

// Убирает точки, не влияющие на видимую форму кривой (координаты уже в пикселях layout):
// 1) подряд идущие точки внутри одного пиксельного столбца сводятся к входу/выходу/минимуму/максимуму
// 2) почти коллинеарные последовательности схлопываются до концов отрезка
// В обоих случаях дополнительно сохраняются соседние с границами точки, чтобы касательные
// монотонного сплайна в оставшихся узлах не менялись и кривая визуально не отличалась.
function simplifyPointsInPlace(x: number[], y: number[], n: number): number {
  if (n < 3) return n

  const idx = decimatePixelColumns(x, y, n)
  const m = collapseCollinear(x, y, idx)

  if (m === n) return n

  for (let k = 0; k < m; k++) {
    x[k] = x[idx[k]]
    y[k] = y[idx[k]]
  }

  return m
}

function decimatePixelColumns(x: number[], y: number[], n: number): number[] {
  const idx: number[] = []
  let i = 0

  while (i < n) {
    const column = Math.floor(x[i] / PIXEL_COLUMN_WIDTH)
    let j = i
    let minIndex = i
    let maxIndex = i

    while (j + 1 < n && Math.floor(x[j + 1] / PIXEL_COLUMN_WIDTH) === column) {
      j++
      if (y[j] < y[minIndex]) minIndex = j
      if (y[j] > y[maxIndex]) maxIndex = j
    }

    if (j - i <= 5) {
      for (let k = i; k <= j; k++) idx.push(k)
    } else {
      const kept = [i, i + 1, Math.min(minIndex, maxIndex), Math.max(minIndex, maxIndex), j - 1, j].sort((a, b) => a - b)
      for (let k = 0; k < kept.length; k++) {
        if (k === 0 || kept[k] !== kept[k - 1]) idx.push(kept[k])
      }
    }

    i = j + 1
  }

  return idx
}

// «Коридорный» алгоритм: точка принимается в текущий отрезок, пока прямая от якоря до неё
// проходит в пределах COLLINEAR_EPS от всех промежуточных точек. Сжимает idx на месте.
function collapseCollinear(x: number[], y: number[], idx: number[]): number {
  const m = idx.length
  if (m < 5) return m

  let out = 1
  let anchor = 0
  let anchorX = x[idx[0]]
  let anchorY = y[idx[0]]
  let last = 0
  let slopeMin = -Infinity
  let slopeMax = Infinity

  const finalizeRun = () => {
    if (anchor + 1 < last) idx[out++] = idx[anchor + 1]
    if (last - 1 > anchor + 1) idx[out++] = idx[last - 1]
    idx[out++] = idx[last]
  }

  let i = 1
  while (i < m) {
    const dx = x[idx[i]] - anchorX
    let accepted = false

    if (dx > MIN_CORRIDOR_DX) {
      const dy = y[idx[i]] - anchorY
      const slope = dy / dx

      if (slope >= slopeMin && slope <= slopeMax) {
        slopeMin = Math.max(slopeMin, (dy - COLLINEAR_EPS) / dx)
        slopeMax = Math.min(slopeMax, (dy + COLLINEAR_EPS) / dx)
        last = i
        accepted = true
        i++
      }
    }

    if (!accepted) {
      if (last === anchor) {
        idx[out++] = idx[i]
        anchor = i
        last = i
        i++
      } else {
        finalizeRun()
        anchor = last
      }

      anchorX = x[idx[out - 1]]
      anchorY = y[idx[out - 1]]
      slopeMin = -Infinity
      slopeMax = Infinity
    }
  }

  if (last > anchor) finalizeRun()

  return out
}

function getVisibleChartBounds(bounds: Bounds, layout: Bounds, visibleLayout: Bounds): Bounds {
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY
  const layoutWidth = layout.maxX - layout.minX
  const layoutHeight = layout.maxY - layout.minY

  const layoutToChartX = (x: number) => bounds.minX + (x - layout.minX) / layoutWidth * width
  const layoutToChartY = (y: number) => bounds.maxY - (y - layout.minY) / layoutHeight * height

  return {
    minX: layoutToChartX(visibleLayout.minX),
    maxX: layoutToChartX(visibleLayout.maxX),
    minY: layoutToChartY(visibleLayout.maxY),
    maxY: layoutToChartY(visibleLayout.minY)
  }
}

function getVisiblePointRange(x: Float64Array, y: Float64Array, visibleBounds: Bounds) {
  const n = x.length

  if (n === 1) {
    if (x[0] < visibleBounds.minX || x[0] > visibleBounds.maxX || y[0] < visibleBounds.minY || y[0] > visibleBounds.maxY) return null
    return { start: 0, end: 0 }
  }

  let start = -1
  let end = -1

  for (let i = 0; i < n - 1; i++) {
    const segMinX = Math.min(x[i], x[i + 1])
    const segMaxX = Math.max(x[i], x[i + 1])
    if (segMaxX < visibleBounds.minX || segMinX > visibleBounds.maxX) continue

    const segMinY = Math.min(y[i], y[i + 1])
    const segMaxY = Math.max(y[i], y[i + 1])
    if (segMaxY < visibleBounds.minY || segMinY > visibleBounds.maxY) continue

    if (start === -1) start = i
    end = i + 1
  }

  if (start === -1 || end === -1) return null

  return {
    start: Math.max(0, start - 1),
    end: Math.min(n - 1, end + 1)
  }
}