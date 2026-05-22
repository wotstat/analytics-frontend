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
  layoutLimits: { start: number, end: number },
  overflowLimits: { start: number, end: number }) {
  const result: T[] = []

  const min = layoutLimits.start
  const max = layoutLimits.end
  const oMin = overflowLimits.start
  const oMax = overflowLimits.end

  const overflowStart = layoutLimits.start - overflowLimits.start
  const overflowEnd = overflowLimits.end - layoutLimits.end

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

    if (mid < min && half < overflowStart || mid > max && half < overflowEnd) {
      result.push(current)
      continue
    }

    if (left < oMin || mid < min) {
      const middle = Math.min(
        oMin + half,
        mid - overflowStart + half,
        current.end - half,
      )
      result.push({ ...current, middle })
    } else if (right > oMax || mid > max) {
      const middle = Math.max(
        oMax - half,
        mid + overflowEnd - half,
        current.start + half
      )
      result.push({ ...current, middle })
    }

  }

  return result
}

type AlignFittable = { size: number, start: number, end: number }
export function intervalFit<T extends AlignFittable>(intervals: T[],
  layoutLimits: { start: number, end: number },
  overflowLimits: { start: number, end: number },
  strategy: 'start' | 'end' | 'middle', fit: boolean, offset: [start: number, end: number]) {
  const result: (T & { middle: number })[] = []

  const min = layoutLimits.start
  const max = layoutLimits.end
  const oMin = overflowLimits.start
  const oMax = overflowLimits.end

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
  bounds: { start: number, end: number },
  limits: { start: number, end: number },
  layoutLimits: { start: number, end: number },
  overflowLimits: { start: number, end: number },
  padding: number,
  compute: (v: number) => { p: number, label: string, size: number, half: number, key: string },
  generator: ValueGenerator,
  force: boolean,
}) {

  const { bounds, limits, layoutLimits, overflowLimits, padding, compute, generator, force } = ctx
  const left = overflowLimits.start
  const right = overflowLimits.end
  const from = Math.max(limits.start, bounds.start)

  const result: { middle: number, label: string, key: string, value: number, size: number, half: number }[] = []

  let lastMaxX = -Infinity
  const gen = generator(from).forward
  for (const v of gen) {
    if (v < limits.start) continue
    if (v > limits.end) break

    const { p, label, size, half, key } = compute(v)

    if (p + size < left) continue
    if (p - half < lastMaxX + padding) {
      if (force) continue
      return null
    }

    // delayd cycle end to return null if overlap
    if (lastMaxX > right) break
    lastMaxX = p + half

    result.push({ middle: p, label, key, value: v, size, half })
  }

  if (limits.start < bounds.start) {
    let lastMinX = result.length > 0 ? (result[0].middle - result[0].half) : Infinity

    const reverseGen = generator(from).backward
    for (const v of reverseGen) {
      if (v == from) continue
      const { p, label, size, half, key } = compute(v)

      if (p + half > lastMinX - padding) {
        if (force) continue
        return null
      }

      if (lastMinX < left) break
      lastMinX = p - half

      result.unshift({ middle: p, label, key, value: v, size, half })
    }
  }

  return result
}

type IntervalOptions = {
  bounds: { start: number, end: number },
  limits: { start: number, end: number },
  layoutLimits: { start: number, end: number },
  overflowLimits: { start: number, end: number },
  padding: number,
  translate: (v: number) => number,
  compute: (v: number) => { p: number, label: string, size: number, half: number, key: string },
  generator: ValueGenerator,
  force: boolean,
  placement: 'start' | 'end' | 'middle',
  direction: 'forward' | 'backward',
}

export function calculateInterval(ctx: IntervalOptions) {
  if (ctx.direction === 'forward') return calculateForward(ctx)
  else return calculateBackward(ctx)
}

// TODO: Тут есть баг у левого края как минимум, если широкое значение отстаёт больше чем на один элемент 
function calculateForward(ctx: IntervalOptions) {
  const { bounds, limits, layoutLimits, overflowLimits, padding, translate: tr, compute, generator, force } = ctx
  const left = overflowLimits.start
  const right = overflowLimits.end

  const from = (() => {
    for (const value of generator(bounds.start).backward) if (tr(value) < left) return Math.max(limits.start, value)
    return bounds.start
  })()

  const to = (() => {
    if (limits.end != Infinity) return limits.end
    for (const value of generator(bounds.end).forward) if (tr(value) > right) return Math.min(limits.end, value)
    return bounds.end
  })()


  const gen = generator(to).backward
  let lastEnd = tr(to)
  const result: { label: string, key: string, value: number, size: number, start: number, end: number }[] = []
  result.push({ label: '', key: '', value: to, size: 0, start: lastEnd, end: lastEnd })

  gen.next() // skip the first value which is out of bounds
  for (const value of gen) {

    const { p: start, label, size, half, key } = compute(value)
    const end = lastEnd

    const width = end - start - padding
    if (width < size) {
      if (force) continue
      return null
    }

    result.push({ label, key, value, size, start, end })

    lastEnd = start
    if (value <= from) break
  }

  return result
}

function calculateBackward(ctx: IntervalOptions) {
  const { bounds, limits, layoutLimits, overflowLimits, padding, translate: tr, compute, generator, force } = ctx
  const left = overflowLimits.start
  const right = overflowLimits.end

  const from = (() => {
    for (const value of generator(bounds.start).backward) if (tr(value) < left) return Math.max(limits.start, value)
    return bounds.start
  })()

  const to = (() => {
    for (const value of generator(bounds.end).forward) if (tr(value) > right) return Math.min(limits.end, value)
    return bounds.end
  })()

  const gen = generator(from).forward
  let lastStart = tr(from)
  const result: { label: string, key: string, value: number, size: number, start: number, end: number }[] = []
  result.push({ label: '', key: '', value: from, size: 0, start: lastStart, end: lastStart })

  gen.next() // skip the first value which is out of bounds
  for (const value of gen) {

    const { p: end, label, size, half, key } = compute(value)
    const start = lastStart

    const width = end - start - padding
    if (width < size) {
      if (force) continue
      return null
    }

    result.push({ label, key, value, size, start, end })

    lastStart = end
    if (value >= to) break
  }

  return result
}