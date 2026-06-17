import { Prettify } from '@/shared/utils/types/Prettify'
import { Overrides, Strategy, ValueGenerator } from '../AutoLabels'


export function steppedGenerator(options: {
  step: number
  offset?: number
}): ValueGenerator {

  return (startFrom: number) => {
    const gen = function* (step: number, offset: number) {
      let current = Math.ceil((startFrom - offset) / step) * step + offset
      for (let i = 0; i < 1e3; i++) {
        yield current
        current += step
      }
    }

    const { step, offset = 0 } = options
    return {
      forward: gen(step, offset),
      backward: gen(-step, offset),
    }
  }
}

type OverridesStep = {
  step: number | number[]
  offset?: number,
  labelForValue?: (v: number) => string,
  keyForValue?: (v: number, label: string) => string,
  padding?: number,
  strategy?: Strategy,
}

type SimpleOverridesStep = Prettify<{ step: number } & Omit<OverridesStep, 'step'>>
export function steppedOverrides(options: {
  step: number | number[] | OverridesStep[],
  offset?: number,
  labelForValue?: (v: number, step: number) => string,
  keyForValue?: (v: number, label: string, step: number) => string,
  padding?: number,
  strategy?: Strategy,
}): Overrides[] {

  const isOverridesSteps = (x: any[]): x is OverridesStep[] => x.length > 0 && typeof x[0] === 'object' && 'step' in x[0]

  const steps: SimpleOverridesStep[] = (() => {
    const s = options.step
    if (Array.isArray(s)) {
      if (s.length == 0) return []
      if (isOverridesSteps(s)) return s.flatMap(x =>
        Array.isArray(x.step) ?
          x.step.map(t => ({ ...x, step: t })) :
          x as SimpleOverridesStep
      )
      return s.map(t => ({ step: t }))
    }
    return [{ step: s }]
  })()

  const lastStep = steps[steps.length - 1]


  return [
    ...steps.map(step => ({
      gen: steppedGenerator({ step: step.step, offset: step.offset ?? options.offset }),
      labelForValue: step.labelForValue ?? options.labelForValue,
      keyForValue: step.keyForValue ?? options.keyForValue,
      padding: step.padding ?? options.padding,
      strategy: step.strategy ?? options.strategy,
    })),
    ...new Array(10).fill(0).map((_, i) => ({
      gen: steppedGenerator({ step: lastStep.step * Math.pow(2, i), offset: options.offset }),
      labelForValue: options.labelForValue,
      keyForValue: options.keyForValue,
      padding: options.padding,
      strategy: options.strategy,
    }))
  ]
}
