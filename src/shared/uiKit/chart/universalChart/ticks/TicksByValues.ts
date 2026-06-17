import { Axis } from '../labels/BaseLabels'
import { Classes } from '../utils/utils'
import { BaseOffsetTicks } from './BaseOffsetTicks'

export class TicksByValues extends BaseOffsetTicks {

  private ticks: number[] = []

  constructor(axis: Axis, options?: { start?: number, end?: number, classes?: Classes }) {
    super(axis, options)
  }

  getTicksValues(): number[] {
    return this.ticks
  }

  setTicks(ticks: number[]) {
    this.ticks = ticks
  }

}