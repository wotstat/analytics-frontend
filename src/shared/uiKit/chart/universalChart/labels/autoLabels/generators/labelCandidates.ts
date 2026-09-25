import type { LabelLevel, LabelContext, LabelOptions, Strategy } from '../AutoLabels'

type CandidateOptions = Omit<LabelOptions, 'labelForValue' | 'keyForValue'> & { strategy?: Strategy }

type StepOverride = CandidateOptions & {
  step: number | readonly number[]
  offset?: number
  labelForValue?: LabelOptions['labelForValue']
  keyForValue?: LabelOptions['keyForValue']
}

type NormalizedStep = Omit<StepOverride, 'step'> & { step: number }

export type SteppedLabelCandidatesOptions = CandidateOptions & {
  step: number | readonly number[] | readonly StepOverride[]
  offset?: number
  values?: never
  labelForValue?: LabelOptions['labelForValue']
  keyForValue?: LabelOptions['keyForValue']
}

export type ArrayLabelContext = LabelContext & {
  valueIndex: number
}

type ArrayCandidateOverride = CandidateOptions & {
  values: readonly number[]
  labelForValue?: (value: number, context: ArrayLabelContext) => string
  keyForValue?: (value: number, label: string, context: ArrayLabelContext) => string
}

export type ArrayLabelCandidatesOptions = CandidateOptions & {
  values:
  | readonly number[]
  | readonly (readonly number[])[]
  | readonly ArrayCandidateOverride[]
  step?: never
  offset?: never
  labelForValue?: (value: number, context: ArrayLabelContext) => string
  keyForValue?: (value: number, label: string, context: ArrayLabelContext) => string
}

export type LabelCandidatesOptions = SteppedLabelCandidatesOptions | ArrayLabelCandidatesOptions

const FALLBACK_STEPS = 10

function isStepOverrides(steps: readonly number[] | readonly StepOverride[]): steps is readonly StepOverride[] {
  return steps.length > 0 && typeof steps[0] === 'object' && steps[0] !== null && 'step' in steps[0]
}

function isArrayOptions(options: LabelCandidatesOptions): options is ArrayLabelCandidatesOptions {
  return 'values' in options && options.values !== undefined
}

function normalizeSteps(options: SteppedLabelCandidatesOptions): NormalizedStep[] {
  const source = options.step
  if (typeof source === 'number') return [{ step: source }]
  if (source.length === 0) return []

  if (isStepOverrides(source)) {
    return source.flatMap(item =>
      typeof item.step === 'number'
        ? item as NormalizedStep
        : item.step.map(step => ({ ...item, step }))
    )
  }

  return source.map(step => ({ step }))
}

function isFlatValues(
  values: ArrayLabelCandidatesOptions['values'],
): values is readonly number[] {
  return values.length === 0 || typeof values[0] === 'number'
}

function isNestedValues(
  values: ArrayLabelCandidatesOptions['values'],
): values is readonly (readonly number[])[] {
  return values.length > 0 && Array.isArray(values[0])
}

function normalizeArrayCandidates(options: ArrayLabelCandidatesOptions): ArrayCandidateOverride[] {
  const values = options.values
  if (isFlatValues(values)) return [{ values }]
  if (isNestedValues(values)) return values.map(candidateValues => ({ values: candidateValues }))
  return [...values]
}

function steppedCandidates(options: SteppedLabelCandidatesOptions) {
  const { step: _, offset, labelForValue, keyForValue, ...candidateOptions } = options
  const steps = normalizeSteps(options)
  if (steps.length === 0) return []

  const explicit = steps.map(item => ({
    ...candidateOptions,
    source: { step: item.step, offset: item.offset ?? offset },
    labelForValue: item.labelForValue ?? labelForValue,
    keyForValue: item.keyForValue ?? keyForValue,
    padding: item.padding ?? candidateOptions.padding,
    strategy: item.strategy ?? candidateOptions.strategy,
    from: item.from ?? candidateOptions.from,
    to: item.to ?? candidateOptions.to,
    onlyFitted: item.onlyFitted ?? candidateOptions.onlyFitted,
    ticks: item.ticks ?? candidateOptions.ticks,
    classes: item.classes ?? candidateOptions.classes,
  } satisfies LabelLevel))

  const lastStep = steps[steps.length - 1]
  const lastCandidate = explicit[explicit.length - 1]

  return [
    ...explicit,
    ...new Array(FALLBACK_STEPS).fill(0).map((_, index) => ({
      ...lastCandidate,
      source: {
        step: lastStep.step * Math.pow(2, index + 1),
        offset: lastStep.offset ?? offset,
      },
    })),
  ]
}

function arrayCandidates(options: ArrayLabelCandidatesOptions) {
  const { values: _, labelForValue, keyForValue, ...candidateOptions } = options

  return normalizeArrayCandidates(options).map(item => {
    const sourceValues = [...item.values]
    const indexByValue = new Map<number, number>()
    const currentLabelForValue = item.labelForValue ?? labelForValue
    const currentKeyForValue = item.keyForValue ?? keyForValue

    sourceValues.forEach((value, index) => {
      if (!indexByValue.has(value)) indexByValue.set(value, index)
    })

    const contextFor = (value: number, context: LabelContext): ArrayLabelContext => ({
      ...context,
      valueIndex: indexByValue.get(value) ?? -1,
    })

    return {
      ...candidateOptions,
      source: { values: sourceValues },
      labelForValue: currentLabelForValue
        ? (value, context) => currentLabelForValue(value, contextFor(value, context))
        : undefined,
      keyForValue: currentKeyForValue
        ? (value, label, context) => currentKeyForValue(value, label, contextFor(value, context))
        : value => value.toString(),
      padding: item.padding ?? candidateOptions.padding,
      strategy: item.strategy ?? candidateOptions.strategy,
      from: item.from ?? candidateOptions.from,
      to: item.to ?? candidateOptions.to,
      onlyFitted: item.onlyFitted ?? candidateOptions.onlyFitted,
      ticks: item.ticks ?? candidateOptions.ticks,
      classes: item.classes ?? candidateOptions.classes,
    } satisfies LabelLevel
  })
}

export function labelCandidates(options: SteppedLabelCandidatesOptions): ReturnType<typeof steppedCandidates>
export function labelCandidates(options: ArrayLabelCandidatesOptions): ReturnType<typeof arrayCandidates>
export function labelCandidates(options: LabelCandidatesOptions) {
  return isArrayOptions(options) ? arrayCandidates(options) : steppedCandidates(options)
}
