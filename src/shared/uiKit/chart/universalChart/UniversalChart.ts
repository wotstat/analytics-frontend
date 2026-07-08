import './style.scss'

import BaseChart from '../BaseChart'
import { Bounds, BoundsConstraint } from './utils/Bounds'
import { ChartSpace } from './utils/ChartSpace'
import { Offset4Side, unwrapOffset } from './utils/utils'
import { ChartRenderManager } from '../ChartRenderManager'

type Options = {
  renderBounds?: { minX?: number, maxX?: number, minY?: number, maxY?: number },
  renderBoundsPadding?: Offset4Side,
  minLayoutSize?: Offset4Side,
  layoutVariant?: 'horizontal' | 'vertical' | 'square',
  root?: HTMLElement
  renderManager?: ChartRenderManager
}

export type Size = { width: number, height: number }
export type Overflow = { top: number, right: number, bottom: number, left: number }

export interface BaseRenderer {
  attach?(root: SVGGElement, chart: UniversalChart): void
  detach?(): void
  didMount?(): void
  didLayout?(space: ChartSpace, full: Size): void
  beforeLayout?(space: ChartSpace, full: Size): void
  afterLayout?(space: ChartSpace, overflow: Overflow, full: Size): void
  render?(space: ChartSpace, overflow: Overflow, full: Size): void
  getRootElement?(): Element
}

export interface SlotRenderer extends BaseRenderer {
  getSize(space: ChartSpace, overflow: Overflow, full: Size): { width: number | null, height: number | null }
}

export interface PlotRenderer extends BaseRenderer {
  getBounds?(constraint?: BoundsConstraint): Bounds
}

export interface DefsRenderer extends BaseRenderer { }

const NAMESPACE = 'http://www.w3.org/2000/svg'

const globalChartRenderManager = new ChartRenderManager(4)

export class UniversalChart extends BaseChart {

  private userDefinedBounds: { minX: number | null, maxX: number | null, minY: number | null, maxY: number | null } | null = null
  private renderBoundsPadding = { top: 0, right: 0, bottom: 0, left: 0 }
  private minLayoutSize = { top: 0, right: 0, bottom: 0, left: 0 }

  private chartSpace = new ChartSpace({ x: 0, y: 0, width: 0, height: 0 }, new Bounds())
  private plotBounds = new Bounds()

  private topRenderers: SlotRenderer[] = []
  private rightRenderers: SlotRenderer[] = []
  private bottomRenderers: SlotRenderer[] = []
  private leftRenderers: SlotRenderer[] = []
  private plotRenderers: PlotRenderer[] = []
  private allRenderers: BaseRenderer[] = []
  private defsRenderers: BaseRenderer[] = []
  private renderTargets = [
    this.defsRenderers, this.topRenderers, this.rightRenderers, this.bottomRenderers, this.leftRenderers, this.plotRenderers
  ]

  private layoutCacheKey = ''
  private hierarchyCache = new Map<string, SVGGElement>()

  private defs = document.createElementNS(NAMESPACE, 'defs')

  get space() {
    return this.chartSpace
  }

  constructor(readonly options: Options) {
    super(options.renderManager || globalChartRenderManager)

    this.svg.classList.add('universal-chart-root')
    this.svg.appendChild(this.defs)

    this.setRenderBounds(options.renderBounds)
    this.setRenderBoundsPadding(options.renderBoundsPadding ?? { horizontal: 0, vertical: 0 })
    this.setMinLayoutSize(options.minLayoutSize ?? { horizontal: 0, vertical: 0 })

    if (this.options.root) this.attach(this.options.root)
  }

  dispose() {
    super.dispose()
    for (const renderer of this.allRenderers) renderer.detach?.()
  }

  addSlot(position: 'top' | 'right' | 'bottom' | 'left', slot: SlotRenderer, path: string | string[] = []) {
    const root = this.getRootFor(Array.isArray(path) ? path : path.split('>'))

    const element = slot.getRootElement?.()
    if (element) root.appendChild(element)

    slot.attach?.(root, this)

    switch (position) {
      case 'top':
        this.topRenderers.push(slot)
        break
      case 'right':
        this.rightRenderers.push(slot)
        break
      case 'bottom':
        this.bottomRenderers.push(slot)
        break
      case 'left':
        this.leftRenderers.push(slot)
        break
    }
    this.allRenderers.push(slot)
    return this
  }

  addPlot(plot: PlotRenderer, path: string | string[] = []) {
    const root = this.getRootFor(Array.isArray(path) ? path : path.split('>'))

    const element = plot.getRootElement?.()
    if (element) root.appendChild(element)

    plot.attach?.(root, this)
    this.plotRenderers.push(plot)
    this.allRenderers.push(plot)
    return this
  }

  addDefs(...defs: DefsRenderer[]) {
    for (const def of defs) {
      const element = def.getRootElement?.()
      if (element) this.defs.appendChild(element)

      def.attach?.(this.defs, this)
      this.defsRenderers.push(def)
      this.allRenderers.push(def)
    }

    return this
  }

  dataDidChange() {
    this.scheduleRender()
  }

  // Per axis-bound: a number pins it, `undefined` leaves it unchanged, `null` releases
  // it back to auto-fit (recomputed from data on every layout). Passing no object at all
  // releases every axis.
  setRenderBounds(bounds: { minX?: number | null, maxX?: number | null, minY?: number | null, maxY?: number | null } | undefined, immediate: boolean = false) {
    if (!bounds) {
      this.userDefinedBounds = null
      this.dataDidChange()
      return
    }

    if (!this.userDefinedBounds) this.userDefinedBounds = { minX: null, maxX: null, minY: null, maxY: null }

    let changed = false
    const ud = this.userDefinedBounds

    if (bounds.minX !== undefined && bounds.minX !== ud.minX) {
      ud.minX = bounds.minX
      changed = true
    }
    if (bounds.maxX !== undefined && bounds.maxX !== ud.maxX) {
      ud.maxX = bounds.maxX
      changed = true
    }
    if (bounds.minY !== undefined && bounds.minY !== ud.minY) {
      ud.minY = bounds.minY
      changed = true
    }
    if (bounds.maxY !== undefined && bounds.maxY !== ud.maxY) {
      ud.maxY = bounds.maxY
      changed = true
    }

    if (ud.maxX && Math.abs(ud.maxX) == Infinity) ud.maxX = null
    if (ud.minX && Math.abs(ud.minX) == Infinity) ud.minX = null
    if (ud.maxY && Math.abs(ud.maxY) == Infinity) ud.maxY = null
    if (ud.minY && Math.abs(ud.minY) == Infinity) ud.minY = null

    if (changed) this.dataDidChange()
    if (immediate) this.relayout()
  }

  setMinLayoutSize(size: Offset4Side) {
    this.minLayoutSize = unwrapOffset(size)
    this.dataDidChange()
  }

  setRenderBoundsPadding(padding: Offset4Side) {
    this.renderBoundsPadding = unwrapOffset(padding)
    this.dataDidChange()
  }

  getSlotRect(slot: 'top' | 'right' | 'bottom' | 'left') {
    const l = this.chartSpace.layout
    const w = this.size.width
    const h = this.size.height
    const bH = h - (l.y + l.height)
    const rW = w - (l.x + l.width)

    switch (this.options.layoutVariant ?? 'horizontal') {
      case 'horizontal': {
        switch (slot) {
          case 'top': return { x: 0, y: 0, width: w, height: l.y }
          case 'bottom': return { x: 0, y: l.y + l.height, width: w, height: bH }
          case 'left': return { x: 0, y: l.y, width: l.x, height: l.height }
          case 'right': return { x: l.x + l.width, y: l.y, width: rW, height: h - l.y - bH }
        }
      }

      case 'vertical': {
        const rW = w - (l.x + l.width)
        switch (slot) {
          case 'top': return { x: l.x, y: 0, width: w - l.x - rW, height: l.y }
          case 'bottom': return { x: l.x, y: l.y + l.height, width: w - l.x - rW, height: bH }
          case 'right': return { x: l.x + l.width, y: 0, width: rW, height: h }
          case 'left': return { x: 0, y: 0, width: l.x, height: h }
        }
      }

      case 'square': {
        switch (slot) {
          case 'top': return { x: l.x, y: 0, width: w - l.x - rW, height: l.y }
          case 'bottom': return { x: l.x, y: l.y + l.height, width: w - l.x - rW, height: bH }
          case 'left': return { x: 0, y: l.y, width: l.x, height: l.height }
          case 'right': return { x: l.x + l.width, y: l.y, width: rW, height: h - l.y - bH }
        }
      }
    }
  }

  protected didMount(): void {
    for (const renderer of this.allRenderers) renderer.didMount?.()
  }

  protected renderImpl(step: number): void {
    if (step == 0) {
      for (const target of this.renderTargets) {
        for (const renderer of target) renderer.beforeLayout?.(this.chartSpace, this.size)
      }
      return
    }

    if (step == 1) {
      this.relayout()
      return
    }

    let overflow = { top: 0, right: 0, bottom: 0, left: 0 }
    switch (this.options.layoutVariant ?? 'horizontal') {
      case 'horizontal':
        overflow = {
          top: 0, bottom: 0,
          right: this.size.width - this.chartSpace.layout.x - this.chartSpace.layout.width,
          left: this.chartSpace.layout.x
        }
        break
      case 'vertical':
        overflow = {
          right: 0, left: 0,
          top: this.chartSpace.layout.y,
          bottom: this.size.height - this.chartSpace.layout.y - this.chartSpace.layout.height
        }
        break
    }

    if (step == 2) {
      for (const target of this.renderTargets) {
        for (const renderer of target) renderer.afterLayout?.(this.chartSpace, overflow, this.size)
      }
    }

    if (step == 3) {
      this.mutateViewBox()
      for (const target of this.renderTargets) {
        for (const renderer of target) renderer.render?.(this.chartSpace, overflow, this.size)
      }
    }
  }

  relayout() {
    this.recalculateDataBounds()
    this.chartSpace.bounds = this.calculateRenderBounds()
    const layoutChanged = this.layout()
    if (layoutChanged) for (const renderer of this.allRenderers) renderer.didLayout?.(this.chartSpace, this.size)
    return layoutChanged
  }

  private layout() {

    const key = `${this.size.width}x${this.size.height}-${this.chartSpace.bounds.getHash()}-${this.userDefinedBounds ? `${this.userDefinedBounds.minX ?? 'n'}-${this.userDefinedBounds.maxX ?? 'n'}-${this.userDefinedBounds.minY ?? 'n'}-${this.userDefinedBounds.maxY ?? 'n'}` : 'd'}`
    if (key === this.layoutCacheKey) return false
    this.layoutCacheKey = key

    const full = this.size
    const w = this.size.width
    const h = this.size.height

    let layout = new ChartSpace({ x: 0, y: 0, width: w, height: h }, this.chartSpace.bounds)
    let overflow = { top: 0, right: 0, bottom: 0, left: 0 }

    const process = (renderers: SlotRenderer[], dir: keyof typeof overflow, minSize: number) => {
      let res = minSize
      const prop = dir === 'top' || dir === 'bottom' ? 'height' : 'width'
      for (const slot of renderers) res = Math.max(res, slot.getSize(layout, overflow, full)[prop] ?? 0)
      overflow[dir] = res
      return res
    }

    if (this.options.layoutVariant === 'vertical') {
      layout.layout.y = process(this.topRenderers, 'top', this.minLayoutSize.top)
      layout.layout.height = h - layout.layout.y - process(this.bottomRenderers, 'bottom', this.minLayoutSize.bottom)
      layout.layout.x = process(this.leftRenderers, 'left', this.minLayoutSize.left)
      layout.layout.width = w - layout.layout.x - process(this.rightRenderers, 'right', this.minLayoutSize.right)
    } else {
      layout.layout.x = process(this.leftRenderers, 'left', this.minLayoutSize.left)
      layout.layout.width = w - layout.layout.x - process(this.rightRenderers, 'right', this.minLayoutSize.right)
      layout.layout.y = process(this.topRenderers, 'top', this.minLayoutSize.top)
      layout.layout.height = h - layout.layout.y - process(this.bottomRenderers, 'bottom', this.minLayoutSize.bottom)
    }

    if (layoutEquals(this.chartSpace.layout, layout.layout)) return false

    this.chartSpace.layout = layout.layout

    return true
  }

  private calculateRenderBounds() {
    const ud = this.userDefinedBounds
    if (ud && ud.minX !== null && ud.maxX !== null && ud.minY !== null && ud.maxY !== null) {
      return Bounds.fromMinMax(ud.minX, ud.maxX, ud.minY, ud.maxY)
    }

    return this.autoFitBounds({
      minX: ud?.minX ?? undefined,
      maxX: ud?.maxX ?? undefined,
      minY: ud?.minY ?? undefined,
      maxY: ud?.maxY ?? undefined,
    })
  }

  // The bounds the auto-fit layout path produces for a given axis constraint: axes left
  // unset are fitted to the data lying inside the set ones, with render padding applied.
  // Exposed so an interactive controller can read the target an auto-fitted axis is about
  // to snap to and animate toward it instead (see ZoomChartComponent).
  autoFitBounds(constraint: BoundsConstraint): Bounds {
    const hasConstraint = constraint.minX !== undefined || constraint.maxX !== undefined ||
      constraint.minY !== undefined || constraint.maxY !== undefined
    let bounds = hasConstraint ? this.calculateActualDataBounds(constraint) : this.plotBounds.clone()

    if (bounds.isEmpty()) bounds = this.plotBounds.clone()

    return Bounds.fromMinMax(
      constraint.minX ?? (bounds.minX - this.renderBoundsPadding.left),
      constraint.maxX ?? (bounds.maxX + this.renderBoundsPadding.right),
      constraint.minY ?? (bounds.minY - this.renderBoundsPadding.bottom),
      constraint.maxY ?? (bounds.maxY + this.renderBoundsPadding.top),
    )
  }

  private calculateActualDataBounds(constraint?: BoundsConstraint) {
    const bounds = new Bounds()
    for (const line of this.plotRenderers) {
      if (line.getBounds) bounds.extend(line.getBounds(constraint))
    }

    if (!bounds.isEmpty()) {
      if (bounds.minX == bounds.maxX) {
        bounds.minX -= 1
        bounds.maxX += 1
      }

      if (bounds.minY == bounds.maxY) {
        bounds.minY -= 1
        bounds.maxY += 1
      }
    }
    return bounds
  }

  private recalculateDataBounds() {
    this.plotBounds = this.calculateActualDataBounds()
  }

  private getRootFor(path: string[]) {
    if (path.length === 0) return this.svg

    const key = path.join('/')
    if (this.hierarchyCache.has(key)) return this.hierarchyCache.get(key)!

    let currentRoot = this.svg as SVGGElement
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

function layoutEquals(a: ChartSpace['layout'], b: ChartSpace['layout']) {
  return a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height
}