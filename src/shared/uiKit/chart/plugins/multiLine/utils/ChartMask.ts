import { MultiLineChart, Overflow, DefsRenderer } from '../MultiLine'
import { ChartSpace } from './ChartSpace'

const NAMESPACE = 'http://www.w3.org/2000/svg'
type Size = { width: number, height: number }
export class ChartMask implements DefsRenderer {

  readonly root = document.createElementNS(NAMESPACE, 'mask')
  private rect = document.createElementNS(NAMESPACE, 'rect')
  private id = `mask-${Math.random().toString(16).slice(2)}`
  private cachedSize = { x: 0, y: 0, width: 0, height: 0 }

  private multiLine: MultiLineChart | null = null

  constructor(
    private readonly target: 'top' | 'right' | 'bottom' | 'left' | 'center' = 'center',
    private readonly fillTarget = true) {
    this.root.setAttribute('id', this.id)
    if (fillTarget) {
      this.rect.setAttribute('fill', 'white')
      this.rect.classList.add('chart-mask-target-rect')
      this.root.appendChild(this.rect)
    }
  }

  getRootElement(): Element {
    return this.root
  }

  attach(root: SVGGElement, multiLine: MultiLineChart): void {
    this.multiLine = multiLine
  }

  detach(): void {
    this.root.remove()
  }

  didLayout(space: ChartSpace, full: Size): void {
    if (!this.multiLine) return
    if (!this.fillTarget) return
    const layout = this.target === 'center' ? space.layout : this.multiLine.getSlotRect(this.target)
    this.setRect(layout.x, layout.y, layout.width, layout.height)
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