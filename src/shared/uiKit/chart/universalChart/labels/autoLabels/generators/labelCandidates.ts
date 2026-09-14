import type { LabelLevelOptions, LabelContext, LabelOptions } from '../AutoLabels'

type CandidateOptions = Omit<LabelOptions, 'labelForValue' | 'keyForValue'>

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

export type ArrayLabelCandidatesOptions = CandidateOptions & {
  values: readonly number[]
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

function steppedCandidates(options: SteppedLabelCandidatesOptions): LabelLevelOptions[] {
  const { step: _, offset, labelForValue, keyForValue, ...candidateOptions } = options
  const steps = normalizeSteps(options)
  if (steps.length === 0) return []

  const explicit: LabelLevelOptions[] = steps.map(item => ({
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
  }))

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

function arrayCandidates(options: ArrayLabelCandidatesOptions): LabelLevelOptions[] {
  const { values, labelForValue, keyForValue, ...candidateOptions } = options
  const sourceValues = [...values]
  const indexByValue = new Map<number, number>()

  sourceValues.forEach((value, index) => {
    if (!indexByValue.has(value)) indexByValue.set(value, index)
  })

  const contextFor = (value: number, context: LabelContext): ArrayLabelContext => ({
    ...context,
    valueIndex: indexByValue.get(value) ?? -1,
  })

  return [{
    ...candidateOptions,
    source: { values: sourceValues },
    labelForValue: labelForValue
      ? (value, context) => labelForValue(value, contextFor(value, context))
      : undefined,
    keyForValue: keyForValue
      ? (value, label, context) => keyForValue(value, label, contextFor(value, context))
      : value => value.toString(),
  }]
}

export function labelCandidates(options: SteppedLabelCandidatesOptions): LabelLevelOptions[]
export function labelCandidates(options: ArrayLabelCandidatesOptions): LabelLevelOptions[]
export function labelCandidates(options: LabelCandidatesOptions): LabelLevelOptions[] {
  return isArrayOptions(options) ? arrayCandidates(options) : steppedCandidates(options)
}
