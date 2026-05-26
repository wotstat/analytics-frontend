import { MultiLineChart, Overflow, PlotRenderer, Size } from '../MultiLine'
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

  getRootElement(): Element {
    return this.root
  }

  protected requestRender() {
    this.isDirty = true
    this.multiLine?.dataDidChange()
  }

  render(space: ChartSpace, overflow: Overflow, full: Size): void {
    const spaceHash = space.getHash()
    if (!this.isDirty && this.spaceCache == spaceHash) return
    this.isDirty = false
    this.spaceCache = spaceHash

    this.renderImpl(space, overflow, full)
  }

  protected renderImpl(space: ChartSpace, overflow: Overflow, full: Size): void { }
}