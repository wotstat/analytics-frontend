import { ValueGenerator } from '../AutoLabels'

export function arrayGenerator(values: number[]): ValueGenerator {
  return (startFrom: number) => ({
    forward: (function* () {
      for (const v of values) {
        if (v < startFrom) continue
        yield v
      }
    })(),
    backward: (function* () {
      for (let i = values.length - 1; i >= 0; i--) {
        if (values[i] > startFrom) continue
        yield values[i]
      }
    })()
  })
}
