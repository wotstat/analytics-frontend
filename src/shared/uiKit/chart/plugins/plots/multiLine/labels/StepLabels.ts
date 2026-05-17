import { Prettify } from '@/shared/utils/types/Prettify'
import { ChartSpace } from '../utils/ChartSpace'
import { BaseLabels } from './BaseLabels'
import { EdgeLabels, KeyForValue, LabelForValue, Padding, ZeroLabel } from './shared'

class Interval {
  constructor(public start: number, public end: number) { }

  contains(value: number) {
    return value >= this.start && value <= this.end
  }

  overlaps(other: Interval) {
    return this.start <= other.end && this.end >= other.start
  }

  merge(other: Interval) {
    return new Interval(Math.min(this.start, other.start), Math.max(this.end, other.end))
  }
}

class Intervals {
  private intervals: Interval[] = []

  addInterval(interval: Interval) {
    this.intervals.push(interval)
    // const newIntervals: Interval[] = []
    // let mergedInterval = interval

    // for (const current of this.intervals) {
    //   if (current.overlaps(mergedInterval)) {
    //     mergedInterval = mergedInterval.merge(current)
    //   } else {
    //     newIntervals.push(current)
    //   }
    // }

    // newIntervals.push(mergedInterval)
    // this.intervals = newIntervals
  }

  addStartEnd(start: number, end: number) {
    this.addInterval(new Interval(start, end))
  }

  addCenterWidth(center: number, width: number) {
    const half = width / 2
    this.addInterval(new Interval(center - half, center + half))
  }

  intersectIntervals(interval: Interval): Interval[] {
    const result: Interval[] = []
    for (const current of this.intervals) {
      if (current.overlaps(interval)) {
        result.push(new Interval(Math.max(current.start, interval.start), Math.min(current.end, interval.end)))
      }
    }

    return result
  }

  intersects(interval: Interval): boolean {
    for (const current of this.intervals) {
      if (current.overlaps(interval)) {
        return true
      }
    }
    return false
  }

  intersectsStartEnd(start: number, end: number): boolean {
    return this.intersects(new Interval(start, end))
  }
}

type Options = Prettify<LabelForValue & KeyForValue & ZeroLabel & EdgeLabels & Padding & {
  step?: number | number[]
  offset?: number
}>

export class StepLabels extends BaseLabels {

  private lastStep = 0

  constructor(private options: Options) {
    super()
  }

  calculateLabelPositions(space: ChartSpace, overflow: { start: number, end: number }) {

    const tx = space.translateX.bind(space)
    const options = this.options

    const result: {
      x: number,
      label: string,
      key: string,
      value: number
    }[] = []

    const labelForValue = options.labelForValue ? options.labelForValue : (v: number) => v.toString()
    const keyForValue = options.keyForValue ? options.keyForValue : (v: number, label: string) => label

    const leftLimit = tx(space.bounds.minX)
    const rightLimit = tx(space.bounds.maxX)

    const getPox = (value: number, text: string) => {
      const width = this.getTextWidth(text)
      const x = tx(value)
      const half = width / 2
      const left = x - half
      const right = x + half

      let result = x
      if (left < leftLimit - overflow.start) {
        result = x + Math.min(leftLimit - overflow.start - left, Math.max(half - leftLimit, 0))
      } else if (right > rightLimit + overflow.end) {
        result = x - Math.min(right - rightLimit - overflow.end, Math.max(half - overflow.end, 0))
      }

      return {
        x: result,
        width,
        left: result - half,
        right: result + half,
        isEdge: result != x
      }
    }

    const forceIntervals = new Intervals()
    if (options.showEdgeLabels) {
      const left = space.bounds.minX
      const leftLabel = labelForValue(left)
      const leftKey = 'left-edge-interval-key'
      const leftPos = getPox(left, leftLabel)
      result.push({ x: leftPos.x, label: leftLabel, key: leftKey, value: left })
      forceIntervals.addCenterWidth(leftPos.x, leftPos.width)

      const right = space.bounds.maxX
      const rightLabel = labelForValue(right)
      const rightKey = 'right-edge-interval-key'
      const rightPos = getPox(right, rightLabel)
      result.push({ x: rightPos.x, label: rightLabel, key: rightKey, value: right })
      forceIntervals.addCenterWidth(rightPos.x, rightPos.width)
    }

    if (options.showZeroLabel) {
      const label = labelForValue(0)
      const key = 'zero-label-key'
      const zeroPos = getPox(0, label)
      if (!forceIntervals.intersectsStartEnd(zeroPos.left, zeroPos.right)) {
        result.push({ x: zeroPos.x, label, key, value: 0 })
        forceIntervals.addCenterWidth(zeroPos.x, zeroPos.width)
      }
    }

    if (options.step) {
      const step = options.step
      const offset = options.offset ?? 0


      for (let stepK = 0; stepK < 10; stepK++) {
        const stepValue = (() => {
          if (typeof step === 'number') return step * Math.pow(2, stepK)

          if (stepK < step.length) return step[stepK]
          return step[step.length - 1] * Math.pow(2, stepK - step.length + 1)
        })()

        const first = Math.ceil((space.bounds.minX - offset) / stepValue) * stepValue + offset

        const labels = [] as typeof result
        const stepIntervals = new Intervals()
        let intersect = false

        for (let x = first, i = 0; x <= space.bounds.maxX; x += stepValue, i++) {
          const label = labelForValue(x)
          const key = keyForValue(x, label)
          const pos = getPox(x, label)
          if (forceIntervals.intersectsStartEnd(pos.left, pos.right)) continue

          const debouncePadding = this.lastStep > stepK ? 1 : 0
          const hasIntersection = stepIntervals.intersectsStartEnd(pos.left - debouncePadding, pos.right + debouncePadding)

          if (pos.isEdge && hasIntersection && labels.length > 0) {
            continue
          }

          if (hasIntersection && i == 1) {
            labels.pop()
            labels.push({ x: pos.x, label, key, value: x })
            stepIntervals.addCenterWidth(pos.x, pos.width)
            continue
          }

          if (hasIntersection) {
            intersect = true
            break
          }

          labels.push({ x: pos.x, label, key, value: x })
          stepIntervals.addCenterWidth(pos.x, pos.width)
        }

        if (!intersect) {
          result.push(...labels)
          this.lastStep = stepK
          break
        }
      }
    }

    return result
  }
}
