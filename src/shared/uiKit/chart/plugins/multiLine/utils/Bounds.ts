import { Point } from './Point'

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
    bounds.minX = Math.min(maxX, minX)
    bounds.maxX = Math.max(maxX, minX)
    bounds.minY = Math.min(maxY, minY)
    bounds.maxY = Math.max(maxY, minY)
    bounds.dataCount = 1
    return bounds
  }

  static fromMinMaxObject({ minX, maxX, minY, maxY }: { minX: number, maxX: number, minY: number, maxY: number }) {
    return Bounds.fromMinMax(minX, maxX, minY, maxY)
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
    this.minX = Math.min(this.minX, bounds.minX)
    this.maxX = Math.max(this.maxX, bounds.maxX)
    this.minY = Math.min(this.minY, bounds.minY)
    this.maxY = Math.max(this.maxY, bounds.maxY)
    this.dataCount += bounds.dataCount
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

  getHash() {
    return `${this.minX}_${this.maxX}_${this.minY}_${this.maxY}`
  }
}
