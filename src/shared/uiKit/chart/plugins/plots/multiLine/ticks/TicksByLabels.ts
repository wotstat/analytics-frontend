import { BaseLabels } from '../labels/BaseLabels'
import { ChartSpace } from '../utils/ChartSpace'
import { BaseTicks, TickData } from './BaseTicks'


export class TicksByLabels extends BaseTicks {

  private offset = 0

  constructor(private labels: BaseLabels) {
    super(labels.axis)
  }

  getTicks(space: ChartSpace): TickData[] {
    this.offset = this.labels.getTicksOffset()
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

  override setupElement(space: ChartSpace, element: SVGLineElement, tick: TickData) {
    if (this.labels.axis === 'horizontal') {
      this.setXY(element, tick.p, space.layout.y + space.layout.height + this.offset, tick.p, space.layout.y)
    } else {
      this.setXY(element, space.layout.x - this.offset, tick.p, space.layout.x + space.layout.width, tick.p)
    }
  }
}