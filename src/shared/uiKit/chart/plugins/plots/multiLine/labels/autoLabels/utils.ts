import { ChartSpace } from '../../utils/ChartSpace'
import { ValueGenerator } from './AutoLabels'

type Extendable = { middle: number, size: number }
export function extend<T extends Extendable>(intervals: T[], padding: number) {

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
export function fit<T extends Fittable>(intervals: T[],
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
export function intervalFit<T extends AlignFittable>(intervals: T[],
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

export function calculateClassic(ctx: {
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

  return result
}

export function calculateInterval(ctx: {
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