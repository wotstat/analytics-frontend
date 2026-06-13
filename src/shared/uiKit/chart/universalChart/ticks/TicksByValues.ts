import { Axis, BaseLabels } from '../labels/BaseLabels'
import { Overflow, Size } from '../UniversalChart'
import { ChartSpace } from '../utils/ChartSpace'
import { BaseOffsetTicks } from './BaseOffsetTicks'
import { BaseTicks, TickData } from './BaseTicks'


export class TicksByValues extends BaseOffsetTicks {

  private ticks: number[] = []

  constructor(axis: Axis, sizes?: { start?: number, end?: number }) {
    super(axis, sizes)
  }

  getTicksValues(): number[] {
    return this.ticks
  }

  setTicks(ticks: number[]) {
    this.ticks = ticks
  }

}