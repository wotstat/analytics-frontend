import { Axis } from '../labels/BaseLabels'
import { UniversalChart, Overflow, PlotRenderer, Size } from '../UniversalChart'
import { ChartSpace } from '../utils/ChartSpace'

export type TickData = {
  p: number
  value: number
}

export abstract class BaseTicks implements PlotRenderer {

  protected root = document.createElementNS('http://www.w3.org/2000/svg', 'g')

  private elementsByKey = new Map<number, SVGLineElement>()
  private elementsXYCache = new Map<SVGLineElement, { x1: number, y1: number, x2: number, y2: number }>()

  constructor(protected axis: Axis) {
    this.root.classList.add(axis === 'horizontal' ? 'x-ticks' : 'y-ticks')
  }

  getRootElement(): Element {
    return this.root
  }

  attach(root: SVGGElement, chart: UniversalChart): void { }

  detach(): void {
    this.elementsByKey.clear()
    this.elementsXYCache.clear()
  }

  render(space: ChartSpace, overflow: Overflow, full: Size): void {
    if (!this.root) {
      console.warn('Trying to render ticks without root element')
      return
    }

    const ticks = this.getTicks(space)

    const usedKeys = new Set<number>(ticks.map(t => t.value))
    for (const [key, element] of this.elementsByKey) {
      if (!usedKeys.has(key)) {
        this.root.removeChild(element)
        this.elementsByKey.delete(key)
        this.elementsXYCache.delete(element)
      }
    }

    for (const tick of ticks) {
      let element = this.elementsByKey.get(tick.value)
      if (!element) {
        element = this.createElement()
        this.elementsByKey.set(tick.value, element)
      }
      this.setupElement(element, tick, space, overflow, full)
    }
  }

  getTicks(space: ChartSpace): TickData[] {
    const requiredTicks = this.getTicksValues()

    if (this.axis === 'horizontal') {
      return requiredTicks
        .map(value => ({ p: space.chartToLayoutX(value), value }))
        .filter(tick => tick.p >= space.layout.x && tick.p <= space.layout.x + space.layout.width)
    } else {
      return requiredTicks
        .map(value => ({ p: space.chartToLayoutY(value), value }))
        .filter(tick => tick.p >= space.layout.y && tick.p <= space.layout.y + space.layout.height)
    }
  }

  getTicksValues(): number[] { return [] }

  protected setupElement(element: SVGLineElement, tick: TickData, space: ChartSpace, overflow: Overflow, full: Size) {
    this.setXY(element,
      tick.p,
      0,
      tick.p,
      space.layout.y + space.layout.height + 20
    )
  }

  protected setXY(element: SVGLineElement, x1: number, y1: number, x2: number, y2: number) {
    const cached = this.elementsXYCache.get(element)

    if (!cached) {
      this.elementsXYCache.set(element, { x1, y1, x2, y2 })
      element.setAttribute('x1', x1.toString())
      element.setAttribute('y1', y1.toString())
      element.setAttribute('x2', x2.toString())
      element.setAttribute('y2', y2.toString())
      return
    }

    if (cached.x1 !== x1) {
      cached.x1 = x1
      element.setAttribute('x1', x1.toString())
    }

    if (cached.y1 !== y1) {
      cached.y1 = y1
      element.setAttribute('y1', y1.toString())
    }

    if (cached.x2 !== x2) {
      cached.x2 = x2
      element.setAttribute('x2', x2.toString())
    }

    if (cached.y2 !== y2) {
      cached.y2 = y2
      element.setAttribute('y2', y2.toString())
    }
  }

  protected createElement(): SVGLineElement {
    const element = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    element.classList.add('tick')
    this.root?.appendChild(element)
    return element
  }

}