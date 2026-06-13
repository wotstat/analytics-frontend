import { Axis } from '../labels/BaseLabels'
import { Overflow, Size } from '../UniversalChart'
import { ChartSpace } from '../utils/ChartSpace'
import { BaseTicks, TickData } from './BaseTicks'


export abstract class BaseOffsetTicks extends BaseTicks {
  protected sizes: { start: number | null, end: number | null }

  constructor(axis: Axis, sizes?: { start?: number, end?: number }) {
    super(axis)

    this.sizes = {
      start: sizes?.start ?? null,
      end: sizes?.end ?? null,
    }
  }

  override setupElement(element: SVGLineElement, tick: TickData, space: ChartSpace, overflow: Overflow, full: Size) {
    if (space.bounds.isEmpty()) return

    if (this.axis === 'horizontal') {
      const zero = space.layout.y + space.layout.height
      const startOffset = this.sizes.start ?? 0
      this.setXY(element,
        tick.p,
        Math.max(0, Math.min(startOffset >= 0 ? zero + startOffset : full.height + startOffset, full.height)),
        tick.p,
        this.sizes.end == null ? space.layout.y : Math.max(this.sizes.end >= 0 ? zero - this.sizes.end : space.layout.y - this.sizes.end, space.layout.y)
      )
    } else {
      const zero = space.layout.x
      const right = space.layout.x + space.layout.width
      const startOffset = this.sizes.start ?? 0
      this.setXY(element,
        Math.max(0, Math.min(startOffset >= 0 ? zero - startOffset : 0 - startOffset, full.width)),
        tick.p,
        this.sizes.end == null ? right : Math.min(this.sizes.end >= 0 ? zero + this.sizes.end : right + this.sizes.end, right),
        tick.p
      )
    }
  }
}