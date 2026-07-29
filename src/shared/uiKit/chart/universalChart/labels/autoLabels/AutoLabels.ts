import { ChartSpace } from '../../utils/ChartSpace'
import { Classes, joinClasses } from '../../utils/utils'
import { Axis, BaseLabels, LabelData, LabelsFrame, LabelTickLevel } from '../BaseLabels'
import { calculateClassic, calculateInterval, cleanupOutside, extend, fit, intervalFit } from './utils'

export type Strategy = 'classic-flow' | 'classic' | {
  type: 'interval',
  placement?: 'start' | 'end' | 'middle',
  fit?: boolean
  offset?: [start: number, end: number] | number
  direction?: 'forward' | 'backward'
} | {
  type: 'cell',
  size: number,
  placement?: 'start' | 'end' | 'middle',
  flow?: boolean
}

export type ValueGenerator = (startFrom: number) => {
  forward: Generator<number>,
  backward: Generator<number>
}

export type TickSource =
  | 'labels'
  | ValueGenerator
  | {
    gen: ValueGenerator | 'labels'
    minPixelSpacing?: number
    from?: number
    to?: number
    classes?: Classes
  }

export type TicksOption = TickSource | TickSource[]


type StepOptions = {
  labelForValue?: (value: number, step: number) => string
  keyForValue?: (value: number, label: string, step: number) => string
  padding?: number | { clip: number, flow: number }
  strategy?: Strategy
  from?: number
  to?: number
  onlyFitted?: boolean
  ticks?: TicksOption
}

export type LabelStepOverrides = StepOptions & {
  gen: ValueGenerator
}

export type Options = StepOptions & {
  values: readonly (ValueGenerator | LabelStepOverrides)[]
  labelOffset?: number
  stableWidth?: boolean | number
}

const DEFAULT_LABEL_PADDING = 15
const DEFAULT_STRATEGY: Strategy = 'classic-flow'
const CLASSIC_TICKS_START = 4
const MAX_VALUES_PER_LEVEL = 500

const LABELS_LEVEL_CLASS = 'label-ticks'

function getClipPadding(padding: Options['padding']) {
  if (typeof padding === 'number') return padding
  return padding?.clip
}

function getFlowPadding(padding: Options['padding']) {
  if (typeof padding === 'number') return padding
  return padding?.flow
}

function getValueOffset(strategy: Strategy) {
  if (typeof strategy !== 'object' || strategy.type !== 'cell') return 0

  const placement = strategy.placement ?? 'middle'
  if (placement === 'start') return 0
  if (placement === 'end') return strategy.size
  return strategy.size / 2
}

function getSuggestedStart(strategy: Strategy) {
  if (typeof strategy === 'object' && strategy.type === 'interval') return Infinity
  return CLASSIC_TICKS_START
}

function clipLevelValues(values: readonly number[], from: number, to: number, minSpacing: number, toLayout: (value: number) => number) {
  const result = values.filter(value => value >= from && value <= to)
  if (minSpacing <= 0 || result.length < 2) return result

  for (let i = 1; i < result.length; i++) {
    if (Math.abs(toLayout(result[i]) - toLayout(result[i - 1])) < minSpacing) return []
  }

  return result
}

function collectLevelValues(ctx: {
  gen: ValueGenerator,
  from: number,
  to: number,
  minSpacing: number,
  toLayout: (value: number) => number,
}) {
  const { gen, from, to, minSpacing, toLayout } = ctx
  if (!(from <= to)) return []

  const values: number[] = []
  let previousLayout = 0

  for (const value of gen(from).forward) {
    if (value < from) continue
    if (value > to) break

    const layout = toLayout(value)
    if (minSpacing > 0 && values.length > 0 && Math.abs(layout - previousLayout) < minSpacing) return []
    previousLayout = layout

    values.push(value)
    if (values.length >= MAX_VALUES_PER_LEVEL) break
  }

  return values
}

export class AutoLabels extends BaseLabels {

  constructor(axis: Axis, private options: Options) {
    super(axis, { offset: options.labelOffset, stableWidth: options.stableWidth })
  }

  private resolveOverridesForStep(step: number): LabelStepOverrides | null {
    const current = this.options.values[step]
    if (!current) return null

    const options = this.options
    const candidate = typeof current === 'function' ? { gen: current } : current

    return {
      gen: candidate.gen,
      labelForValue: candidate.labelForValue ?? options.labelForValue,
      keyForValue: candidate.keyForValue ?? options.keyForValue,
      padding: candidate.padding ?? options.padding,
      strategy: candidate.strategy ?? options.strategy,
      from: candidate.from ?? options.from,
      to: candidate.to ?? options.to,
      onlyFitted: candidate.onlyFitted ?? options.onlyFitted,
      ticks: candidate.ticks ?? options.ticks,
    }
  }

  updateOptions(options: Options) {
    this.options = options
    super.updateOptions({ offset: options.labelOffset, stableWidth: options.stableWidth })
    this.requestRender()
  }

  calculateLabelsFrame(space: ChartSpace, overflow: { start: number, end: number }): LabelsFrame {
    const empty: LabelsFrame = { labels: [], tickLevels: [] }
    if (space.bounds.isEmpty()) return empty

    const options = this.options

    const defaultLabelForValue = (v: number, step: number) => v.toString()
    const defaultKeyForValue = (v: number, label: string, step: number) => label

    const translate = this.axis === 'horizontal' ? space.chartToLocalX.bind(space) : space.chartToLocalY.bind(space)
    const inverseTranslate = this.axis === 'horizontal' ? space.localToLayoutX.bind(space) : space.localToLayoutY.bind(space)
    const toLayout = this.axis === 'horizontal' ? space.chartToLayoutX.bind(space) : space.chartToLayoutY.bind(space)
    const convert = (v: { middle: number, label: string, key: string, value: number }) => ({ p: inverseTranslate(v.middle), label: v.label, key: v.key, value: v.value })

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
      const current = this.resolveOverridesForStep(i)
      if (!current) break

      const labelForValue = current.labelForValue ?? defaultLabelForValue
      const keyForValue = current.keyForValue ?? defaultKeyForValue
      const from = current.from ?? -Infinity
      const to = current.to ?? Infinity
      const clipPadding = getClipPadding(current.padding) ?? getClipPadding(options.padding) ?? DEFAULT_LABEL_PADDING
      const flowPadding = getFlowPadding(current.padding) ?? getFlowPadding(options.padding) ?? DEFAULT_LABEL_PADDING
      const strategy = current.strategy ?? DEFAULT_STRATEGY

      const valueOffset = getValueOffset(strategy)

      const compute = (v: number) => {
        const p = translate(v + valueOffset)
        const label = labelForValue(v, i)
        const size = getSize(label)
        const key = keyForValue(v, label, i)
        return { p, label, size, key, half: size / 2 }
      }

      const onlyFitted = current.onlyFitted ?? false
      const ctx = {
        padding: clipPadding, compute, generator: current.gen, force: i == options.values.length - 1,
        bounds: spaceBounds,
        limits: { start: from, end: to },
        layoutLimits,
        overflowLimits
      }

      const frame = (labels: LabelData[], labelValues: number[]): LabelsFrame => ({
        labels,
        tickLevels: this.buildTickLevels(current.ticks, {
          labelValues: [...labelValues].sort((a, b) => a - b),
          labelsStart: getSuggestedStart(strategy),
          bounds: spaceBounds,
          limits: { start: from, end: to },
          toLayout,
        }),
      })

      const prepareResult = <T extends { middle: number, size: number, label: string, key: string, value: number }>(fitted: T[], majorValues?: number[]) => {
        const converted = fitted.map(convert)
        const values = majorValues ?? converted.map(f => f.value)
        if (!onlyFitted) return frame(converted, values)
        return frame(cleanupOutside(fitted, overflowLimits).map(convert), values)
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
      else if (strategy.type == 'cell') {
        const res = calculateClassic(ctx)
        if (!res) continue
        if (!strategy.flow) return prepareResult(res)
        return prepareResult(fit(extend(res, flowPadding), layoutLimits, overflowLimits))
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

        return prepareResult(fitted, res.map(t => t.value))
      }
    }

    return empty
  }

  private buildTickLevels(
    ticks: TicksOption | undefined,
    ctx: {
      labelValues: readonly number[],
      labelsStart: number,
      bounds: { start: number, end: number },
      limits: { start: number, end: number },
      toLayout: (value: number) => number,
    }): LabelTickLevel[] {

    const sources: TickSource[] = ticks === undefined ? ['labels'] : (Array.isArray(ticks) ? ticks as TickSource[] : [ticks as TickSource])
    if (sources.length === 0) return []

    const used = new Set<number>()
    const levels: LabelTickLevel[] = []

    for (const source of sources) {
      const level = typeof source === 'function' || source === 'labels' ? { gen: source } : source

      const from = Math.max(ctx.bounds.start, level.from ?? ctx.limits.start)
      const to = Math.min(ctx.bounds.end, level.to ?? ctx.limits.end)
      const minSpacing = level.minPixelSpacing ?? 0

      const values = level.gen === 'labels'
        ? clipLevelValues(ctx.labelValues, from, to, minSpacing, ctx.toLayout)
        : collectLevelValues({ gen: level.gen, from, to, minSpacing, toLayout: ctx.toLayout })

      const result = values.filter(value => !used.has(value))
      for (const value of result) used.add(value)

      levels.push({
        values: result,
        classes: level.gen === 'labels' ? joinClasses(LABELS_LEVEL_CLASS, level.classes) : level.classes,
        suggestedStart: level.gen === 'labels' ? ctx.labelsStart : 0,
      })
    }

    return levels
  }
}
