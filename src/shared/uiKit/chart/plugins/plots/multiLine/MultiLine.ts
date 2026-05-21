import './style.scss'


import { ChartDelegate, ChartPlugin } from '../../../Chart'
import { Bounds } from './utils/Bounds'
import { ChartSpace } from './utils/ChartSpace'
import { BaseLine } from './plot/line/BaseLine'


type Options = {
  renderBounds?: { minX?: number, maxX?: number, minY?: number, maxY?: number }
}

export interface LabelsRenderer {
  attach(root: SVGGElement, multiLine: MultiLineChart): void
  detach(): void
  render(space: ChartSpace, overflow: { start: number, end: number }): void
  getRequiredTicks(): number[]
  recalculateFont(): void
  getHeight(): number
}

export interface TicksRenderer {
  attach(root: SVGGElement, multiLine: MultiLineChart): void
  detach(): void
  render(space: ChartSpace): void
}

const NAMESPACE = 'http://www.w3.org/2000/svg'
class RectClip {
  private clipPath = document.createElementNS(NAMESPACE, 'clipPath')
  private rect = document.createElementNS(NAMESPACE, 'rect')
  private id = `clip-${Math.random().toString(16).slice(2)}`

  constructor(root: SVGElement) {
    this.clipPath.setAttribute('id', this.id)
    this.clipPath.appendChild(this.rect)
    root.appendChild(this.clipPath)
  }

  dispose() {
    this.clipPath.remove()
  }

  getClipPath() {
    return `url(#${this.id})`
  }

  setRect(x: number, y: number, width: number, height: number) {
    this.rect.setAttribute('x', x.toString())
    this.rect.setAttribute('y', y.toString())
    this.rect.setAttribute('width', width.toString())
    this.rect.setAttribute('height', height.toString())
  }
}

export class MultiLineChart implements ChartPlugin {
  private chartDelegate: ChartDelegate | null = null

  private userDefinedBounds: { minX: number | null, maxX: number | null, minY: number | null, maxY: number | null } | null = null

  private width = 0
  private height = 0
  private mainSpace = new ChartSpace({ x: 0, y: 0, width: 0, height: 0 }, new Bounds())

  private yLabels: LabelsRenderer | null = null
  private xLabels: LabelsRenderer | null = null
  private xTicks: TicksRenderer | null = null
  private yTicks: TicksRenderer | null = null
  private lines = new Set<BaseLine>()
  private linesBounds = new Bounds()

  private root = document.createElementNS(NAMESPACE, 'g')
  private plotRoot = document.createElementNS(NAMESPACE, 'g')

  private defs = document.createElementNS(NAMESPACE, 'defs')
  private plotClip = new RectClip(this.defs)
  private yLabelsClip = new RectClip(this.defs)

  private labelsRoot = document.createElementNS(NAMESPACE, 'g')
  private yLabelsRoot = document.createElementNS(NAMESPACE, 'g')
  private xLabelsRoot = document.createElementNS(NAMESPACE, 'g')

  private ticksRoot = document.createElementNS(NAMESPACE, 'g')
  private xTicksRoot = document.createElementNS(NAMESPACE, 'g')
  private yTicksRoot = document.createElementNS(NAMESPACE, 'g')

  constructor(readonly options: Options) {
    this.root.classList.add('chart-multiline-root')
    this.root.appendChild(this.defs)

    this.plotRoot.setAttribute('clip-path', this.plotClip.getClipPath())
    this.yLabelsRoot.setAttribute('clip-path', this.yLabelsClip.getClipPath())

    this.plotRoot.classList.add('plot')

    this.labelsRoot.classList.add('labels')
    this.yLabelsRoot.classList.add('y-labels')
    this.xLabelsRoot.classList.add('x-labels')

    this.ticksRoot.classList.add('ticks')
    this.xTicksRoot.classList.add('x-ticks')
    this.yTicksRoot.classList.add('y-ticks')

    this.ticksRoot.appendChild(this.xTicksRoot)
    this.ticksRoot.appendChild(this.yTicksRoot)
    this.root.appendChild(this.plotRoot)

    this.root.appendChild(this.labelsRoot)
    this.labelsRoot.appendChild(this.xLabelsRoot)
    this.labelsRoot.appendChild(this.yLabelsRoot)

    this.root.appendChild(this.ticksRoot)
    this.setRenderBounds(options.renderBounds)
  }

  apply(delegate: ChartDelegate): void {
    this.chartDelegate?.removeChild(this.root)
    this.chartDelegate = delegate
    delegate.addChild(this.root)
    this.xLabels?.recalculateFont()
    this.root.parentElement?.classList.add('chart-multiline-container')
  }

  addLine(line: BaseLine) {
    this.lines.add(line)
    line.attach(this.plotRoot, this)
  }

  setXLabels(xLabels: LabelsRenderer | null) {
    if (this.xLabels === xLabels) return
    if (this.xLabels) this.xLabels.detach()

    this.xLabels = xLabels
    if (this.xLabels) {
      this.xLabels.attach(this.xLabelsRoot, this)
      this.xLabels.recalculateFont()
    }
  }

  setYLabels(yLabels: LabelsRenderer | null) {
    if (this.yLabels === yLabels) return
    if (this.yLabels) this.yLabels.detach()

    this.yLabels = yLabels
    if (this.yLabels) {
      this.yLabels.attach(this.yLabelsRoot, this)
      this.yLabels.recalculateFont()
    }
  }

  setXTicks(xTicks: TicksRenderer | null) {
    if (this.xTicks === xTicks) return
    if (this.xTicks) this.xTicks.detach()

    this.xTicks = xTicks
    if (this.xTicks) this.xTicks.attach(this.xTicksRoot, this)
  }

  setYTicks(yTicks: TicksRenderer | null) {
    if (this.yTicks === yTicks) return
    if (this.yTicks) this.yTicks.detach()

    this.yTicks = yTicks
    if (this.yTicks) this.yTicks.attach(this.yTicksRoot, this)
  }

  removeLine(line: BaseLine) {
    this.lines.delete(line)
    line.detach()
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

  render() {
    this.recalculateDataBounds()
    this.layoutIfNeeded()

    this.mainSpace.bounds = this.calculateRenderBounds()

    this.renderLines()
    this.renderLabels({
      top: this.mainSpace.layout.y,
      right: this.width - this.mainSpace.layout.x - this.mainSpace.layout.width,
      bottom: this.height - this.mainSpace.layout.y - this.mainSpace.layout.height,
      left: this.mainSpace.layout.x
    })
    this.renderTicks()
  }

  private layoutIfNeeded() {
    const width = this.chartDelegate?.width() ?? 0
    const height = this.chartDelegate?.height() ?? 0

    if (width !== this.width || height !== this.height) {
      this.width = width
      this.height = height
      this.layout()
    }
  }

  private layout() {
    const xHeight = this.xLabels ? this.xLabels.getHeight() : 0

    this.mainSpace.layout = { x: 40, y: 0, width: this.width - 40, height: this.height - xHeight }
    this.updateClips()
  }

  private renderLines() {
    for (const line of this.lines) {
      line.render(this.mainSpace)
    }
  }

  private renderLabels(overflow: { top: number, right: number, bottom: number, left: number }) {

    this.xLabels?.render(this.mainSpace, {
      start: overflow.left,
      end: overflow.right
    })

    this.yLabels?.render(this.mainSpace, {
      start: overflow.top,
      end: 0
    })
  }

  private renderTicks() {
    this.xTicks?.render(this.mainSpace)
    this.yTicks?.render(this.mainSpace)
  }

  private updateClips() {
    this.plotClip.setRect(this.mainSpace.layout.x, this.mainSpace.layout.y, this.mainSpace.layout.width, this.mainSpace.layout.height)
    this.yLabelsClip.setRect(0, this.mainSpace.layout.y, this.mainSpace.layout.x, this.mainSpace.layout.height)
  }

  private calculateRenderBounds() {
    const ud = this.userDefinedBounds
    if (ud && ud.minX !== null && ud.maxX !== null && ud.minY !== null && ud.maxY !== null) {
      return Bounds.fromMinMax(ud.minX, ud.maxX, ud.minY, ud.maxY)
    }

    const bounds = this.linesBounds.clone()
    if (!ud) return bounds

    return Bounds.fromMinMax(
      ud.minX ?? bounds.minX,
      ud.maxX ?? bounds.maxX,
      ud.minY ?? bounds.minY,
      ud.maxY ?? bounds.maxY,
    )
  }

  private recalculateDataBounds() {
    const bounds = new Bounds()
    for (const line of this.lines) bounds.extend(line.getBounds())
    this.linesBounds = bounds
  }

}