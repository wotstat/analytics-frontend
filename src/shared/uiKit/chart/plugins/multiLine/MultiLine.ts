import './style.scss'

import { ChartDelegate, ChartPlugin } from '../../Chart'
import { Bounds } from './utils/Bounds'
import { ChartSpace } from './utils/ChartSpace'

type Options = {
  renderBounds?: { minX?: number, maxX?: number, minY?: number, maxY?: number },
  renderBoundsPadding?: { top?: number, right?: number, bottom?: number, left?: number } | { horizontal?: number, vertical?: number },
  layoutVariant?: 'horizontal' | 'vertical' | 'square'
}

export type Size = { width: number, height: number }
export type Overflow = { top: number, right: number, bottom: number, left: number }
export interface BaseRenderer {
  attach?(root: SVGGElement, multiLine: MultiLineChart): void
  detach?(): void
  didMount?(): void
  didLayout?(space: ChartSpace, full: Size): void
  render?(space: ChartSpace, overflow: Overflow, full: Size): void
  getRootElement?(): Element
}

export interface SlotRenderer extends BaseRenderer {
  getSize(space: ChartSpace, overflow: Overflow, full: Size): { width: number | null, height: number | null }
}

export interface PlotRenderer extends BaseRenderer {
  getBounds?(): Bounds
}

export interface DefsRenderer extends BaseRenderer { }

const NAMESPACE = 'http://www.w3.org/2000/svg'

export class MultiLineChart implements ChartPlugin {
  private chartDelegate: ChartDelegate | null = null

  private userDefinedBounds: { minX: number | null, maxX: number | null, minY: number | null, maxY: number | null } | null = null
  private renderBoundsPadding: { top: number, right: number, bottom: number, left: number } = { top: 0, right: 0, bottom: 0, left: 0 }

  private width = 0
  private height = 0
  mainSpace = new ChartSpace({ x: 0, y: 0, width: 0, height: 0 }, new Bounds())
  private plotBounds = new Bounds()

  private topRenderers: SlotRenderer[] = []
  private rightRenderers: SlotRenderer[] = []
  private bottomRenderers: SlotRenderer[] = []
  private leftRenderers: SlotRenderer[] = []
  private plotRenderers: PlotRenderer[] = []
  private allRenderers: BaseRenderer[] = []
  private defsRenderers: BaseRenderer[] = []

  private layoutCacheKey = ''
  private hierarchyCache = new Map<string, SVGGElement>()

  private root = document.createElementNS(NAMESPACE, 'g')
  private defs = document.createElementNS(NAMESPACE, 'defs')

  constructor(readonly options: Options) {
    this.root.classList.add('chart-multiline-root')
    this.root.appendChild(this.defs)

    this.setRenderBounds(options.renderBounds)
    this.setRenderBoundsPadding(options.renderBoundsPadding ?? { horizontal: 0, vertical: 0 })
  }

  apply(delegate: ChartDelegate): void {
    this.chartDelegate?.removeChild(this.root)
    this.chartDelegate = delegate
    delegate.addChild(this.root)
    this.root.parentElement?.classList.add('chart-multiline-container')
    for (const renderer of this.allRenderers) renderer.didMount?.()
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

  dataDidChange() {
    this.chartDelegate?.scheduleRender()
  }

  setRenderBounds(bounds: { minX?: number, maxX?: number, minY?: number, maxY?: number } | undefined) {
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
  }

  setRenderBoundsPadding(padding: Required<Options>['renderBoundsPadding']) {
    if ('horizontal' in padding || 'vertical' in padding) {
      const horizontal = padding.horizontal ?? 0
      const vertical = padding.vertical ?? 0
      this.renderBoundsPadding = { top: vertical, right: horizontal, bottom: vertical, left: horizontal }
    } else {
      const o = padding as { top?: number, right?: number, bottom?: number, left?: number }
      this.renderBoundsPadding = {
        top: o.top ?? 0,
        right: o.right ?? 0,
        bottom: o.bottom ?? 0,
        left: o.left ?? 0,
      }
    }
    this.dataDidChange()
  }

  render() {
    this.recalculateDataBounds()
    this.mainSpace.bounds = this.calculateRenderBounds()

    this.updateChartSize()
    this.layout()

    let overflow = { top: 0, right: 0, bottom: 0, left: 0 }
    switch (this.options.layoutVariant ?? 'horizontal') {
      case 'horizontal':
        overflow = {
          top: 0, bottom: 0,
          right: this.width - this.mainSpace.layout.x - this.mainSpace.layout.width,
          left: this.mainSpace.layout.x
        }
        break
      case 'vertical':
        overflow = {
          right: 0, left: 0,
          top: this.mainSpace.layout.y,
          bottom: this.height - this.mainSpace.layout.y - this.mainSpace.layout.height
        }
        break
    }

    const full = { width: this.width, height: this.height }
    for (const plot of this.defsRenderers) plot.render?.(this.mainSpace, overflow, full)
    for (const slot of this.topRenderers) slot.render?.(this.mainSpace, overflow, full)
    for (const slot of this.rightRenderers) slot.render?.(this.mainSpace, overflow, full)
    for (const slot of this.bottomRenderers) slot.render?.(this.mainSpace, overflow, full)
    for (const slot of this.leftRenderers) slot.render?.(this.mainSpace, overflow, full)
    for (const plot of this.plotRenderers) plot.render?.(this.mainSpace, overflow, full)
  }

  getSlotRect(slot: 'top' | 'right' | 'bottom' | 'left') {
    const l = this.mainSpace.layout
    const w = this.width
    const h = this.height
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

  private updateChartSize() {
    const width = this.chartDelegate?.width() ?? 0
    const height = this.chartDelegate?.height() ?? 0
    this.width = width
    this.height = height
  }

  private layout() {

    const key = `${this.width}x${this.height}-${this.plotBounds.getHash()}-${this.userDefinedBounds ? `${this.userDefinedBounds.minX ?? 'n'}-${this.userDefinedBounds.maxX ?? 'n'}-${this.userDefinedBounds.minY ?? 'n'}-${this.userDefinedBounds.maxY ?? 'n'}` : 'd'}`
    if (key === this.layoutCacheKey) return
    this.layoutCacheKey = key

    let xTop = 0, xBottom = 0, yLeft = 0, yRight = 0
    let layout = new ChartSpace({ x: 0, y: 0, width: this.width, height: this.height }, this.mainSpace.bounds)
    let overflow = { top: 0, right: 0, bottom: 0, left: 0 }
    const full = { width: this.width, height: this.height }

    for (const slot of this.topRenderers) xTop = Math.max(xTop, slot.getSize(layout, overflow, full).height ?? 0)
    layout.layout.y = xTop

    for (const slot of this.bottomRenderers) xBottom = Math.max(xBottom, slot.getSize(layout, overflow, full).height ?? 0)
    layout.layout.height = this.height - xBottom - xTop

    for (const slot of this.leftRenderers) yLeft = Math.max(yLeft, slot.getSize(layout, overflow, full).width ?? 0)
    layout.layout.x = yLeft

    for (const slot of this.rightRenderers) yRight = Math.max(yRight, slot.getSize(layout, overflow, full).width ?? 0)
    layout.layout.width = this.width - yLeft - yRight

    this.mainSpace.layout = layout.layout
    for (const renderer of this.allRenderers) renderer.didLayout?.(this.mainSpace, { width: this.width, height: this.height })
  }

  private calculateRenderBounds() {
    const ud = this.userDefinedBounds
    if (ud && ud.minX !== null && ud.maxX !== null && ud.minY !== null && ud.maxY !== null) {
      return Bounds.fromMinMax(ud.minX, ud.maxX, ud.minY, ud.maxY)
    }

    const bounds = this.plotBounds.clone()

    return Bounds.fromMinMax(
      ud?.minX ?? (bounds.minX - this.renderBoundsPadding.left),
      ud?.maxX ?? (bounds.maxX + this.renderBoundsPadding.right),
      ud?.minY ?? (bounds.minY - this.renderBoundsPadding.bottom),
      ud?.maxY ?? (bounds.maxY + this.renderBoundsPadding.top),
    )
  }

  private recalculateDataBounds() {
    const bounds = new Bounds()
    for (const line of this.plotRenderers) {
      if (line.getBounds) bounds.extend(line.getBounds())
    }
    this.plotBounds = bounds
  }

}