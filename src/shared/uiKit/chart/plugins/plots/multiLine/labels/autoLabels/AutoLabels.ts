import { ChartSpace } from '../../utils/ChartSpace'
import { Axis, BaseLabels } from '../BaseLabels'
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

  constructor(axis: Axis, private options: Options) {
    super(axis)
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

    const translate = this.axis === 'horizontal' ? space.chartToLocalX.bind(space) : space.chartToLocalY.bind(space)
    const inverseTranslate = this.axis === 'horizontal' ? space.localToLayoutX.bind(space) : space.localToLayoutY.bind(space)
    const convert = (v: { middle: number, label: string, key: string, value: number }) => ({ p: inverseTranslate(v.middle), label: v.label, key: v.key, value: v.value })

    let padding = 0
    let strategy = options.strategy ?? DEFAULT_STRATEGY

    const limits = this.axis === 'horizontal' ?
      { min: 0, max: space.layout.width } :
      { min: 0, max: space.layout.height }

    const getSize = this.axis === 'horizontal' ? this.getTextWidth.bind(this) : this.getTextHeight.bind(this)
    const softLimits = this.axis === 'horizontal' ? { start: space.bounds.minX, end: space.bounds.maxX } : { start: space.bounds.minY, end: space.bounds.maxY }

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
        const p = translate(v)
        const label = labelForValue(v, i)
        const size = getSize(label)
        const key = keyForValue(v, label, i)
        return { p, label, size, key, half: size / 2 }
      }

      const ctx = {
        padding, compute, generator: current.gen, force: i == options.values.length - 1,
        spaceLimits: { start: from, end: to },
        layoutLimits: { start: limits.min, end: limits.max },
        spaceSoftLimits: softLimits
      }

      if (strategy == 'classic-flow') {
        const res = calculateClassic(ctx)
        if (!res) continue
        return fit(extend(res, padding), limits, overflow).map(convert)
      }
      else if (strategy == 'classic') {
        const res = calculateClassic(ctx)
        if (!res) continue
        return res.map(convert)
      }
      else if (strategy.type == 'interval') {
        const res = calculateInterval({
          ...ctx,
          translate: translate,
          placement: strategy.placement,
        })

        if (!res) continue

        const offset: [number, number] = strategy.offset ? typeof strategy.offset === 'number' ? [strategy.offset, strategy.offset] : strategy.offset : [padding, padding]
        return intervalFit(
          res, limits, overflow, strategy.placement, strategy.fit, offset
        ).map(convert)
      }
    }

    return []
  }
}

