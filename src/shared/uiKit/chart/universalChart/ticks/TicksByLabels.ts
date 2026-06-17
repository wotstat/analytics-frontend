import { BaseLabels } from '../labels/BaseLabels'
import { ChartSpace } from '../utils/ChartSpace'
import { Classes } from '../utils/utils'
import { BaseOffsetTicks } from './BaseOffsetTicks'
import { TickData } from './BaseTicks'


export class TicksByLabels extends BaseOffsetTicks {

  constructor(private labels: BaseLabels, options?: { start?: number, end?: number, classes?: Classes }) {
    super(labels.axis, options)
  }

  getTicks(space: ChartSpace): TickData[] {
    this.sizes.start = this.labels.getTicksOffset()
    return super.getTicks(space)
  }

  getTicksValues(): number[] {
    return this.labels.getRequiredTicks()
  }
}