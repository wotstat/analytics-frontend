import { ChartSpace } from '../../utils/ChartSpace'
import { Axis, BaseLabels } from '../BaseLabels'
import { calculateClassic, calculateInterval, cleanupOutside, extend, fit, intervalFit } from './utils'

export type Strategy = 'classic-flow' | 'classic' | {
  type: 'interval',
  placement?: 'start' | 'end' | 'middle',
  fit?: boolean
  offset?: [start: number, end: number] | number
  direction?: 'forward' | 'backward'
}

export type ValueGenerator = (startFrom: number) => {
  forward: Generator<number>,
  backward: Generator<number>
}

export type Overrides = {
  gen: ValueGenerator
} & Omit<Options, 'values'>

export type Options = {
  values: (Overrides | ValueGenerator)[]
  labelForValue?: (v: number, step: number) => string
  keyForValue?: (v: number, label: string, step: number) => string
  labelOffset?: number
  stableWidth?: boolean | number
  padding?: number | {
    clip: number,
    flow: number
  },
  strategy?: Strategy
  from?: number
  to?: number
  onlyFitted?: boolean
}

const DEFAULT_LABEL_PADDING = 15
const DEFAULT_STRATEGY: Strategy = 'classic-flow'

function getClipPadding(padding: Options['padding']) {
  if (typeof padding === 'number') return padding
  return padding?.clip
}

function getFlowPadding(padding: Options['padding']) {
  if (typeof padding === 'number') return padding
  return padding?.flow
}

export class AutoLabels extends BaseLabels {

  private lastIntervalStart: number | null = null
  private lastRenderedTicksBeforeClip: number[] = []

  constructor(axis: Axis, private options: Options) {
    super(axis, { offset: options.labelOffset, stableWidth: options.stableWidth })
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

  updateOptions(options: Options) {
    this.options = options
    super.updateOptions({ offset: options.labelOffset, stableWidth: options.stableWidth })
  }

  calculateLabelPositions(space: ChartSpace, overflow: { start: number, end: number }) {
    if (space.bounds.isEmpty()) return []

    const options = this.options

    const defaultLabelForValue = (v: number, step: number) => v.toString()
    const defaultKeyForValue = (v: number, label: string, step: number) => label

    const translate = this.axis === 'horizontal' ? space.chartToLocalX.bind(space) : space.chartToLocalY.bind(space)
    const inverseTranslate = this.axis === 'horizontal' ? space.localToLayoutX.bind(space) : space.localToLayoutY.bind(space)
    const convert = (v: { middle: number, label: string, key: string, value: number }) => ({ p: inverseTranslate(v.middle), label: v.label, key: v.key, value: v.value })

    let clipPadding = 0
    let flowPadding = 0
    let strategy = options.strategy ?? DEFAULT_STRATEGY

    const spaceBounds = this.axis === 'horizontal' ?
      { start: space.bounds.minX, end: space.bounds.maxX } :
      { start: space.bounds.minY, end: space.bounds.maxY }

    const layoutLimits = this.axis === 'horizontal' ?
      { start: 0, end: space.layout.width } :
      { start: 0, end: space.layout.height }

    const overflowLimits = this.axis === 'horizontal' ?
      { start: layoutLimits.start - overflow.start, end: layoutLimits.end + overflow.end } :
      { start: layoutLimits.start - overflow.end, end: layoutLimits.end + overflow.start }

    const getSize = this.axis === 'horizontal' ? this.getTextWidth.bind(this) : this.getTextHeight.bind(this)

    for (let i = 0; i < options.values.length; i++) {
      const current = this.getOverridesForStep(i)
      if (!current) break

      const labelForValue = current.labelForValue ?? options.labelForValue ?? defaultLabelForValue
      const keyForValue = current.keyForValue ?? options.keyForValue ?? defaultKeyForValue
      const from = current.from ?? options.from ?? -Infinity
      const to = current.to ?? options.to ?? Infinity
      clipPadding = getClipPadding(current.padding) ?? getClipPadding(options.padding) ?? DEFAULT_LABEL_PADDING
      flowPadding = getFlowPadding(current.padding) ?? getFlowPadding(options.padding) ?? DEFAULT_LABEL_PADDING
      strategy = current.strategy ?? options.strategy ?? DEFAULT_STRATEGY

      const compute = (v: number) => {
        const p = translate(v)
        const label = labelForValue(v, i)
        const size = getSize(label)
        const key = keyForValue(v, label, i)
        return { p, label, size, key, half: size / 2 }
      }

      const onlyFitted = current.onlyFitted ?? options.onlyFitted ?? false
      const ctx = {
        padding: clipPadding, compute, generator: current.gen, force: i == options.values.length - 1,
        bounds: spaceBounds,
        limits: { start: from, end: to },
        layoutLimits,
        overflowLimits
      }

      const prepareResult = <T extends { middle: number, size: number, label: string, key: string, value: number }>(fitted: T[]) => {
        if (!onlyFitted) {
          const res = fitted.map(convert)
          this.lastRenderedTicksBeforeClip = res.map(f => f.value)
          return res
        }

        this.lastRenderedTicksBeforeClip = fitted.map(convert).map(f => f.value)
        return cleanupOutside(fitted, overflowLimits).map(convert)
      }

      if (strategy == 'classic-flow') {
        const res = calculateClassic(ctx)
        if (!res) continue
        const fitted = fit(extend(res, flowPadding), layoutLimits, overflowLimits)
        return prepareResult(fitted)
      }
      else if (strategy == 'classic') {
        const res = calculateClassic(ctx)
        if (!res) continue
        return prepareResult(res)
      }
      else if (strategy.type == 'interval') {
        const placement = strategy.placement ?? 'start'
        const fit = strategy.fit ?? false

        const res = calculateInterval({
          ...ctx,
          translate: translate,
          placement,
          direction: strategy.direction ?? 'forward',
        })
        if (!res) continue

        const offset = (() => {
          if (!strategy.offset) return [flowPadding, flowPadding] as [number, number]
          if (typeof strategy.offset === 'number') return [strategy.offset, strategy.offset] as [number, number]
          return strategy.offset
        })()

        const fitted = intervalFit(res.filter(t => t.key != ''), layoutLimits, overflowLimits, placement, fit, offset)

        this.lastIntervalStart = res[0].value
        return prepareResult(fitted)
      }
    }

    return []
  }

  getRequiredTicks(): number[] {
    const ticks = this.lastRenderedTicksBeforeClip

    if (this.options.strategy === 'classic-flow' || this.options.strategy === 'classic') return ticks

    if (this.options.strategy?.type === 'interval') {
      if (this.lastIntervalStart === null) return ticks

      return [...ticks, this.lastIntervalStart]
    }

    return ticks
  }

  getTicksOffset(): number {
    if (this.options.strategy === 'classic-flow' || this.options.strategy === 'classic') return 4
    if (this.options.strategy?.type === 'interval') return Infinity
    return 0
  }
}

