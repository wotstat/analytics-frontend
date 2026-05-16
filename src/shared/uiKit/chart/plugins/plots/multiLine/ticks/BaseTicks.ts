import { MultiLineChart, TicksRenderer } from '../MultiLine'
import { ChartSpace } from '../utils/ChartSpace'

type TickData = {
  x: number
  value: number
}
export abstract class BaseTicks implements TicksRenderer {

  private root: SVGGElement | null = null

  private elementsByKey = new Map<number, SVGLineElement>()
  private elementsXYCache = new Map<SVGLineElement, { x1: number, y1: number, x2: number, y2: number }>()

  attach(root: SVGGElement, multiLine: MultiLineChart): void {
    this.root = root
  }

  detach(): void {
    if (!this.root) return
    for (const element of this.elementsByKey.values()) {
      this.root.removeChild(element)
    }
    this.elementsByKey.clear()
    this.root = null
  }

  render(space: ChartSpace): void {
    if (!this.root) {
      console.warn('Trying to render ticks without root element')
      return
    }

    const ticks = this.getTicks(space)
    if (ticks.length == 0) return

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
      this.setupElement(space, element, tick)
    }
  }

  abstract getTicks(space: ChartSpace): TickData[]

  protected setupElement(space: ChartSpace, element: SVGLineElement, tick: TickData) {
    this.setXY(element,
      tick.x,
      0,
      tick.x,
      space.translateY(0) + 2
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