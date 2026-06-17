import { ChartRawPattern } from '../../defs/ChartRawPattern'
import { Overflow, Size } from '../../UniversalChart'
import { ChartSpace } from '../../utils/ChartSpace'
import { Point } from '../../utils/Point'
import { Classes, NormalizedOffset4Side, Offset4Side, unwrapOffset } from '../../utils/utils'
import { BasePlotRenderer } from '../BasePlotRenderer'

export class RectangleArea extends BasePlotRenderer {

  protected rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  protected data: { p1: Point, p2: Point } | null = null
  protected cachedSize: { x: number, y: number, width: number, height: number } = { x: 0, y: 0, width: 0, height: 0 }
  protected padding: NormalizedOffset4Side

  constructor(classes: Classes, protected options: { layoutLimited?: boolean, padding?: Offset4Side } = {}) {
    super(classes)
    this.root.appendChild(this.rect)
    this.padding = unwrapOffset(options.padding ?? 0)
  }

  protected renderImpl(space: ChartSpace, overflow: Overflow, full: Size): void {
    if (!this.data) return

    const p1 = space.chartToLayout(this.data.p1)
    const p2 = space.chartToLayout(this.data.p2)

    const { top, right, bottom, left } = this.padding

    if (this.options.layoutLimited) {
      const leftX = Math.max(Math.min(p1.x, p2.x), space.layout.x) + left
      const topY = Math.max(Math.min(p1.y, p2.y), space.layout.y) + top
      const rightX = Math.min(Math.max(leftX, p1.x, p2.x), space.layout.x + space.layout.width) - right
      const bottomY = Math.min(Math.max(p1.y, p2.y), space.layout.y + space.layout.height) - bottom

      this.setRect(leftX, topY, rightX - leftX, bottomY - topY)
    }
    else {
      const leftX = Math.min(p1.x, p2.x) + left
      const topY = Math.min(p1.y, p2.y) + top
      const rightX = Math.max(p1.x, p2.x) - right
      const bottomY = Math.max(p1.y, p2.y) - bottom

      this.setRect(leftX, topY, rightX - leftX, bottomY - topY)
    }
  }

  setPoints(p1: Point, p2: Point) {
    this.data = { p1, p2 }
    this.requestRender()
  }

  fillByPattern(pattern: ChartRawPattern) {
    pattern.fill(this.rect)
    return this
  }

  protected setRect(x: number, y: number, width: number, height: number) {
    if (this.cachedSize.x === x && this.cachedSize.y === y && this.cachedSize.width === width && this.cachedSize.height === height) return
    this.cachedSize = { x, y, width, height }
    if (width < 0 || height < 0 || Number.isNaN(width) || Number.isNaN(height)) return this.clearRect()

    this.rect.setAttribute('x', x.toString())
    this.rect.setAttribute('y', y.toString())
    this.rect.setAttribute('width', width.toString())
    this.rect.setAttribute('height', height.toString())
  }

  protected clearRect() {
    this.setRect(0, 0, 0, 0)
  }
}