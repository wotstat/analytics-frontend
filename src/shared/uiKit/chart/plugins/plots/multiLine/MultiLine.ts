import './style.scss'


import { ChartDelegate, ChartPlugin } from '../../../Chart'
import { Font } from './labels/shared'
import { XAxisOptions, XLables } from './labels/XLables'
import { Bounds } from './utils/Bounds'
import { ChartSpace } from './utils/ChartSpace'
import { Line } from './plot/line/Line'


type Options = {
  renderBounds?: { minX?: number, maxX?: number, minY?: number, maxY?: number }
  axis?: Font & {
    xAxis?: XAxisOptions
  }
}

const NAMESPACE = 'http://www.w3.org/2000/svg'
export class MultiLineChart implements ChartPlugin {
  private chartDelegate: ChartDelegate | null = null

  private userDefinedBounds: { minX: number | null, maxX: number | null, minY: number | null, maxY: number | null } | null = null

  private width = 0
  private height = 0
  private mainSpace = new ChartSpace({ x: 0, y: 0, width: 0, height: 0 }, new Bounds())

  private xLabels: XLables
  private lines = new Set<Line>()
  private linesBounds = new Bounds()

  private root = document.createElementNS(NAMESPACE, 'g')
  private defs = document.createElementNS(NAMESPACE, 'defs')
  private clipPathRoot = document.createElementNS(NAMESPACE, 'clipPath')
  private plotClipRect = document.createElementNS(NAMESPACE, 'rect')
  private plotRoot = document.createElementNS(NAMESPACE, 'g')
  private xLabelsRoot = document.createElementNS(NAMESPACE, 'g')

  constructor(readonly options: Options) {
    this.root.classList.add('chart-multiline-root')
    this.root.appendChild(this.defs)
    this.defs.appendChild(this.clipPathRoot)
    this.clipPathRoot.appendChild(this.plotClipRect)

    const clipId = `multiline-clip-${Math.random().toString(16).slice(2)}`
    this.clipPathRoot.setAttribute('id', clipId)
    this.plotRoot.setAttribute('clip-path', `url(#${clipId})`)
    this.plotRoot.classList.add('plot')
    this.xLabelsRoot.classList.add('x-labels')

    this.root.appendChild(this.plotRoot)
    this.root.appendChild(this.xLabelsRoot)
    this.setRenderBounds(options.renderBounds)
    this.xLabels = new XLables(this.xLabelsRoot, options.axis?.xAxis ?? {}, options.axis)
  }

  apply(delegate: ChartDelegate): void {
    this.chartDelegate?.removeChild(this.root)
    this.chartDelegate = delegate
    delegate.addChild(this.root)
    this.xLabels.recalculateFont(this.options.axis ?? {})
    this.root.parentElement?.classList.add('chart-multiline-container')
  }

  addLine(line: Line) {
    this.lines.add(line)
    line.attach(this.plotRoot, this)
  }

  removeLine(line: Line) {
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
    this.mainSpace.layout = { x: 10, y: 0, width: this.width - 20, height: this.height - 20 }
    this.updatePlotSpace()
  }

  private renderLines() {
    for (const line of this.lines) {
      line.render(this.mainSpace)
    }
  }

  private renderLabels(overflow: { top: number, right: number, bottom: number, left: number }) {
    this.xLabels.render(this.mainSpace, {
      start: overflow.left,
      end: overflow.right
    })
  }

  private updatePlotSpace() {
    this.plotClipRect.setAttribute('x', this.mainSpace.layout.x.toString())
    this.plotClipRect.setAttribute('y', this.mainSpace.layout.y.toString())
    this.plotClipRect.setAttribute('width', this.mainSpace.layout.width.toString())
    this.plotClipRect.setAttribute('height', this.mainSpace.layout.height.toString())
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