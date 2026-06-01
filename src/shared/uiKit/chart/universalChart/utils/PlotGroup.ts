import { UniversalChart, Overflow, PlotRenderer } from '../UniversalChart'
import { Bounds } from './Bounds'
import { ChartSpace } from './ChartSpace'
import { ChartClip } from '../defs/ChartClip'
import { ChartMask } from '../defs/ChartMask'


const NAMESPACE = 'http://www.w3.org/2000/svg'
export class PlotGroup implements PlotRenderer {

  public root: SVGGElement = document.createElementNS(NAMESPACE, 'g')

  protected plots: { plot: PlotRenderer, root: SVGGElement }[] = []
  protected hierarchyCache = new Map<string, SVGGElement>()
  protected chart: UniversalChart | null = null

  constructor(readonly classes: string[] = []) {
    this.root.classList.add('plot-group', ...classes)
  }

  clipBy(clip: ChartClip) {
    clip.clip(this.root)
    return this
  }

  maskBy(mask: ChartMask) {
    mask.mask(this.root)
    return this
  }

  addPlot(plot: PlotRenderer, path: string[] = []) {
    const root = this.getRootFor(path)

    const element = plot.getRootElement?.()
    if (element) root.appendChild(element)

    if (this.chart) plot.attach?.(root, this.chart)
    this.plots.push({ plot, root })
    return this
  }

  getBounds?(): Bounds {
    const bounds = new Bounds()
    for (const { plot } of this.plots) {
      if (plot.getBounds) bounds.extend(plot.getBounds())
    }
    return bounds
  }

  attach(root: SVGGElement, chart: UniversalChart): void {
    root.appendChild(this.root)
    if (!this.chart) {
      this.chart = chart
      for (const { plot, root } of this.plots) plot.attach?.(root, chart)
    }
  }

  detach(): void {
    for (const { plot } of this.plots) plot.detach?.()
  }

  render(space: ChartSpace, overflow: Overflow, full: { width: number, height: number }): void {
    for (const { plot } of this.plots) plot.render?.(space, overflow, full)
  }

  private getRootFor(path: string[]) {
    if (path.length === 0) return this.root
    const key = path.join('/')
    if (this.hierarchyCache.has(key)) return this.hierarchyCache.get(key)!

    let currentRoot = this.root
    for (const part of path) {
      let nextRoot = currentRoot.querySelector<SVGGElement>(`:scope > g.${part}`)
      if (!nextRoot) {
        nextRoot = document.createElementNS(NAMESPACE, 'g')
        nextRoot.classList.add(...part.split('.'))
        currentRoot.appendChild(nextRoot)
      }
      currentRoot = nextRoot
    }

    this.hierarchyCache.set(key, currentRoot)
    return currentRoot
  }

}