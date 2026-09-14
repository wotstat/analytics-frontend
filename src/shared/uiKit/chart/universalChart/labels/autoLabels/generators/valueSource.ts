export type ValueGenerator = (startFrom: number) => {
  forward: Generator<number>
  backward: Generator<number>
}

export type SteppedValueSource = {
  step: number
  offset?: number
  values?: never
}

export type ArrayValueSource = {
  values: readonly number[]
  step?: never
  offset?: never
}

export type ValueSource = ValueGenerator | SteppedValueSource | ArrayValueSource

export function resolveValueSource(source: ValueSource): ValueGenerator {
  if (typeof source === 'function') return source

  if ('values' in source && source.values !== undefined) {
    const values = source.values
    return (startFrom: number) => ({
      forward: (function* () {
        for (const value of values) {
          if (value < startFrom) continue
          yield value
        }
      })(),
      backward: (function* () {
        for (let index = values.length - 1; index >= 0; index--) {
          if (values[index] > startFrom) continue
          yield values[index]
        }
      })(),
    })
  }

  return (startFrom: number) => {
    const generate = function* (step: number, offset: number) {
      let current = Math.ceil((startFrom - offset) / step) * step + offset
      for (let index = 0; index < 1e3; index++) {
        yield current
        current += step
      }
    }

    const { step, offset = 0 } = source
    return {
      forward: generate(step, offset),
      backward: generate(-step, offset),
    }
  }
}
