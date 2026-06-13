import { BaseLabels } from '../labels/BaseLabels'
import { ChartSpace } from '../utils/ChartSpace'
import { BaseOffsetTicks } from './BaseOffsetTicks'
import { TickData } from './BaseTicks'


export class TicksByLabels extends BaseOffsetTicks {

  constructor(private labels: BaseLabels, sizes?: { start?: number, end?: number }) {
    super(labels.axis, sizes)
  }

  getTicks(space: ChartSpace): TickData[] {
    this.sizes.start = this.labels.getTicksOffset()
    return super.getTicks(space)
  }

  getTicksValues(): number[] {
    return this.labels.getRequiredTicks()
  }
}