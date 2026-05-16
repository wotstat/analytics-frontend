import { BaseLabels } from '../labels/BaseLabels'
import { ChartSpace } from '../utils/ChartSpace'
import { BaseTicks } from './BaseTicks'


export class TicksByLabels extends BaseTicks {

  constructor(private labels: BaseLabels) {
    super()
  }

  getTicks(space: ChartSpace): { x: number; value: number; }[] {
    const requiredTicks = this.labels.getRequiredTicks()
    return requiredTicks.map(value => {
      const x = space.translateX(value)
      return { x, value }
    })
  }
}