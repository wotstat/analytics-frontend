import { MultiLineChart, Overflow, PlotRenderer } from '../MultiLine'
import { ChartSpace } from '../utils/ChartSpace'

const NAMESPACE = 'http://www.w3.org/2000/svg'
type Size = { width: number, height: number }
export class ClipChart implements PlotRenderer {

  private clipPath = document.createElementNS(NAMESPACE, 'clipPath')
  private rect = document.createElementNS(NAMESPACE, 'rect')
  private id = `clip-${Math.random().toString(16).slice(2)}`

  private layoutClip: (space: ChartSpace, full: Size) => void

  constructor(private target: 'top' | 'right' | 'bottom' | 'left' | 'center' = 'center') {
    switch (this.target) {
      case 'top':
        this.layoutClip = this.clipTop.bind(this)
        break
      case 'right':
        this.layoutClip = this.clipRight.bind(this)
        break
      case 'bottom':
        this.layoutClip = this.clipBottom.bind(this)
        break
      case 'left':
        this.layoutClip = this.clipLeft.bind(this)
        break
      case 'center':
        this.layoutClip = this.clipCenter.bind(this)
        break
    }
  }

  attach(root: SVGGElement, multiLine: MultiLineChart): void {
    this.clipPath.setAttribute('id', this.id)
    this.clipPath.appendChild(this.rect)
    multiLine.addDefs(this.clipPath)
  }

  detach(): void {
    this.clipPath.remove()
  }

  didLayout(space: ChartSpace, full: Size): void {
    this.layoutClip(space, full)
  }

  protected clipTop(space: ChartSpace, full: Size) {
    this.setRect(0, 0, full.width, full.height)
  }

  protected clipRight(space: ChartSpace, full: Size) {
    const x = space.layout.x + space.layout.width
    this.setRect(x, space.layout.y, full.width - x, space.layout.height)
  }

  protected clipBottom(space: ChartSpace, full: Size) {
    const y = space.layout.y + space.layout.height
    this.setRect(0, y, full.width, full.height - y)
  }

  protected clipLeft(space: ChartSpace, full: Size) {
    this.setRect(0, space.layout.y, space.layout.x, space.layout.y + space.layout.height)
  }

  protected clipCenter(space: ChartSpace, full: Size) {
    this.setRect(
      space.layout.x,
      space.layout.y,
      space.layout.width,
      space.layout.height
    )
  }

  render(space: ChartSpace, overflow: Overflow): void { }

  clip(element: SVGGElement) {
    element.setAttribute('clip-path', this.getClipPath())
  }

  setRect(x: number, y: number, width: number, height: number) {
    this.rect.setAttribute('x', x.toString())
    this.rect.setAttribute('y', y.toString())
    this.rect.setAttribute('width', width.toString())
    this.rect.setAttribute('height', height.toString())
  }

  getClipPath() {
    return `url(#${this.id})`
  }
}