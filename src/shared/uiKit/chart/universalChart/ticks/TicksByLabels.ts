import { BaseLabels } from '../labels/BaseLabels'
import { Overflow, Size } from '../UniversalChart'
import { ChartSpace } from '../utils/ChartSpace'
import { BaseTicks, TickData } from './BaseTicks'


export class TicksByLabels extends BaseTicks {

  private startOffset = 0
  private sizes: { start: number | null, end: number | null }

  constructor(private labels: BaseLabels, sizes?: { start?: number, end?: number }) {
    super(labels.axis)
    this.sizes = {
      start: sizes?.start ?? null,
      end: sizes?.end ?? null,
    }
  }

  getTicks(space: ChartSpace): TickData[] {
    this.startOffset = this.labels.getTicksOffset()
    const requiredTicks = this.labels.getRequiredTicks()

    if (this.labels.axis === 'horizontal') {
      return requiredTicks
        .map(value => ({ p: space.chartToLayoutX(value), value }))
        .filter(tick => tick.p >= space.layout.x && tick.p <= space.layout.x + space.layout.width)
    } else {
      return requiredTicks
        .map(value => ({ p: space.chartToLayoutY(value), value }))
        .filter(tick => tick.p >= space.layout.y && tick.p <= space.layout.y + space.layout.height)
    }
  }

  override setupElement(element: SVGLineElement, tick: TickData, space: ChartSpace, overflow: Overflow, full: Size) {
    if (this.labels.axis === 'horizontal') {
      const zero = space.layout.y + space.layout.height
      const startOffset = this.sizes.start == null ? this.startOffset : this.sizes.start
      this.setXY(element,
        tick.p,
        Math.min(startOffset >= 0 ? zero + startOffset : full.height + startOffset, full.height),
        tick.p,
        this.sizes.end == null ? space.layout.y : Math.max(this.sizes.end >= 0 ? zero - this.sizes.end : space.layout.y - this.sizes.end, space.layout.y)
      )
    } else {
      const zero = space.layout.x
      const right = space.layout.x + space.layout.width
      const startOffset = this.sizes.start == null ? this.startOffset : this.sizes.start
      this.setXY(element,
        Math.min(startOffset >= 0 ? zero - startOffset : 0 - startOffset, full.width),
        tick.p,
        this.sizes.end == null ? right : Math.min(this.sizes.end >= 0 ? zero + this.sizes.end : right + this.sizes.end, right),
        tick.p
      )
    }
  }
}