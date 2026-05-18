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

export function steppedOverrides(options: {
  step: number | number[]
  offset?: number,
  labelForValue?: (v: number, step: number) => string,
  keyForValue?: (v: number, label: string, step: number) => string,
  padding?: number,
  strategy?: Strategy,
}): Overrides[] {

  const steps = Array.isArray(options.step) ? options.step : [options.step]
  const lastStep = steps[steps.length - 1]

  return [
    ...steps.map(step => steppedGenerator({ step, offset: options.offset })),
    ...new Array(10).fill(0).map((_, i) => steppedGenerator({ step: lastStep * Math.pow(2, i), offset: options.offset }))
  ].map(gen => ({
    gen,
    labelForValue: options.labelForValue,
    keyForValue: options.keyForValue,
    padding: options.padding,
    strategy: options.strategy,
  }))
}
