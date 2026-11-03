import wasmInit from './linePath.wasm?init'
import { Point } from '../../../../utils/Point'
import { strokeSubpathFromNodes, StrokeProjection, StrokeSubpath } from '../utils/LineStrokeSampler'
import { smoothPath } from './smoothPath'

type LinePathWasm = {
  memory: WebAssembly.Memory
  allocF64: (len: number) => number
  freeF64: (ptr: number, len: number) => void
  createStroke: () => number
  freeStroke: (ptr: number) => void
  strokeNodesPtr: (ptr: number) => number
  strokeNodesLen: (ptr: number) => number
  resizeStroke: (ptr: number, len: number) => number
  commitStroke: (ptr: number) => void
  nearestStrokePoint: (ptr: number, x: number, y: number, margin: number) => number
  hitResultPtr: () => number
  buildLinePath: (
    strokePtr: number,
    xPtr: number,
    yPtr: number,
    len: number,
    smoothing: number,
    monotone: number,
    boundsMinX: number, boundsMaxX: number, boundsMinY: number, boundsMaxY: number,
    layoutMinX: number, layoutMaxX: number, layoutMinY: number, layoutMaxY: number,
    visibleMinX: number, visibleMaxX: number, visibleMinY: number, visibleMaxY: number
  ) => number
  resultPtr: () => number
  resultLen: () => number
}

export type WasmStatus = 'loading' | 'ready' | 'failed'

let linePathWasm: LinePathWasm | null = null
let wasmStatus: WasmStatus = 'loading'

const wasmReady = wasmInit()
  .then((instance) => {
    linePathWasm = instance.exports as unknown as LinePathWasm
    return wasmStatus = 'ready' as const
  })
  .catch(error => {
    console.error('LinePath: failed to load WASM', error)
    return wasmStatus = 'failed' as const
  })

export function getLinePathWasmStatus(): WasmStatus {
  return wasmStatus
}

export function linePathWasmReady(): Promise<WasmStatus> {
  return wasmReady
}

const pathDecoder = new TextDecoder()
const NODE_SIZE = 6

type Bounds = {
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
}

export type LinePathOptions = {
  smoothing?: number
  smoothingMethod?: 'monotone' | 'smooth'
  precision?: number
}

export class LinePath {

  private x: Float64Array
  private y: Float64Array
  private wasm: LinePathWasm | null = null
  private wasmXPtr = 0
  private wasmYPtr = 0
  private wasmStrokePtr = 0
  private wasmStrokeReady = false
  private hasStroke = false
  private nodes: Float64Array | null = null
  private subpath: StrokeSubpath | null = null

  constructor(points: readonly Point[]) {
    this.x = new Float64Array(points.length)
    this.y = new Float64Array(points.length)
    for (let i = 0; i < points.length; i++) {
      this.x[i] = points[i].x
      this.y[i] = points[i].y
    }
  }

  getPath(options: LinePathOptions, bounds: Bounds, layout: Bounds, visibleLayout: Bounds): string {
    this.hasStroke = false
    this.wasmStrokeReady = false
    this.nodes = null
    this.subpath = null
    const wasm = linePathWasm
    if (!wasm || this.x.length === 0) return ''

    const smoothing = options.smoothing ?? 1
    const monotone = options.smoothingMethod === 'monotone'
    if (!monotone && (options.smoothingMethod === 'smooth' || options.smoothing)) {
      const scaleX = (layout.maxX - layout.minX) / (bounds.maxX - bounds.minX)
      const scaleY = (layout.maxY - layout.minY) / (bounds.maxY - bounds.minY)
      const points = Array.from(this.x, (x, i) => ({
        x: layout.minX + (x - bounds.minX) * scaleX,
        y: layout.minY + (bounds.maxY - this.y[i]) * scaleY
      }))
      return this.usePathData(smoothPath(points, smoothing, options.precision ?? 2))
    }

    const visibleBounds = getVisibleChartBounds(bounds, layout, visibleLayout)
    if (!this.ensureWasmBuffers(wasm)) return ''
    const ok = wasm.buildLinePath(
      this.wasmStrokePtr, this.wasmXPtr, this.wasmYPtr, this.x.length, smoothing, Number(monotone),
      bounds.minX, bounds.maxX, bounds.minY, bounds.maxY,
      layout.minX, layout.maxX, layout.minY, layout.maxY,
      visibleBounds.minX, visibleBounds.maxX, visibleBounds.minY, visibleBounds.maxY
    )
    if (!ok) return ''

    this.wasmStrokeReady = true
    this.hasStroke = wasm.strokeNodesLen(this.wasmStrokePtr) > 0
    return pathDecoder.decode(new Uint8Array(wasm.memory.buffer, wasm.resultPtr(), wasm.resultLen()))
  }

  getSubpath(): StrokeSubpath | null {
    if (!this.hasStroke) return null
    if (this.subpath) return this.subpath
    const nodes = this.nodes ?? this.getWasmNodes()
    this.subpath = nodes ? strokeSubpathFromNodes(nodes) : null
    return this.subpath
  }

  nearestPoint(point: Point, margin: number): StrokeProjection | null {
    const wasm = linePathWasm
    if (!wasm || !this.hasStroke || !this.ensureStrokeForHit(wasm)) return null
    if (wasm.nearestStrokePoint(this.wasmStrokePtr, point.x, point.y, margin) !== 1) return null

    const result = new Float64Array(wasm.memory.buffer, wasm.hitResultPtr(), 3)
    return { anchor: { x: result[0], y: result[1] }, distance: result[2], subpathIndex: 0 }
  }

  release() {
    this.freeWasmBuffers()
    this.hasStroke = false
    this.nodes = null
    this.subpath = null
  }

  dispose() {
    this.release()
    this.x = new Float64Array(0)
    this.y = new Float64Array(0)
  }

  private usePathData(data: { path: string, nodes: Float64Array }): string {
    this.nodes = data.nodes
    this.hasStroke = data.nodes.length > 0
    return data.path
  }

  private getWasmNodes(): Float64Array | null {
    if (!this.wasm || !this.wasmStrokeReady) return null
    return new Float64Array(this.wasm.memory.buffer, this.wasm.strokeNodesPtr(this.wasmStrokePtr), this.wasm.strokeNodesLen(this.wasmStrokePtr) * NODE_SIZE)
  }

  private ensureStrokeForHit(wasm: LinePathWasm): boolean {
    if (this.wasmStrokeReady && this.wasm === wasm) return true
    if (!this.nodes || !this.ensureWasmBuffers(wasm)) return false
    const ptr = wasm.resizeStroke(this.wasmStrokePtr, this.nodes.length / NODE_SIZE)
    if (!ptr) return false
    new Float64Array(wasm.memory.buffer, ptr, this.nodes.length).set(this.nodes)
    wasm.commitStroke(this.wasmStrokePtr)
    this.wasmStrokeReady = true
    return true
  }

  private ensureWasmBuffers(wasm: LinePathWasm): boolean {
    if (this.wasm === wasm && this.wasmXPtr && this.wasmYPtr && this.wasmStrokePtr) return true
    this.freeWasmBuffers()

    const n = this.x.length
    const xPtr = wasm.allocF64(n)
    const yPtr = wasm.allocF64(n)
    const strokePtr = wasm.createStroke()
    if (xPtr === 0 || yPtr === 0 || strokePtr === 0) {
      if (xPtr) wasm.freeF64(xPtr, n)
      if (yPtr) wasm.freeF64(yPtr, n)
      if (strokePtr) wasm.freeStroke(strokePtr)
      return false
    }

    new Float64Array(wasm.memory.buffer, xPtr, n).set(this.x)
    new Float64Array(wasm.memory.buffer, yPtr, n).set(this.y)
    this.wasm = wasm
    this.wasmXPtr = xPtr
    this.wasmYPtr = yPtr
    this.wasmStrokePtr = strokePtr
    return true
  }

  private freeWasmBuffers() {
    const wasm = this.wasm
    if (wasm) {
      if (this.wasmXPtr) wasm.freeF64(this.wasmXPtr, this.x.length)
      if (this.wasmYPtr) wasm.freeF64(this.wasmYPtr, this.y.length)
      if (this.wasmStrokePtr) wasm.freeStroke(this.wasmStrokePtr)
    }

    this.wasm = null
    this.wasmXPtr = 0
    this.wasmYPtr = 0
    this.wasmStrokePtr = 0
    this.wasmStrokeReady = false
  }

}

function getVisibleChartBounds(bounds: Bounds, layout: Bounds, visibleLayout: Bounds): Bounds {
  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY
  const layoutWidth = layout.maxX - layout.minX
  const layoutHeight = layout.maxY - layout.minY

  const layoutToChartX = (x: number) => bounds.minX + (x - layout.minX) / layoutWidth * width
  const layoutToChartY = (y: number) => bounds.maxY - (y - layout.minY) / layoutHeight * height

  const x1 = layoutToChartX(visibleLayout.minX)
  const x2 = layoutToChartX(visibleLayout.maxX)
  const y1 = layoutToChartY(visibleLayout.minY)
  const y2 = layoutToChartY(visibleLayout.maxY)

  return {
    minX: Math.min(x1, x2),
    maxX: Math.max(x1, x2),
    minY: Math.min(y1, y2),
    maxY: Math.max(y1, y2)
  }
}
