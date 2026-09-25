import { ChartSpace } from '../../utils/ChartSpace'
import { Classes, joinClasses } from '../../utils/utils'
import { Axis, BaseLabels, DEFAULT_LABEL_OFFSET, DEFAULT_LEVEL_GAP, LabelsFrame, LabelTickLevel, LabelsSide, SlotSize } from '../BaseLabels'
import { calculateClassic, calculateInterval, cleanupOutside, extend, fit, intervalFit } from './utils'
import { resolveValueSource, type ValueGenerator, type ValueSource } from './generators/valueSource'
import { calculatePriorities } from './priorityLabels'

export type { ValueGenerator, ValueSource } from './generators/valueSource'

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

export type LabelContext = {
  candidateIndex: number
}

export type TickSource =
  | 'labels'
  | ValueSource
  | {
    source: ValueSource | 'labels'
    minPixelSpacing?: number
    from?: number
    to?: number
    classes?: Classes
  }

export type LabelOptions = {
  labelForValue?: (value: number, context: LabelContext) => string
  keyForValue?: (value: number, label: string, context: LabelContext) => string
  classesForValue?: (value: number, context: LabelContext) => Classes
  from?: number
  to?: number
  classes?: Classes
  padding?: number | { clip: number, flow: number }
  onlyFitted?: boolean
  ticks?: TickSource | TickSource[]
}

type SimpleLabelSource = ValueSource | (LabelOptions & { source: ValueSource })
type PriorityLabelSource = LabelOptions & { priorities: readonly SimpleLabelSource[], maxLabelSize: number }

export type LabelLevel =
  | (SimpleLabelSource & { strategy?: Strategy })
  | (PriorityLabelSource & { strategy?: 'classic' | 'classic-flow' })
export type LabelCandidate = LabelLevel | readonly LabelLevel[]

export const LABEL_OUTSIDE_SPACE_CLASS = 'label-outside-space'
export const VALUE_OUTSIDE_BOUNDS_LABEL_CLASS = 'value-outside-bounds'

export type Options = LabelOptions & {
  strategy?: Strategy
  values: readonly LabelCandidate[]
  labelOffset?: number
  levelGap?: number
  slotSize?: SlotSize
}

const DEFAULT_LABEL_PADDING = 15
const DEFAULT_STRATEGY: Strategy = 'classic-flow'
const CLASSIC_TICKS_START = 4
const MAX_VALUES_PER_LEVEL = 1000

const LABELS_LEVEL_CLASS = 'label-ticks'

function isLabelLevels(candidate: LabelCandidate): candidate is readonly LabelLevel[] {
  return Array.isArray(candidate)
}

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
  generator: ValueGenerator,
  from: number,
  to: number,
  minSpacing: number,
  toLayout: (value: number) => number,
}) {
  const { generator, from, to, minSpacing, toLayout } = ctx
  if (!(from <= to)) return []

  const values: number[] = []
  let previousLayout = 0

  for (const value of generator(from).forward) {
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
    AutoLabels.validateOptions(axis, options)
    super(axis, {
      offset: options.labelOffset,
      levelGap: options.levelGap,
      slotSize: options.slotSize,
      classes: options.classes,
      maxLevelCount: AutoLabels.getMaxLevelCount(options),
    }, side)
  }

  private resolveLevelsForStep(step: number) {
    const current = this.options.values[step]
    if (!current) return null

    const options = this.options
    const levels = isLabelLevels(current) ? current : [current]

    return levels.map((level, index) => {
      const overrides = typeof level === 'object' && ('source' in level || 'priorities' in level) ? level : { source: level }
      return {
        ...overrides,
        labelForValue: overrides.labelForValue ?? options.labelForValue,
        keyForValue: overrides.keyForValue ?? options.keyForValue,
        classesForValue: overrides.classesForValue ?? options.classesForValue,
        padding: overrides.padding ?? options.padding,
        strategy: level.strategy ?? options.strategy,
        from: overrides.from ?? options.from,
        to: overrides.to ?? options.to,
        onlyFitted: overrides.onlyFitted ?? options.onlyFitted,
        ticks: overrides.ticks ?? (index === 0 ? options.ticks : undefined),
        classes: overrides.classes ?? options.classes,
      }
    })
  }

  private static getMaxLevelCount(options: Options) {
    return options.values.reduce((max, candidate) =>
      Math.max(max, isLabelLevels(candidate) ? candidate.length : 1), 1)
  }

  private static validateOptions(axis: Axis, options: Options) {
    const hasEmptyCandidate = options.values.some(candidate => isLabelLevels(candidate) && candidate.length === 0)
    if (hasEmptyCandidate) throw new Error('Label candidate must contain at least one level')

    for (const candidate of options.values) {
      for (const level of isLabelLevels(candidate) ? candidate : [candidate]) {
        if (typeof level !== 'object' || !('priorities' in level)) continue
        if (level.priorities.length === 0) throw new Error('Priority labels must contain at least one priority')
        if (!Number.isFinite(level.maxLabelSize) || level.maxLabelSize <= 0) throw new Error('Priority labels require a positive finite maxLabelSize')
        const strategy = level.strategy ?? options.strategy ?? DEFAULT_STRATEGY
        if (strategy !== 'classic' && strategy !== 'classic-flow') throw new Error('Priority labels support only classic and classic-flow placement')
        for (const priority of level.priorities) {
          if ('strategy' in priority) throw new Error('Set strategy on the label level, not on a priority source')
        }
      }
    }

    if (axis === 'horizontal') return
    const hasMultipleLevels = options.values.some(candidate => isLabelLevels(candidate) && candidate.length > 1)
    if (hasMultipleLevels) throw new Error('Multi-level labels are supported only for the horizontal axis')
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
    AutoLabels.validateOptions(this.axis, options)
    this.options = options
    super.updateOptions(this.getSlotOptions(options))
    this.requestLayout()
  }

  calculateLabelsFrame(space: ChartSpace, overflow: { start: number, end: number }): LabelsFrame {
    const empty: LabelsFrame = { levels: [], tickLevels: [] }
    if (space.bounds.isEmpty()) return empty

    const options = this.options

    const defaultLabelForValue: NonNullable<LabelOptions['labelForValue']> = value => value.toString()
    const defaultKeyForValue: NonNullable<LabelOptions['keyForValue']> = (_, label) => label

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
      const currentLevels = this.resolveLevelsForStep(i)
      if (!currentLevels) break

      const force = i == options.values.length - 1
      const labelContext: LabelContext = { candidateIndex: i }
      const calculateLevel = (current: typeof currentLevels[number]) => {
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
          const label = labelForValue(v, labelContext)
          const size = getSize(label)
          const key = keyForValue(v, label, labelContext)
          return { p, label, size, key, half: size / 2 }
        }

        const onlyFitted = current.onlyFitted ?? false
        const prepareResult = <T extends { middle: number, size: number, label: string, key: string, value: number, classes?: Classes, onlyFitted?: boolean }>(
          fitted: T[],
          majorValues?: number[],
        ) => {
          const fittedWithinLimits = cleanupOutside(fitted, overflowLimits)
          const fittedItems = new Set(fittedWithinLimits)
          const isValueOutsideBounds = (item: T) => {
            if (typeof strategy !== 'object') {
              return item.value < spaceBounds.start || item.value > spaceBounds.end
            }

            if (strategy.type === 'cell') {
              const cellStart = Math.min(item.value, item.value + strategy.size)
              const cellEnd = Math.max(item.value, item.value + strategy.size)
              return cellEnd <= spaceBounds.start || cellStart >= spaceBounds.end
            }

            if (!('start' in item) || !('end' in item) || typeof item.start !== 'number' || typeof item.end !== 'number') return false
            return item.end <= layoutLimits.start || item.start >= layoutLimits.end
          }
          const visibleItems = fitted.filter(item => !(item.onlyFitted ?? onlyFitted) || fittedItems.has(item))
          const labels = visibleItems.map(item => {
            const classes = joinClasses(
              item.classes ?? current.classesForValue?.(item.value, labelContext),
              !fittedItems.has(item) && LABEL_OUTSIDE_SPACE_CLASS,
              isValueOutsideBounds(item) && VALUE_OUTSIDE_BOUNDS_LABEL_CLASS,
            )
            return { ...convert(item), classes: classes || undefined }
          })
          return {
            level: { labels, classes: current.classes },
            strategy,
            tickGroups: [{
              ticks: current.ticks,
              labelValues: majorValues ?? fitted.map(item => item.value),
              limits: { start: from, end: to },
            }],
          }
        }

        if ('priorities' in current) {
          const priorities = current.priorities.map(priority => {
            const source = typeof priority === 'object' && 'source' in priority ? priority : { source: priority }
            const format = source.labelForValue ?? labelForValue
            const key = source.keyForValue ?? current.keyForValue ?? ((value: number) => value.toString())
            const classes = source.classesForValue ?? current.classesForValue
            return {
              generator: resolveValueSource(source.source, Infinity),
              limits: { start: source.from ?? from, end: source.to ?? to },
              padding: {
                clip: getClipPadding(source.padding) ?? clipPadding,
                flow: getFlowPadding(source.padding) ?? flowPadding,
              },
              ticks: source.ticks ?? current.ticks,
              compute: (value: number) => {
                const label = format(value, labelContext)
                return {
                  p: translate(value), label, key: key(value, label, labelContext), size: getSize(label),
                  classes: joinClasses(source.classes, classes?.(value, labelContext)),
                  onlyFitted: source.onlyFitted ?? onlyFitted,
                }
              },
            }
          })
          const res = calculatePriorities({
            priorities,
            maxLabelSize: current.maxLabelSize,
            bounds: spaceBounds, layoutLimits, overflowLimits,
          })
          const fitted = strategy === 'classic-flow'
            ? fit(extend(res, (a, b) => Math.max(a.padding.flow, b.padding.flow)), layoutLimits, overflowLimits)
            : res
          return {
            ...prepareResult(fitted),
            tickGroups: priorities.map((priority, priorityIndex) => ({
              ticks: priority.ticks,
              labelValues: fitted.filter(item => item.priorityIndex === priorityIndex).map(item => item.value),
              limits: priority.limits,
            })),
          }
        }

        const ctx = {
          padding: clipPadding, compute,
          generator: resolveValueSource(current.source),
          force, bounds: spaceBounds, limits: { start: from, end: to }, layoutLimits, overflowLimits,
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

      const calculated = everyWithResult(currentLevels, level => calculateLevel(level))
      if (!calculated) continue

      const tickLevels = calculated.flatMap((level, levelIndex) => level.tickGroups.flatMap(group =>
        this.buildTickLevels(group.ticks, {
          labelValues: [...group.labelValues].sort((a, b) => a - b),
          labelsStart: this.getSuggestedStart(level.strategy, levelIndex),
          bounds: spaceBounds,
          limits: group.limits,
          toLayout,
        })
      ))

      return {
        levels: calculated.map(level => level.level),
        tickLevels,
      }
    }

    return empty
  }

  private buildTickLevels(
    ticks: TickSource | TickSource[] | undefined,
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
      const level = typeof source === 'object' && 'source' in source ? source : { source }

      const from = Math.max(ctx.bounds.start, level.from ?? ctx.limits.start)
      const to = Math.min(ctx.bounds.end, level.to ?? ctx.limits.end)
      const minSpacing = level.minPixelSpacing ?? 0

      const values = level.source === 'labels'
        ? clipLevelValues(ctx.labelValues, from, to, minSpacing, ctx.toLayout)
        : collectLevelValues({ generator: resolveValueSource(level.source), from, to, minSpacing, toLayout: ctx.toLayout })

      levels.push({
        values,
        classes: level.source === 'labels' ? joinClasses(LABELS_LEVEL_CLASS, level.classes) : level.classes,
        suggestedStart: level.source === 'labels' ? ctx.labelsStart : 0,
      })
    }

    return levels
  }
}

function everyWithResult<T, R>(array: T[], predicate: (value: T, index: number, array: T[]) => R | null): R[] | null {
  const result: R[] = []
  for (let i = 0; i < array.length; i++) {
    const res = predicate(array[i], i, array)
    if (res === null) return null
    result.push(res)
  }
  return result
}
