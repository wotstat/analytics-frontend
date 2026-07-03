import { Point } from './Point'

export type BoundsPatch = { minX?: number, maxX?: number, minY?: number, maxY?: number }
export type BoundsAxes = { x?: boolean, y?: boolean }

export class Bounds {
  private dataCount = 0

  constructor(
    public minX: number = Infinity,
    public maxX: number = -Infinity,
    public minY: number = Infinity,
    public maxY: number = -Infinity
  ) { }

  static fromPoints(points: Point[]) {
    const bounds = new Bounds()
    for (const p of points) bounds.addPoint(p)
    return bounds
  }

  static fromMinMax(minX: number, maxX: number, minY: number, maxY: number) {
    const bounds = new Bounds()
    bounds.minX = minX
    bounds.maxX = maxX
    bounds.minY = minY
    bounds.maxY = maxY
    bounds.dataCount = 1
    return bounds
  }

  static fromMinMaxObject({ minX, maxX, minY, maxY }: { minX: number, maxX: number, minY: number, maxY: number }) {
    return Bounds.fromMinMax(minX, maxX, minY, maxY)
  }

  static isPatchValid(patch: BoundsPatch) {
    const hasX = patch.minX !== undefined || patch.maxX !== undefined
    const hasY = patch.minY !== undefined || patch.maxY !== undefined
    if (!hasX && !hasY) return false

    if (patch.minX !== undefined && patch.maxX !== undefined) {
      if (!Number.isFinite(patch.minX) || !Number.isFinite(patch.maxX) || patch.minX === patch.maxX) return false
    }

    if (patch.minY !== undefined && patch.maxY !== undefined) {
      if (!Number.isFinite(patch.minY) || !Number.isFinite(patch.maxY) || patch.minY === patch.maxY) return false
    }

    return true
  }

  addPoint(p: Point) {
    this.minX = Math.min(this.minX, p.x)
    this.maxX = Math.max(this.maxX, p.x)
    this.minY = Math.min(this.minY, p.y)
    this.maxY = Math.max(this.maxY, p.y)
    this.dataCount++
  }

  addXY(x: number, y: number) {
    this.minX = Math.min(this.minX, x)
    this.maxX = Math.max(this.maxX, x)
    this.minY = Math.min(this.minY, y)
    this.maxY = Math.max(this.maxY, y)
    this.dataCount++
  }

  addX(x: number) {
    this.minX = Math.min(this.minX, x)
    this.maxX = Math.max(this.maxX, x)
    this.dataCount++
  }

  addY(y: number) {
    this.minY = Math.min(this.minY, y)
    this.maxY = Math.max(this.maxY, y)
    this.dataCount++
  }

  extend(bounds: Bounds) {
    if (bounds.isEmpty()) return

    this.minX = Math.min(this.minX, bounds.minX)
    this.maxX = Math.max(this.maxX, bounds.maxX)
    this.minY = Math.min(this.minY, bounds.minY)
    this.maxY = Math.max(this.maxY, bounds.maxY)
    this.dataCount += bounds.dataCount
  }

  patch(patch: BoundsPatch) {
    if (patch.minX !== undefined) this.minX = patch.minX
    if (patch.maxX !== undefined) this.maxX = patch.maxX
    if (patch.minY !== undefined) this.minY = patch.minY
    if (patch.maxY !== undefined) this.maxY = patch.maxY
    return this
  }

  toPatch(axes: BoundsAxes = { x: true, y: true }): BoundsPatch {
    return {
      ...(axes.x ? { minX: this.minX, maxX: this.maxX } : {}),
      ...(axes.y ? { minY: this.minY, maxY: this.maxY } : {}),
    }
  }

  clone() {
    const clone = new Bounds(this.minX, this.maxX, this.minY, this.maxY)
    clone.dataCount = this.dataCount
    return clone
  }

  isEmpty() {
    return this.minX === Infinity || this.maxX === -Infinity || this.minY === Infinity || this.maxY === -Infinity || this.dataCount === 0
  }

  isEqualTo(bounds: Bounds) {
    return this.minX === bounds.minX && this.maxX === bounds.maxX && this.minY === bounds.minY && this.maxY === bounds.maxY
  }

  isEqualToPatch(patch: BoundsPatch) {
    return (patch.minX === undefined || this.minX === patch.minX) &&
      (patch.maxX === undefined || this.maxX === patch.maxX) &&
      (patch.minY === undefined || this.minY === patch.minY) &&
      (patch.maxY === undefined || this.maxY === patch.maxY)
  }

  contains(point: Point) {
    return point.x >= this.minX && point.x <= this.maxX && point.y >= this.minY && point.y <= this.maxY
  }

  getHash() {
    return `${this.minX}_${this.maxX}_${this.minY}_${this.maxY}`
  }
}
