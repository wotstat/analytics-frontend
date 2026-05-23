import { MultiLineChart, Overflow, PlotRenderer } from '../MultiLine'
import { ChartSpace } from './ChartSpace'

const NAMESPACE = 'http://www.w3.org/2000/svg'
type Size = { width: number, height: number }
export class ClipChart implements PlotRenderer {

  private clipPath = document.createElementNS(NAMESPACE, 'clipPath')
  private rect = document.createElementNS(NAMESPACE, 'rect')
  private id = `clip-${Math.random().toString(16).slice(2)}`
  private cachedSize = { x: 0, y: 0, width: 0, height: 0 }

  private multiLine: MultiLineChart | null = null

  constructor(private target: 'top' | 'right' | 'bottom' | 'left' | 'center' = 'center') { }

  attach(root: SVGGElement, multiLine: MultiLineChart): void {
    this.clipPath.setAttribute('id', this.id)
    this.clipPath.appendChild(this.rect)
    multiLine.addDefs(this.clipPath)
    this.multiLine = multiLine
  }

  detach(): void {
    this.clipPath.remove()
  }

  didLayout(space: ChartSpace, full: Size): void {
    if (!this.multiLine) return
    const layout = this.target === 'center' ? space.layout : this.multiLine.getSlotRect(this.target)
    this.setRect(layout.x, layout.y, layout.width, layout.height)
  }

  render(space: ChartSpace, overflow: Overflow): void { }

  clip(element: SVGGElement) {
    element.setAttribute('clip-path', this.getClipPath())
  }

  setRect(x: number, y: number, width: number, height: number) {
    if (this.cachedSize.x === x && this.cachedSize.y === y && this.cachedSize.width === width && this.cachedSize.height === height) return
    this.cachedSize = { x, y, width, height }
    this.rect.setAttribute('x', x.toString())
    this.rect.setAttribute('y', y.toString())
    this.rect.setAttribute('width', width.toString())
    this.rect.setAttribute('height', height.toString())
  }

  getClipPath() {
    return `url(#${this.id})`
  }
}