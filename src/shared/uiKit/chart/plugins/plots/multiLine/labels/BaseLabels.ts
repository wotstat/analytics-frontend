import { LabelsRenderer, MultiLineChart } from '../MultiLine'
import { ChartSpace } from '../utils/ChartSpace'
import { Font } from './shared'

type LabelData = {
  key: string
  x: number
  label: string
  value: number
}

const DEFAULT_LABEL_PADDING = 5
export abstract class BaseLabels implements LabelsRenderer {

  protected root: SVGGElement | null = null
  private cachedSizes = new Map<string, number>()
  private cachedHeight: TextMetrics | null = null
  private ctx = document.createElement('canvas').getContext('2d')


  private elementByKey = new Map<string, SVGTextElement>()
  private lastY = 0
  private lastRenderedTicks: number[] = []

  constructor() { }

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
    this.cachedHeight = null
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

    const y = space.translateY(0) + this.getYOffset()
    const yStr = y.toString()

    if (this.lastY !== y) {
      for (const element of this.elementByKey.values()) element.setAttribute('y', yStr)
      this.lastY = y
    }

    for (const key of usedKeys) {
      if (!this.elementByKey.has(key)) {
        const element = this.createLabel()
        this.elementByKey.set(key, element)
        element.setAttribute('y', yStr)
      }
    }

    for (const label of labels) {
      const element = this.elementByKey.get(label.key)
      if (!element) continue
      element.setAttribute('x', label.x.toString())
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
    const font = this.getFont()

    let changed = false

    if (font && 'font' in font && font.font) {
      if (this.ctx.font != font.font) changed = true
      this.ctx.font = font.font
    } else if (font && 'fontSize' in font && 'fontFamily' in font && font.fontSize && font.fontFamily) {
      const target = `${font.fontSize}px ${font.fontFamily}`
      if (this.ctx.font != target) changed = true
      this.ctx.font = target
    } else {
      const probeLabel = this.createLabel()

      const defaultFontFamily = probeLabel.computedStyleMap().get('font-family')?.toString()
      const defaultFontSize = probeLabel.computedStyleMap().get('font-size')?.toString()

      probeLabel.remove()

      const fontFamily = font && 'fontFamily' in font && font.fontFamily ? font.fontFamily : defaultFontFamily
      const fontSize = font && 'fontSize' in font && font.fontSize ? font.fontSize : defaultFontSize

      const target = `${fontSize} ${fontFamily}`
      if (this.ctx.font != target) changed = true
      this.ctx.font = target
    }

    if (changed) {
      this.cachedSizes.clear()
      this.cachedHeight = null
    }
  }

  getHeight(): number {
    const metrics = this.getTextMetrics()
    return this.getYOffset() + metrics.fontBoundingBoxDescent
  }

  getYOffset(): number {
    const metrics = this.getTextMetrics()
    return metrics.hangingBaseline + 8
  }

  abstract calculateLabelPositions(space: ChartSpace, overflow: { start: number, end: number }): LabelData[]

  getFont(): Font | undefined {
    return undefined
  }

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

  getTextMetrics() {
    if (this.cachedHeight !== null) return this.cachedHeight
    if (!this.ctx) return new TextMetrics()
    const metrics = this.ctx.measureText('M')
    this.cachedHeight = metrics

    return this.cachedHeight
  }
}