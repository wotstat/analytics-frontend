import { ChartSpace } from '../../utils/ChartSpace'
import { BaseLabels } from '../BaseLabels'
import { MultiLineChart } from '../../MultiLine'
import { calculateClassic, calculateInterval, extend, fit, intervalFit } from './utils'

export type Strategy = 'classic-flow' | 'classic' | {
  type: 'interval',
  placement: 'start' | 'end' | 'middle',
  fit: boolean
  offset?: [start: number, end: number] | number
}

export type ValueGenerator = (startFrom: number) => {
  forward: Generator<number>,
  backward: Generator<number>
}

export type Overrides = {
  gen: ValueGenerator
} & Omit<Options, 'values'>

type Options = {
  values: (Overrides | ValueGenerator)[]
  labelForValue?: (v: number, step: number) => string
  keyForValue?: (v: number, label: string, step: number) => string
  padding?: number
  strategy?: Strategy
  from?: number
  to?: number
}

const DEFAULT_LABEL_PADDING = 15
const DEFAULT_STRATEGY: Strategy = 'classic-flow'

export class AutoLabels extends BaseLabels {

  constructor(private options: Options) {
    super()
  }

  private getOverridesForStep(step: number): Overrides | null {
    const current = this.options.values[step]
    if (typeof current === 'function') return {
      gen: current,
      labelForValue: this.options.labelForValue,
      keyForValue: this.options.keyForValue,
      padding: this.options.padding,
      strategy: this.options.strategy,
      from: this.options.from,
      to: this.options.to,
    }
    return current
  }

  calculateLabelPositions(space: ChartSpace, overflow: { start: number, end: number }) {
    const options = this.options

    const defaultLabelForValue = (v: number, step: number) => v.toString()
    const defaultKeyForValue = (v: number, label: string, step: number) => label

    const convert = (v: { middle: number, label: string, key: string, value: number }) => ({ x: v.middle, label: v.label, key: v.key, value: v.value })

    let padding = 0
    let strategy = options.strategy ?? DEFAULT_STRATEGY

    for (let i = 0; i < options.values.length; i++) {
      const current = this.getOverridesForStep(i)
      if (!current) break

      const labelForValue = current.labelForValue ?? options.labelForValue ?? defaultLabelForValue
      const keyForValue = current.keyForValue ?? options.keyForValue ?? defaultKeyForValue
      const from = current.from ?? options.from ?? -Infinity
      const to = current.to ?? options.to ?? Infinity
      padding = current.padding ?? options.padding ?? DEFAULT_LABEL_PADDING
      strategy = current.strategy ?? options.strategy ?? DEFAULT_STRATEGY

      const compute = (v: number) => {
        const x = space.translateX(v)
        const label = labelForValue(v, i)
        const size = this.getTextWidth(label)
        const key = keyForValue(v, label, i)
        return { x, label, size, key, half: size / 2 }
      }

      const ctx = {
        space, overflow, from, to, padding, compute, generator: current.gen, force: i == options.values.length - 1
      }

      if (strategy == 'classic-flow') {
        const res = calculateClassic(ctx)
        if (!res) continue
        return fit(extend(res, padding), { min: space.layout.x, max: space.layout.x + space.layout.width }, overflow).map(convert)
      }
      else if (strategy == 'classic') {
        const res = calculateClassic(ctx)
        if (!res) continue
        return res.map(convert)
      }
      else if (strategy.type == 'interval') {
        const res = calculateInterval({
          ...ctx,
          tx: space.translateX.bind(space),
          placement: strategy.placement,
        })

        if (!res) continue

        const offset: [number, number] = strategy.offset ? typeof strategy.offset === 'number' ? [strategy.offset, strategy.offset] : strategy.offset : [padding, padding]
        return intervalFit(
          res,
          { min: space.layout.x, max: space.layout.x + space.layout.width },
          overflow, strategy.placement, strategy.fit, offset
        ).map(convert)
      }
    }

    return []
  }
}

