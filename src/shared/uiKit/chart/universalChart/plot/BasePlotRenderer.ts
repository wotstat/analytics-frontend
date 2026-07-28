import { UniversalChart, Overflow, PlotRenderer, Size } from '../UniversalChart'
import { ChartClip } from '../defs/ChartClip'
import { ChartMask } from '../defs/ChartMask'
import { Bounds, BoundsConstraint } from '../utils/Bounds'
import { ChartSpace } from '../utils/ChartSpace'
import { addClasses, Classes } from '../utils/utils'

export class BasePlotRenderer implements PlotRenderer {
  protected root = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  protected chart: UniversalChart | null = null

  readonly affectsBounds: boolean

  private isDirty = true
  private spaceCache = ''

  constructor(classes: Classes = [], options: { affectsBounds?: boolean } = {}) {
    addClasses(this.root, classes)
    this.affectsBounds = options.affectsBounds ?? false
  }

  attach(root: SVGGElement, chart: UniversalChart): void {
    this.chart = chart
  }

  detach(): void {
    this.chart = null
  }

  getRootElement(): Element {
    return this.root
  }

  getBounds(constraint?: BoundsConstraint): Bounds {
    if (!this.affectsBounds) return new Bounds()
    return this.calculateBounds(constraint)
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
    this.chart?.dataDidChange()
  }

  didLayout(space: ChartSpace, full: Size): void { }

  beforeLayout(space: ChartSpace, full: Size): void {
    this.beforeLayoutImpl(space, full)
  }

  afterLayout(space: ChartSpace, overflow: Overflow, full: Size): void {
    this.afterLayoutImpl(space, overflow, full)
  }

  render(space: ChartSpace, overflow: Overflow, full: Size): void {
    const spaceHash = space.getHash()
    if (!this.isDirty && this.spaceCache == spaceHash) return
    this.isDirty = false
    this.spaceCache = spaceHash

    this.renderImpl(space, overflow, full)
  }

  protected beforeLayoutImpl(space: ChartSpace, full: Size): void { }
  protected afterLayoutImpl(space: ChartSpace, overflow: Overflow, full: Size): void { }
  protected renderImpl(space: ChartSpace, overflow: Overflow, full: Size): void { }
  protected calculateBounds(constraint?: BoundsConstraint): Bounds { return new Bounds() }
}
