import { ChartSpace } from '../../utils/ChartSpace'
import { Classes, joinClasses } from '../../utils/utils'
import {
  Axis,
  BaseLabels,
  DEFAULT_LABEL_OFFSET,
  DEFAULT_LEVEL_GAP,
  LabelLevelData,
  LabelsFrame,
  LabelTickLevel,
  LabelsSide,
  SlotSize,
} from '../BaseLabels'
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
  classes?: Classes
}

export type LabelLevelOptions = StepOptions & {
  gen: ValueGenerator
}

export type LabelStepOverrides = LabelLevelOptions & {
  secondary?: readonly LabelLevelOptions[]
}

export type Options = StepOptions & {
  values: readonly (ValueGenerator | LabelStepOverrides)[]
  labelOffset?: number
  levelGap?: number
  slotSize?: SlotSize
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

  constructor(axis: Axis, private options: Options, side?: LabelsSide) {
    AutoLabels.validateLevels(axis, options)
    super(axis, {
      offset: options.labelOffset,
      levelGap: options.levelGap,
      slotSize: options.slotSize,
      maxLevelCount: AutoLabels.getMaxLevelCount(options),
    }, side)
  }

  private resolveOverridesForStep(step: number): LabelStepOverrides[] | null {
    const current = this.options.values[step]
    if (!current) return null

    const options = this.options
    const candidate: LabelStepOverrides = typeof current === 'function' ? { gen: current } : current

    const resolveLevel = (level: LabelLevelOptions, inheritRootTicks: boolean): LabelStepOverrides => ({
      gen: level.gen,
      labelForValue: level.labelForValue ?? options.labelForValue,
      keyForValue: level.keyForValue ?? options.keyForValue,
      padding: level.padding ?? options.padding,
      strategy: level.strategy ?? options.strategy,
      from: level.from ?? options.from,
      to: level.to ?? options.to,
      onlyFitted: level.onlyFitted ?? options.onlyFitted,
      ticks: level.ticks ?? (inheritRootTicks ? options.ticks : undefined),
      classes: level.classes ?? options.classes,
    })

    return [
      resolveLevel(candidate, true),
      ...(candidate.secondary ?? []).map(level => resolveLevel(level, false)),
    ]
  }

  private static getMaxLevelCount(options: Options) {
    return options.values.reduce((max, candidate) => {
      if (typeof candidate === 'function') return Math.max(max, 1)
      return Math.max(max, 1 + (candidate.secondary?.length ?? 0))
    }, 1)
  }

  private static validateLevels(axis: Axis, options: Options) {
    if (axis === 'horizontal') return

    const hasSecondary = options.values.some(candidate =>
      typeof candidate !== 'function' && (candidate.secondary?.length ?? 0) > 0
    )
    if (hasSecondary) throw new Error('Multi-level labels are supported only for the horizontal axis')
  }

  private getSuggestedStart(strategy: Strategy, level: number) {
    if (typeof strategy === 'object' && strategy.type === 'interval') return this.getLevelOuterOffset(level)
    return CLASSIC_TICKS_START
  }

  private getSlotOptions(options: Options) {
    return {
      offset: options.labelOffset ?? DEFAULT_LABEL_OFFSET,
      levelGap: options.levelGap ?? DEFAULT_LEVEL_GAP,
      slotSize: options.slotSize ?? 'auto' as const,
      maxLevelCount: AutoLabels.getMaxLevelCount(options),
    }
  }

  updateOptions(options: Options) {
    AutoLabels.validateLevels(this.axis, options)
    this.options = options
    super.updateOptions(this.getSlotOptions(options))
    this.requestLayout()
  }

  calculateLabelsFrame(space: ChartSpace, overflow: { start: number, end: number }): LabelsFrame {
    const empty: LabelsFrame = { levels: [], tickLevels: [] }
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
      const currentLevels = this.resolveOverridesForStep(i)
      if (!currentLevels) break

      const force = i == options.values.length - 1
      const calculated: {
        level: LabelLevelData
        labelValues: number[]
        options: LabelStepOverrides
        strategy: Strategy
        limits: { start: number, end: number }
      }[] = []

      const calculateLevel = (current: LabelStepOverrides) => {
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
          padding: clipPadding,
          compute,
          generator: current.gen,
          force,
          bounds: spaceBounds,
          limits: { start: from, end: to },
          layoutLimits,
          overflowLimits,
        }

        const prepareResult = <T extends { middle: number, size: number, label: string, key: string, value: number }>(
          fitted: T[],
          majorValues?: number[],
        ) => {
          const converted = fitted.map(convert)
          const labels = onlyFitted ? cleanupOutside(fitted, overflowLimits).map(convert) : converted
          return {
            level: { labels, classes: current.classes },
            labelValues: majorValues ?? converted.map(item => item.value),
            options: current,
            strategy,
            limits: { start: from, end: to },
          }
        }

        if (strategy == 'classic-flow') {
          const res = calculateClassic(ctx)
          if (!res) return null
          return prepareResult(fit(extend(res, flowPadding), layoutLimits, overflowLimits))
        }
        else if (strategy == 'classic') {
          const res = calculateClassic(ctx)
          if (!res) return null
          return prepareResult(res)
        }
        else if (strategy.type == 'cell') {
          const res = calculateClassic(ctx)
          if (!res) return null
          if (!strategy.flow) return prepareResult(res)
          return prepareResult(fit(extend(res, flowPadding), layoutLimits, overflowLimits))
        }

        const placement = strategy.placement ?? 'start'
        const fitLabels = strategy.fit ?? false

        const res = calculateInterval({
          ...ctx,
          translate,
          placement,
          direction: strategy.direction ?? 'forward',
        })
        if (!res) return null

        const offset = (() => {
          if (!strategy.offset) return [flowPadding, flowPadding] as [number, number]
          if (typeof strategy.offset === 'number') return [strategy.offset, strategy.offset] as [number, number]
          return strategy.offset
        })()

        const fitted = intervalFit(
          res.filter(item => item.key != ''),
          layoutLimits,
          overflowLimits,
          placement,
          fitLabels,
          offset,
        )
        return prepareResult(fitted, res.map(item => item.value))
      }

      let failed = false
      for (const level of currentLevels) {
        const result = calculateLevel(level)
        if (!result) {
          failed = true
          break
        }
        calculated.push(result)
      }
      if (failed) continue

      const tickLevels = calculated.flatMap((level, levelIndex) =>
        this.buildTickLevels(level.options.ticks, {
          labelValues: [...level.labelValues].sort((a, b) => a - b),
          labelsStart: this.getSuggestedStart(level.strategy, levelIndex),
          bounds: spaceBounds,
          limits: level.limits,
          toLayout,
        })
      )

      return {
        levels: calculated.map(level => level.level),
        tickLevels,
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

    const levels: LabelTickLevel[] = []

    for (const source of sources) {
      const level = typeof source === 'function' || source === 'labels' ? { gen: source } : source

      const from = Math.max(ctx.bounds.start, level.from ?? ctx.limits.start)
      const to = Math.min(ctx.bounds.end, level.to ?? ctx.limits.end)
      const minSpacing = level.minPixelSpacing ?? 0

      const values = level.gen === 'labels'
        ? clipLevelValues(ctx.labelValues, from, to, minSpacing, ctx.toLayout)
        : collectLevelValues({ gen: level.gen, from, to, minSpacing, toLayout: ctx.toLayout })

      levels.push({
        values,
        classes: level.gen === 'labels' ? joinClasses(LABELS_LEVEL_CLASS, level.classes) : level.classes,
        suggestedStart: level.gen === 'labels' ? ctx.labelsStart : 0,
      })
    }

    return levels
  }
}
