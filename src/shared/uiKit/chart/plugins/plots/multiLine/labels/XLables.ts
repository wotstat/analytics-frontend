import { ChartSpace } from '../utils/ChartSpace'
import { Font } from './shared'

export type XAxisOptions = LabelsPadding | EdgeLabels | ZeroLabel | ManualLabels | ManualWithAlternativeLabels | SteppedLabels | LabelForValue | KeyForValue

type EdgeLabels = {
  showEdgeLabels?: boolean
}

type ZeroLabel = {
  showZeroLabel?: boolean
  zeroLabel?: string
}

type LabelDefinition = { value: number, label: string } | [number, string] | string
type ManualLabels = EdgeLabels & {
  labels: LabelDefinition[]
}

type ManualWithAlternativeLabels = EdgeLabels & {
  labels: LabelDefinition[][]
}

type SteppedLabels = EdgeLabels & {
  step: number
  offset?: number
}

type LabelsPadding = {
  padding?: number
}

type LabelForValue = {
  labelForValue(value: number): string
}

type KeyForValue = {
  keyForValue(value: number, label: string): string
}


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

const DEFAULT_LABEL_PADDING = 10
export class XLables {
  private elementByKey = new Map<string, SVGTextElement>()
  private cachedSizes = new Map<string, number>()
  private ctx = document.createElement('canvas').getContext('2d')
  private lastY = 0

  constructor(private root: SVGGElement, private options: XAxisOptions, font?: Font) {
    if (font) this.recalculateFont(font)
  }

  recalculateFont(font: Font) {
    if (!this.ctx) return
    if ('font' in font && font.font) {
      this.ctx.font = font.font
    } else if ('fontSize' in font && 'fontFamily' in font && font.fontSize && font.fontFamily) {
      this.ctx.font = `${font.fontSize}px ${font.fontFamily}`
    } else {
      const probeLabel = this.createLabel()

      const defaultFontFamily = probeLabel.computedStyleMap().get('font-family')?.toString()
      const defaultFontSize = probeLabel.computedStyleMap().get('font-size')?.toString()

      probeLabel.remove()

      const fontFamily = 'fontFamily' in font && font.fontFamily ? font.fontFamily : defaultFontFamily
      const fontSize = 'fontSize' in font && font.fontSize ? font.fontSize : defaultFontSize

      this.ctx.font = `${fontSize} ${fontFamily}`
      this.ctx.font
    }
  }

  private createLabel(textContent = ''): SVGTextElement {
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    label.classList.add('label')
    label.textContent = textContent
    this.root.appendChild(label)
    return label
  }

  render(space: ChartSpace, overflow: { start: number, end: number }) {
    const { minX, maxX } = space.bounds

    const labels = this.calculateLabelPositions(space, overflow)
    const usedKeys = new Set<string>(labels.map(l => l.key))

    for (const [key, element] of this.elementByKey) {
      if (!usedKeys.has(key)) {
        this.root.removeChild(element)
        this.elementByKey.delete(key)
      }
    }

    for (const key of this.cachedSizes.keys()) {
      if (!usedKeys.has(key)) this.cachedSizes.delete(key)
    }

    const y = space.translateY(0) + 15
    const yStr = y.toString()

    if (this.lastY !== y) {
      for (const element of this.elementByKey.values()) element.setAttribute('y', yStr)
      this.lastY = y
    }

    for (const key of usedKeys) {
      if (!this.elementByKey.has(key)) {
        const element = this.createLabel()
        this.elementByKey.set(key, element)
        element.setAttribute('y', yStr)
      }
    }

    for (const label of labels) {
      const element = this.elementByKey.get(label.key)
      if (!element) continue
      element.setAttribute('x', label.x.toString())
      if (element.textContent !== label.label) {
        element.textContent = label.label
      }
    }
  }

  private lastStep = 0
  private calculateLabelPositions(space: ChartSpace, overflow: { start: number, end: number }) {

    const tx = space.translateX.bind(space)
    const options = this.options

    const result: {
      x: number,
      label: string,
      key: string
    }[] = []

    const tryPush = (x: number, width: number, label: string | number) => {
    }

    const labelForValue = 'labelForValue' in options && options.labelForValue ? options.labelForValue : (v: number) => v.toString()
    const keyForValue = 'keyForValue' in options && options.keyForValue ? options.keyForValue : (v: number, label: string) => label

    const rightLimit = tx(space.bounds.maxX)
    const leftLimit = tx(space.bounds.minX)

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
        isEdge: left < leftLimit || right > rightLimit
      }
    }

    const forceIntervals = new Intervals()
    if ('showEdgeLabels' in options && options.showEdgeLabels) {
      const left = space.bounds.minX
      const leftLabel = labelForValue(left)
      const leftKey = 'left-edge-interval-key'
      const leftPos = getPox(left, leftLabel)
      result.push({ x: leftPos.x, label: leftLabel, key: leftKey })
      forceIntervals.addCenterWidth(leftPos.x, leftPos.width)

      const right = space.bounds.maxX
      const rightLabel = labelForValue(right)
      const rightKey = 'right-edge-interval-key'
      const rightPos = getPox(right, rightLabel)
      result.push({ x: rightPos.x, label: rightLabel, key: rightKey })
      forceIntervals.addCenterWidth(rightPos.x, rightPos.width)
    }

    if ('showZeroLabel' in options && options.showZeroLabel) {
      const label = labelForValue(0)
      const key = 'zero-label-key'
      const zeroPos = getPox(0, label)
      if (!forceIntervals.intersectsStartEnd(zeroPos.left, zeroPos.right)) {
        result.push({ x: zeroPos.x, label, key })
        forceIntervals.addCenterWidth(zeroPos.x, zeroPos.width)
      }
    }

    if ('step' in options && options.step) {
      const step = options.step
      const offset = options.offset ?? 0

      for (let stepK = 0; stepK < 4; stepK++) {
        const stepValue = step * Math.pow(2, stepK)
        const first = Math.ceil((space.bounds.minX - offset) / stepValue) * stepValue + offset

        const labels = [] as typeof result
        const stepIntervals = new Intervals()
        let intersect = false

        for (let x = first; x <= space.bounds.maxX; x += stepValue) {
          const label = labelForValue(x)
          const key = keyForValue(x, label)
          const pos = getPox(x, label)
          if (forceIntervals.intersectsStartEnd(pos.left, pos.right)) continue

          const debouncePadding = this.lastStep > stepK ? 0 : 0
          const hasIntersection = stepIntervals.intersectsStartEnd(pos.left - debouncePadding, pos.right + debouncePadding)


          // if (hasIntersection && labels.length > 1 && pos.isEdge) {
          //   continue
          // } else if (hasIntersection) {
          //   if (labels.length == 1) {
          //     labels.pop()
          //     labels.push({ x: pos.x, label, key })
          //     stepIntervals.addCenterWidth(pos.x, pos.width)
          //     continue
          //   }
          //   intersect = true
          //   break
          // }

          // if (hasIntersection && pos.isEdge && labels.length > 0) {
          //   continue
          // } else if (hasIntersection && labels.length == 1) {
          //   labels.pop()
          // } else if (hasIntersection) {
          //   intersect = true
          //   break
          // }


          if (hasIntersection) {
            intersect = true
            break
          }

          labels.push({ x: pos.x, label, key })
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

  private getTextWidth(text: string): number {
    if (!this.ctx) return 30
    if (this.cachedSizes.has(text)) return this.cachedSizes.get(text) as number

    const padding = 'padding' in this.options && this.options.padding !== undefined ? this.options.padding : DEFAULT_LABEL_PADDING
    const width = this.ctx.measureText(text).width + padding

    this.cachedSizes.set(text, width)

    return width
  }

  private getTextHeight(text: string): number {
    if (!this.ctx) return 14
    const metrics = this.ctx.measureText('M')
    const height = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent
    return height
  }
}
