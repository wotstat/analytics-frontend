import { LabelsRenderer, MultiLineChart } from '../MultiLine'
import { ChartSpace } from '../utils/ChartSpace'

type LabelData = {
  key: string
  p: number
  label: string
  value: number
}

export type Axis = 'vertical' | 'horizontal'
export abstract class BaseLabels implements LabelsRenderer {

  protected root: SVGGElement | null = null
  private cachedSizes = new Map<string, number>()
  private cachedMetrics: TextMetrics | null = null
  private ctx = document.createElement('canvas').getContext('2d')


  private elementByKey = new Map<string, SVGTextElement>()
  private lastPersistent = 0
  private lastRenderedTicks: number[] = []

  constructor(readonly axis: Axis) { }

  attach(root: SVGGElement, multiLine: MultiLineChart): void {
    this.root = root
  }

  detach(): void {
    if (!this.root) return
    for (const element of this.elementByKey.values()) {
      this.root.removeChild(element)
    }
    this.elementByKey.clear()
    this.cachedSizes.clear()
    this.cachedMetrics = null
    this.root = null
  }

  render(space: ChartSpace, overflow: { start: number, end: number }) {
    this.lastRenderedTicks = []
    if (!this.root) {
      console.warn('Trying to render labels without root element')
      return
    }

    const labels = this.calculateLabelPositions(space, overflow)
    const usedKeys = new Set<string>(labels.map(l => l.key))
    this.lastRenderedTicks = labels.map(l => l.value)

    for (const [key, element] of this.elementByKey) {
      if (!usedKeys.has(key)) {
        this.root.removeChild(element)
        this.elementByKey.delete(key)
      }
    }

    for (const key of this.cachedSizes.keys()) {
      if (!usedKeys.has(key)) this.cachedSizes.delete(key)
    }

    if (this.axis === 'horizontal') this.renderHorizontalLabel(space, labels)
    else this.renderVerticalLabel(space, labels)

  }

  protected renderHorizontalLabel(space: ChartSpace, labels: LabelData[]) {
    const y = space.layout.y + space.layout.height + this.getYOffset()
    const yStr = y.toString()

    if (this.lastPersistent !== y) {
      for (const element of this.elementByKey.values()) element.setAttribute('y', yStr)
      this.lastPersistent = y
    }

    for (const label of labels) {
      if (!this.elementByKey.has(label.key)) {
        const element = this.createLabel()
        this.elementByKey.set(label.key, element)
        element.setAttribute('y', yStr)
      }
    }

    for (const label of labels) {
      const element = this.elementByKey.get(label.key)
      if (!element) continue
      element.setAttribute('x', label.p.toString())
      if (element.textContent !== label.label) {
        element.textContent = label.label
      }
    }
  }

  protected renderVerticalLabel(space: ChartSpace, labels: LabelData[]) {
    const x = space.layout.x - this.getXOffset(space)
    const xStr = x.toString()

    if (this.lastPersistent !== x) {
      for (const element of this.elementByKey.values()) element.setAttribute('x', xStr)
      this.lastPersistent = x
    }

    for (const label of labels) {
      if (!this.elementByKey.has(label.key)) {
        const element = this.createLabel()
        this.elementByKey.set(label.key, element)
        element.setAttribute('x', xStr)
      }
    }

    for (const label of labels) {
      const element = this.elementByKey.get(label.key)
      if (!element) continue
      element.setAttribute('y', label.p.toString())
      if (element.textContent !== label.label) {
        element.textContent = label.label
      }
    }
  }

  getRequiredTicks(): number[] {
    return this.lastRenderedTicks
  }

  recalculateFont() {
    if (!this.ctx) return

    const probeLabel = this.createLabel()
    const fontFamily = probeLabel.computedStyleMap().get('font-family')?.toString()
    const fontSize = probeLabel.computedStyleMap().get('font-size')?.toString()
    probeLabel.remove()

    const target = `${fontSize} ${fontFamily}`
    if (this.ctx.font == target) return

    this.ctx.font = target
    this.cachedSizes.clear()
    this.cachedMetrics = null
  }

  getHeight(): number {
    const metrics = this.getTextMetrics()
    return this.getYOffset() + metrics.fontBoundingBoxDescent
  }

  getYOffset(): number {
    const metrics = this.getTextMetrics()
    return metrics.hangingBaseline + 8
  }

  getXOffset(space: ChartSpace): number {
    // return space.layout.x
    return 5
  }

  abstract calculateLabelPositions(space: ChartSpace, overflow: { start: number, end: number }): LabelData[]

  protected createLabel(textContent = ''): SVGTextElement {
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    label.classList.add('label')
    label.textContent = textContent
    this.root?.appendChild(label)
    return label
  }

  getTextWidth(text: string): number {
    if (!this.ctx) return 30
    if (this.cachedSizes.has(text)) return this.cachedSizes.get(text) as number

    const width = this.ctx.measureText(text).width

    this.cachedSizes.set(text, width)

    return width
  }

  getTextHeight(text: string): number {
    const metrics = this.getTextMetrics()
    return metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent
  }

  getTextMetrics() {
    if (this.cachedMetrics !== null) return this.cachedMetrics
    if (!this.ctx) return new TextMetrics()
    const metrics = this.ctx.measureText('M')
    this.cachedMetrics = metrics

    return this.cachedMetrics
  }
}