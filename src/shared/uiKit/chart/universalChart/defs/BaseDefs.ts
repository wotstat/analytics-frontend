import { DefsRenderer, UniversalChart } from '../UniversalChart'


export class BaseDefs<T extends Element = Element> implements DefsRenderer {

  protected id: string
  protected chart: UniversalChart | null = null
  public readonly root: T

  constructor(root: T, prefix = 'def') {
    this.root = root
    this.id = `pattern-${Math.random().toString(16).slice(2)}`
    this.root.setAttribute('id', this.id)
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

  getUrl() {
    return `url(#${this.id})`
  }
}