import { UniversalChart, Overflow, DefsRenderer } from '../UniversalChart'
import { ChartSpace } from '../utils/ChartSpace'
import { NormalizedOffset4Side, Offset4Side, unwrapOffset } from '../utils/utils'

const NAMESPACE = 'http://www.w3.org/2000/svg'
type Size = { width: number, height: number }
type Target = 'top' | 'right' | 'bottom' | 'left' | 'center'

export class ChartMask implements DefsRenderer {

  readonly root = document.createElementNS(NAMESPACE, 'mask')
  private rect = document.createElementNS(NAMESPACE, 'rect')
  private id = `mask-${Math.random().toString(16).slice(2)}`
  private cachedSize = { x: 0, y: 0, width: 0, height: 0 }

  private chart: UniversalChart | null = null
  private padding: NormalizedOffset4Side

  constructor(
    private readonly target: Target = 'center',
    padding: Offset4Side = 0,
    private readonly fillTarget = true) {
    this.root.setAttribute('id', this.id)
    if (fillTarget) {
      this.rect.setAttribute('fill', 'white')
      this.rect.classList.add('chart-mask-target-rect')
      this.root.appendChild(this.rect)
    }
    this.padding = unwrapOffset(padding)
  }

  getRootElement(): Element {
    return this.root
  }

  attach(root: SVGGElement, chart: UniversalChart): void {
    this.chart = chart
  }

  detach(): void {
    this.root.remove()
  }

  didLayout(space: ChartSpace, full: Size): void {
    if (!this.chart) return
    if (!this.fillTarget) return
    const layout = this.target === 'center' ? space.layout : this.chart.getSlotRect(this.target)
    const targetSize = {
      x: layout.x + this.padding.left,
      y: layout.y + this.padding.top,
      width: layout.width - this.padding.left - this.padding.right,
      height: layout.height - this.padding.top - this.padding.bottom
    }

    this.setRect(targetSize.x, targetSize.y, targetSize.width, targetSize.height)
  }

  mask(element: SVGGElement) {
    element.setAttribute('mask', this.getMaskUrl())
  }

  setRect(x: number, y: number, width: number, height: number) {
    if (this.cachedSize.x === x && this.cachedSize.y === y && this.cachedSize.width === width && this.cachedSize.height === height) return
    this.cachedSize = { x, y, width, height }
    this.rect.setAttribute('x', x.toString())
    this.rect.setAttribute('y', y.toString())
    this.rect.setAttribute('width', width.toString())
    this.rect.setAttribute('height', height.toString())
  }

  getMaskUrl() {
    return `url(#${this.id})`
  }
}