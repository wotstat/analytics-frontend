import { Prettify } from '@/shared/utils/types/Prettify'
import { ChartSpace } from '../utils/ChartSpace'
import { BaseLabels } from './BaseLabels'
import { EdgeLabels, KeyForValue, LabelForValue, Padding, ZeroLabel } from './shared'
import { MultiLineChart } from '../MultiLine'


export function arrayGenerator(values: number[]) {
  return function* (startFrom: number) {
    for (const v of values) {
      if (v < startFrom) continue
      yield v
    }
  }
}

export function steppedGenerator(options: {
  step: number
  offset?: number
}) {
  return function* (startFrom: number) {
    const { step, offset = 0 } = options
    let current = Math.ceil((startFrom - offset) / step) * step + offset
    for (let i = 0; i < 1e3; i++) {
      yield current
      current += step
    }

    yield 404
  }
}

export function stepped(options: {
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


type Strategy = 'classic-flow'
type ValueGenerator = (startFrom: number) => Generator<number>
type Overrides = {
  gen: ValueGenerator
} & Omit<Options, 'values'>

type Options = {
  values: (Overrides | ValueGenerator)[]
  labelForValue?: (v: number, step: number) => string
  keyForValue?: (v: number, label: string, step: number) => string
  padding?: number
  strategy?: Strategy
  from?: number
  to?: number
}

type Extendable = { middle: number, size: number }
function extend<T extends Extendable>(intervals: T[], padding: number) {

  const result: (T & { min: number, max: number })[] = []

  let lastEnd = -Infinity
  for (let i = 0; i < intervals.length; i++) {
    const nextStart = i < intervals.length - 1 ? intervals[i + 1].middle - intervals[i + 1].size / 2 : Infinity
    const interval = intervals[i]

    const min = Math.max(lastEnd + padding, interval.middle - interval.size)
    const max = Math.min(nextStart - padding, interval.middle + interval.size)
    result.push({ ...interval, min, max })
    lastEnd = interval.middle + interval.size / 2
  }

  return result
}

type Fittable = { middle: number, size: number, min: number, max: number }
function fit<T extends Fittable>(intervals: T[],
  limits: { min: number, max: number },
  overflow: { start: number, end: number }) {
  const result: T[] = []

  const min = limits.min
  const max = limits.max
  const oMin = min - overflow.start
  const oMax = max + overflow.end

  for (const current of intervals) {
    if (current.max < oMin || current.min > oMax) continue

    if (current.min >= oMin && current.max <= oMax && current.middle > min && current.middle < max) {
      result.push(current)
      continue
    }

    const half = current.size / 2
    const mid = current.middle
    const left = mid - half
    const right = mid + half

    if (left >= oMin && right <= oMax && mid >= min && mid <= max) {
      result.push(current)
      continue
    }

    if (mid < min && half < overflow.start || mid > max && half < overflow.end) {
      result.push(current)
      continue
    }

    if (left < oMin || mid < min) {
      const middle = Math.min(
        oMin + half,
        mid - overflow.start + half,
        current.max - half,
      )
      result.push({ ...current, middle })
    } else if (right > oMax || mid > max) {
      const middle = Math.max(
        oMax - half,
        mid + overflow.end - half,
        current.min + half
      )
      result.push({ ...current, middle })
    }

  }

  return result
}

const DEFAULT_LABEL_PADDING = 15
export class FixedLabels extends BaseLabels {

  private debugBoxes: SVGRectElement[] = []

  constructor(private options: Options) {
    super()
  }

  override attach(root: SVGGElement, multiLine: MultiLineChart): void {
    super.attach(root, multiLine)

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

  calculateLabelPositions(space: ChartSpace, overflow: { start: number, end: number }) {

    const tx = space.translateX.bind(space)
    const options = this.options

    const defaultLabelForValue = (v: number, step: number) => v.toString()
    const defaultKeyForValue = (v: number, label: string, step: number) => label

    let result: {
      middle: number,
      label: string,
      key: string,
      value: number,
      size: number,
      half: number,
    }[] = []

    const left = space.layout.x - overflow.start
    const right = space.layout.x + space.layout.width + overflow.end
    let padding = 0

    for (let i = 0; i < options.values.length; i++) {
      result = []

      const current = this.getOverridesForStep(i)
      if (!current) break

      const labelForValue = current.labelForValue ?? options.labelForValue ?? defaultLabelForValue
      const keyForValue = current.keyForValue ?? options.keyForValue ?? defaultKeyForValue
      const from = current.from ?? options.from ?? -Infinity
      const to = current.to ?? options.to ?? Infinity
      padding = current.padding ?? options.padding ?? DEFAULT_LABEL_PADDING


      const startFrom = (() => {
        if (from != -Infinity) return from

        const step = space.bounds.maxX - space.bounds.minX
        for (const p of [0.01, 0.02, 0.05, 0.1, 0.2, 0.3, 0.5, 0.8, 1]) {
          const startFrom = space.bounds.minX - step * p
          const gen = current.gen(startFrom)

          let i = 0
          for (const v of gen) {
            if (v > to) break
            i++

            const x = tx(v)
            if (i == 1 && x > left) break

            const size = this.getTextWidth(labelForValue(v, i))
            const right = x + size / 2
            if (i == 1 && right > left) break
            if (right > left) return startFrom
          }
        }

        return space.bounds.minX
      })()


      const gen = current.gen(startFrom)

      let lastMaxX = -Infinity
      let isDone = true

      for (const v of gen) {
        if (v > to) break

        const x = tx(v)
        const label = labelForValue(v, i)
        const size = this.getTextWidth(label)

        const half = size / 2
        if (x + size < left) continue
        if (x - half < lastMaxX + padding) {
          if (i == options.values.length - 1) continue
          isDone = false
          break
        }

        const isLastValue = lastMaxX > right
        lastMaxX = x + half

        const key = keyForValue(v, label, i)
        result.push({ middle: x, label, key, value: v, size, half })

        if (isLastValue) break
      }

      if (isDone) break
    }

    const extended = extend(result, padding)
    const fitted = fit(extended,
      { min: space.layout.x, max: space.layout.x + space.layout.width },
      overflow)

    // for (const element of extended) {
    //   const size = element.max - element.min
    //   this.renderDebugBox(element.min + size / 2, size)
    // }

    // for (const element of fitted) {
    //   this.renderDebugBox(element.middle, element.size)
    // }

    return fitted.map(f => ({
      x: f.middle,
      label: f.label,
      key: f.key,
      value: f.value,
    }))
  }


  override render(space: ChartSpace, overflow: { start: number; end: number }): void {

    for (const box of this.debugBoxes) box.remove()
    this.debugBoxes = []

    super.render(space, overflow)
  }

  private renderDebugBox(x: number, width: number) {
    const box = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    box.setAttribute('x', (x - width / 2).toString())
    box.setAttribute('y', '190')
    box.setAttribute('width', width.toString())
    box.setAttribute('height', this.getHeight().toString())
    box.setAttribute('fill', 'rgba(255, 0, 0, 0.3)')
    this.root?.appendChild(box)
    this.debugBoxes.push(box)
  }
}
