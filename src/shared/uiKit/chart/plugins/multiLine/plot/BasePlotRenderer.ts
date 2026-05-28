import { MultiLineChart, Overflow, PlotRenderer, Size } from '../MultiLine'
import { ChartClip } from '../utils/ChartClip'
import { ChartMask } from '../utils/ChartMask'
import { ChartSpace } from '../utils/ChartSpace'
import { addClasses, Classes } from '../utils/utils'


export class BasePlotRenderer implements PlotRenderer {
  protected root = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  protected multiLine: MultiLineChart | null = null

  private isDirty = true
  private spaceCache = ''

  constructor(classes: Classes = []) {
    addClasses(this.root, classes)
  }

  attach(root: SVGGElement, multiLine: MultiLineChart): void {
    this.multiLine = multiLine
  }

  detach(): void {
    this.multiLine = null
  }

  getRootElement(): Element {
    return this.root
  }

  clipBy(clip: ChartClip) {
    clip.clip(this.root)
    return this
  }

  maskBy(mask: ChartMask) {
    mask.mask(this.root)
    return this
  }

  protected requestRender() {
    this.isDirty = true
    this.multiLine?.dataDidChange()
  }

  didLayout(space: ChartSpace, full: Size): void { }

  render(space: ChartSpace, overflow: Overflow, full: Size): void {
    const spaceHash = space.getHash()
    if (!this.isDirty && this.spaceCache == spaceHash) return
    this.isDirty = false
    this.spaceCache = spaceHash

    this.renderImpl(space, overflow, full)
  }

  protected renderImpl(space: ChartSpace, overflow: Overflow, full: Size): void { }
}