import { MultiLineChart, PlotBoundsRenderer } from '../../MultiLine'
import { Bounds } from '../../utils/Bounds'
import { ChartSpace } from '../../utils/ChartSpace'
import { Point } from '../../utils/Point'


export abstract class BaseLine implements PlotBoundsRenderer {
  protected multiLine: MultiLineChart | null = null
  protected bounds: Bounds | null = null
  protected isDirty = true

  protected line = document.createElementNS('http://www.w3.org/2000/svg', 'path')

  private lastRenderedBoundsHash = ''

  constructor(classes: string[] = []) {
    this.line.classList.add('line', ...classes)
  }

  abstract getPointsCount(): number
  abstract getPointAt(index: number): Point | null
  abstract getPointsInBounds(bounds: Bounds): (Point | null)[]

  protected pointsDidChange() {
    this.isDirty = true
    this.bounds = null
    this.multiLine?.dataDidChange()
  }

  attach(root: SVGGElement, multiLine: MultiLineChart) {
    this.multiLine = multiLine
    root.appendChild(this.line)
  }

  detach() {
    this.line.remove()
  }

  getBounds(): Bounds {
    if (this.bounds && !this.bounds.isEmpty()) return this.bounds

    this.bounds = new Bounds()
    const pointsCount = this.getPointsCount()
    for (let i = 0; i < pointsCount; i++) {
      const p = this.getPointAt(i)
      if (p) this.bounds.addPoint(p)
    }
    return this.bounds
  }

  render(space: ChartSpace, force: boolean = false) {
    if (!this.isDirty && !force && this.lastRenderedBoundsHash === space.getHash()) return

    const points = this.getPointsInBounds(space.bounds)

    if (points.length === 0) {
      this.line.setAttribute('d', '')
      return
    }

    let d = ''
    let lastPointIsNull = true
    for (let i = 0; i < points.length; i++) {
      const point = points[i]
      if (point === null) {
        lastPointIsNull = true
        continue
      }

      const p = space.chartToLayout(point)
      d += `${lastPointIsNull ? 'M' : 'L'} ${p.x} ${p.y} `
      lastPointIsNull = false
    }

    this.line.setAttribute('d', d)

    this.isDirty = false
    this.lastRenderedBoundsHash = space.getHash()
  }
}
