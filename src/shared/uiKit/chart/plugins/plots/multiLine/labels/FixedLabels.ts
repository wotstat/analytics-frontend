import { ChartSpace } from '../utils/ChartSpace'
import { BaseLabels } from './BaseLabels'
import { MultiLineChart } from '../MultiLine'


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


type Strategy = 'classic-flow' | 'classic' | {
  type: 'interval',
  placement: 'start' | 'end' | 'middle',
  fit: boolean
  offset?: [start: number, end: number] | number
}
type ValueGenerator = (startFrom: number) => { forward: Generator<number, void, unknown>, backward: Generator<number, void, unknown> }
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

  const result: (T & { start: number, end: number })[] = []

  let lastEnd = -Infinity
  for (let i = 0; i < intervals.length; i++) {
    const nextStart = i < intervals.length - 1 ? intervals[i + 1].middle - intervals[i + 1].size / 2 : Infinity
    const interval = intervals[i]

    const start = Math.max(lastEnd + padding, interval.middle - interval.size)
    const end = Math.min(nextStart - padding, interval.middle + interval.size)
    result.push({ ...interval, start, end })
    lastEnd = interval.middle + interval.size / 2
  }

  return result
}

type Fittable = { middle: number, size: number, start: number, end: number }
function fit<T extends Fittable>(intervals: T[],
  limits: { min: number, max: number },
  overflow: { start: number, end: number }) {
  const result: T[] = []

  const min = limits.min
  const max = limits.max
  const oMin = min - overflow.start
  const oMax = max + overflow.end

  for (const current of intervals) {
    if (current.end < oMin || current.start > oMax) continue

    if (current.start >= oMin && current.end <= oMax && current.middle > min && current.middle < max) {
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
        current.end - half,
      )
      result.push({ ...current, middle })
    } else if (right > oMax || mid > max) {
      const middle = Math.max(
        oMax - half,
        mid + overflow.end - half,
        current.start + half
      )
      result.push({ ...current, middle })
    }

  }

  return result
}

type AlignFittable = { size: number, start: number, end: number }
function intervalFit<T extends AlignFittable>(intervals: T[],
  limits: { min: number, max: number },
  overflow: { start: number, end: number },
  strategy: 'start' | 'end' | 'middle', fit: boolean, offset: [start: number, end: number]) {
  const result: (T & { middle: number })[] = []

  const min = limits.min
  const max = limits.max
  const oMin = min - overflow.start
  const oMax = max + overflow.end

  for (const current of intervals) {
    if (current.end < oMin || current.start > oMax) continue

    const half = current.size / 2

    const start = current.start
    const end = current.end

    let middle = 0


    if (!fit) {
      if (strategy === 'start') middle = start + offset[0] + half
      else if (strategy === 'end') middle = end - offset[1] - half
      else middle = (start + end) / 2

    } else {
      if (strategy === 'middle') middle = (Math.max(start, min) + Math.min(end, max)) / 2
      else if (strategy === 'start') middle = Math.max(min, start) + offset[0] + half
      else if (strategy === 'end') middle = Math.min(max, end) - offset[1] - half

      middle = Math.max(middle, start + half + offset[0])
      middle = Math.min(middle, end - half - offset[1])
    }
    result.push({ ...current, middle })
  }

  return result
}

function calculateClassic(ctx: {
  space: ChartSpace,
  overflow: { start: number, end: number },
  from: number,
  to: number,
  padding: number,
  compute: (v: number) => { x: number, label: string, size: number, half: number, key: string },
  generator: ValueGenerator,
  force: boolean,
}) {

  const { space, overflow, from, to, padding, compute, generator, force } = ctx
  const left = space.layout.x - overflow.start
  const right = space.layout.x + space.layout.width + overflow.end

  const result: { middle: number, label: string, key: string, value: number, size: number, half: number }[] = []

  let lastMaxX = -Infinity
  const gen = generator(from == -Infinity ? space.bounds.minX : from).forward
  for (const v of gen) {
    if (v > to) break

    const { x, label, size, half, key } = compute(v)
    if (x + size < left) continue
    if (x - half < lastMaxX + padding) {
      if (force) continue
      return null
    }

    const isLastValue = lastMaxX > right
    lastMaxX = x + half

    result.push({ middle: x, label, key, value: v, size, half })

    if (isLastValue) break
  }

  if (from == -Infinity) {
    let lastMinX = result.length > 0 ? (result[0].middle - result[0].half) : Infinity
    const reverseGen = generator(space.bounds.minX - 1).backward
    for (const v of reverseGen) {

      const { x, label, size, half, key } = compute(v)

      if (x + half > lastMinX - padding) {
        if (force) continue
        return null
      }

      const isLastValue = lastMinX < left
      lastMinX = x - half

      result.unshift({ middle: x, label, key, value: v, size, half })

      if (isLastValue) break
    }
  }


  // for (const element of extended) {
  //   const size = element.max - element.min
  //   this.renderDebugBox(element.min + size / 2, size)
  // }

  // for (const element of fitted) {
  //   this.renderDebugBox(element.middle, element.size)
  // }

  return result
}

function calculateInterval(ctx: {
  space: ChartSpace,
  overflow: { start: number, end: number },
  from: number,
  to: number,
  padding: number,
  tx: (v: number) => number,
  compute: (v: number) => { x: number, label: string, size: number, half: number, key: string },
  generator: ValueGenerator,
  force: boolean,
  placement: 'start' | 'end' | 'middle'
}) {
  const { space, overflow, padding, tx, compute, generator, force, placement } = ctx
  const left = space.layout.x - overflow.start
  const right = space.layout.x + space.layout.width + overflow.end

  const from = (() => {
    if (ctx.from != -Infinity) return ctx.from
    for (const value of generator(space.bounds.minX).backward) if (tx(value) < left) return value
    return space.bounds.minX
  })()

  const to = (() => {
    if (ctx.to != Infinity) return ctx.to
    for (const value of generator(space.bounds.maxX).forward) if (tx(value) > right) return value
    return space.bounds.maxX
  })()


  const gen = generator(to).backward
  let lastEnd = tx(to) - padding / 2
  const result: { label: string, key: string, value: number, size: number, start: number, end: number }[] = []

  gen.next() // skip the first value which is out of bounds
  for (const value of gen) {

    const { x, label, size, half, key } = compute(value)

    const start = x
    const end = lastEnd

    const width = end - start - padding
    if (width < size) {
      if (force) continue
      return null
    }

    result.push({ label, key, value, size, start, end })
    lastEnd = x

    if (value <= from) break
  }

  return result
}

const DEFAULT_LABEL_PADDING = 15
const DEFAULT_STRATEGY: Strategy = 'classic-flow'
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
    const options = this.options

    const defaultLabelForValue = (v: number, step: number) => v.toString()
    const defaultKeyForValue = (v: number, label: string, step: number) => label

    const convert = (v: { middle: number, label: string, key: string, value: number }) => ({ x: v.middle, label: v.label, key: v.key, value: v.value })

    let padding = 0
    let strategy = options.strategy ?? DEFAULT_STRATEGY

    for (let i = 0; i < options.values.length; i++) {
      const current = this.getOverridesForStep(i)
      if (!current) break

      const labelForValue = current.labelForValue ?? options.labelForValue ?? defaultLabelForValue
      const keyForValue = current.keyForValue ?? options.keyForValue ?? defaultKeyForValue
      const from = current.from ?? options.from ?? -Infinity
      const to = current.to ?? options.to ?? Infinity
      padding = current.padding ?? options.padding ?? DEFAULT_LABEL_PADDING
      strategy = current.strategy ?? options.strategy ?? DEFAULT_STRATEGY

      const compute = (v: number) => {
        const x = space.translateX(v)
        const label = labelForValue(v, i)
        const size = this.getTextWidth(label)
        const key = keyForValue(v, label, i)
        return { x, label, size, key, half: size / 2 }
      }

      const ctx = {
        space, overflow, from, to, padding, compute, generator: current.gen, force: i == options.values.length - 1
      }

      if (strategy == 'classic-flow' || strategy == 'classic') {
        const res = calculateClassic(ctx)

        if (!res) continue

        return (strategy == 'classic-flow' ?
          fit(extend(res, padding), { min: space.layout.x, max: space.layout.x + space.layout.width }, overflow) :
          res
        ).map(convert)
      } else if (strategy.type == 'interval') {

        const res = calculateInterval({
          ...ctx,
          tx: space.translateX.bind(space),
          placement: strategy.placement,
        })

        if (!res) continue

        const offset: [number, number] = strategy.offset ? typeof strategy.offset === 'number' ? [strategy.offset, strategy.offset] : strategy.offset : [padding, padding]
        return intervalFit(res,
          { min: space.layout.x, max: space.layout.x + space.layout.width },
          overflow, strategy.placement, strategy.fit, offset).map(convert)
      }
    }

    return []
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
