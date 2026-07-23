import { Bounds, BoundsConstraint } from '../../utils/Bounds'
import { ChartSpace } from '../../utils/ChartSpace'
import { addClasses, classNames, Classes } from '../../utils/utils'
import { BasePlotRenderer } from '../BasePlotRenderer'


const NAMESPACE = 'http://www.w3.org/2000/svg'

export type BarRadius =
  number |
  [number, number] |
  [number, number, number, number] |
  {
    top?: number
    right?: number
    bottom?: number
    left?: number
    topLeft?: number
    topRight?: number
    bottomRight?: number
    bottomLeft?: number
  }

type BaseBarStrategy = {
  maxWidth?: number
  padding?: number
  radius?: BarRadius
}

export type GroupedBarStrategy = BaseBarStrategy & {
  type: 'grouped'
  innerPadding?: number
}

export type StackedBarStrategy = BaseBarStrategy & {
  type: 'stacked'
  innerPadding?: number
  innerRadius?: BarRadius
}

export type BarStrategy = GroupedBarStrategy | StackedBarStrategy

export type BarDataset = {
  values: number[]
  classes?: Classes
}

export type Options = {
  classes?: Classes
  strategy: BarStrategy
}

type CornerRadii = {
  topLeft: number
  topRight: number
  bottomRight: number
  bottomLeft: number
}

type DatasetElements = {
  root: SVGGElement
  bars: SVGPathElement[]
}

type StackSegment = {
  datasetIndex: number
  start: number
  end: number
}

type Gap = {
  start: number
  end: number
}

export class Bar extends BasePlotRenderer {
  protected datasets: BarDataset[] = []
  protected strategy: BarStrategy

  private datasetElements: DatasetElements[] = []

  constructor(options: Options) {
    super(options.classes)
    this.strategy = options.strategy
    addClasses(this.root, 'bar-plot')
  }

  setDatasets(datasets: BarDataset[]) {
    this.datasets = datasets
    this.syncElements()
    this.requestRender()
    return this
  }

  setStrategy(strategy: BarStrategy) {
    this.strategy = strategy
    this.requestRender()
    return this
  }

  getBounds(constraint?: BoundsConstraint): Bounds {
    const categoryCount = this.getCategoryCount()
    if (categoryCount === 0) return new Bounds()

    const bounds = new Bounds()
    for (let index = 0; index < categoryCount; index++) {
      if (!this.categoryIntersectsXConstraint(index, constraint)) continue

      const range = this.getCategoryRange(index)
      if (!this.rangeIntersectsYConstraint(range, constraint)) continue

      bounds.addXY(index, range.min)
      bounds.addXY(index + 1, range.max)
    }

    return bounds
  }

  protected renderImpl(space: ChartSpace): void {
    const paths = this.datasets.map(dataset => dataset.values.map(() => ''))
    const categoryCount = this.getCategoryCount()

    if (categoryCount > 0 && this.datasets.length > 0) {
      if (this.strategy.type === 'grouped') this.renderGrouped(paths, space, categoryCount)
      else this.renderStacked(paths, space, categoryCount)
    }

    for (let datasetIndex = 0; datasetIndex < this.datasetElements.length; datasetIndex++) {
      const elements = this.datasetElements[datasetIndex]
      const datasetPaths = paths[datasetIndex] ?? []
      for (let index = 0; index < elements.bars.length; index++) {
        const nextPath = datasetPaths[index] ?? ''
        if (elements.bars[index].getAttribute('d') !== nextPath)
          elements.bars[index].setAttribute('d', nextPath)
      }
    }
  }

  private renderGrouped(paths: string[][], space: ChartSpace, categoryCount: number) {
    const datasetCount = this.datasets.length
    if (datasetCount === 0) return

    for (let index = 0; index < categoryCount; index++) {
      if (!this.isCategoryVisible(index, space)) continue

      const group = this.getGroupLayout(index, space)
      const paddingOption = Math.max(0, this.strategy.innerPadding ?? 0)
      const relativePadding = paddingOption < 1 ? paddingOption / (1 - paddingOption) : null
      const barWidth = relativePadding === null
        ? Math.max(0, (group.width - paddingOption * (datasetCount - 1)) / datasetCount)
        : group.width / (datasetCount + relativePadding * (datasetCount - 1))
      const innerPadding = relativePadding === null ? paddingOption : barWidth * relativePadding
      if (barWidth === 0) continue

      for (let datasetIndex = 0; datasetIndex < datasetCount; datasetIndex++) {
        const value = this.datasets[datasetIndex].values[index]
        if (!Number.isFinite(value) || value === 0) continue

        const left = group.left + datasetIndex * (barWidth + innerPadding)
        const y0 = space.chartToLayoutY(0)
        const yValue = space.chartToLayoutY(value)
        const top = Math.min(y0, yValue)
        const height = Math.abs(yValue - y0)
        if (height === 0) continue

        const radii = normalizeRadii(
          resolveRadius(this.strategy.radius ?? 0, value > 0 ? 'positive' : 'negative', 'outer'),
          barWidth,
          height,
        )
        paths[datasetIndex][index] = createBarPath(left, top, barWidth, height, radii)
      }
    }
  }

  private renderStacked(paths: string[][], space: ChartSpace, categoryCount: number) {
    if (this.strategy.type !== 'stacked') return
    const strategy = this.strategy

    for (let index = 0; index < categoryCount; index++) {
      if (!this.isCategoryVisible(index, space)) continue

      const group = this.getGroupLayout(index, space)
      if (group.width === 0) continue

      this.renderStackSign(paths, space, index, group, strategy, 'positive')
      this.renderStackSign(paths, space, index, group, strategy, 'negative')
    }
  }

  private renderStackSign(
    paths: string[][],
    space: ChartSpace,
    categoryIndex: number,
    group: { left: number, width: number },
    strategy: StackedBarStrategy,
    sign: 'positive' | 'negative',
  ) {
    const axisY = space.chartToLayoutY(0)
    const segments: StackSegment[] = []
    let sum = 0

    for (let datasetIndex = 0; datasetIndex < this.datasets.length; datasetIndex++) {
      const value = this.datasets[datasetIndex].values[categoryIndex]
      if (!Number.isFinite(value) || value === 0) continue
      if (sign === 'positive' ? value < 0 : value > 0) continue

      const start = Math.abs(space.chartToLayoutY(sum) - axisY)
      sum += value
      const end = Math.abs(space.chartToLayoutY(sum) - axisY)
      segments.push({ datasetIndex, start, end })
    }

    if (segments.length === 0) return

    const gaps = this.getStackGaps(segments, strategy.innerPadding ?? 0)
    const innerRadius = resolveRadius(strategy.innerRadius ?? 0, sign, 'all')
    const outerRadius = resolveRadius(strategy.radius ?? 0, sign, 'outer')
    const direction = sign === 'positive' ? -1 : 1

    for (let index = 0; index < segments.length; index++) {
      const segment = segments[index]
      const visibleStart = Math.max(segment.start, gaps[index - 1]?.end ?? segment.start)
      const visibleEnd = Math.min(segment.end, gaps[index]?.start ?? segment.end)
      if (visibleEnd <= visibleStart) continue

      const p1 = axisY + direction * visibleStart
      const p2 = axisY + direction * visibleEnd
      const top = Math.min(p1, p2)
      const height = Math.abs(p2 - p1)
      const radii = emptyRadii()

      if (sign === 'positive') {
        if (index > 0) {
          radii.bottomLeft = innerRadius.bottomLeft
          radii.bottomRight = innerRadius.bottomRight
        }
        if (index < segments.length - 1) {
          radii.topLeft = innerRadius.topLeft
          radii.topRight = innerRadius.topRight
        } else {
          radii.topLeft = outerRadius.topLeft
          radii.topRight = outerRadius.topRight
        }
      } else {
        if (index > 0) {
          radii.topLeft = innerRadius.topLeft
          radii.topRight = innerRadius.topRight
        }
        if (index < segments.length - 1) {
          radii.bottomLeft = innerRadius.bottomLeft
          radii.bottomRight = innerRadius.bottomRight
        } else {
          radii.bottomLeft = outerRadius.bottomLeft
          radii.bottomRight = outerRadius.bottomRight
        }
      }

      paths[segment.datasetIndex][categoryIndex] = createBarPath(
        group.left,
        top,
        group.width,
        height,
        normalizeRadii(radii, group.width, height),
      )
    }
  }

  private getStackGaps(segments: StackSegment[], innerPadding: number): Gap[] {
    const requestedPadding = Math.max(0, innerPadding)
    const gaps: Gap[] = []

    for (let index = 0; index < segments.length - 1; index++) {
      const current = segments[index]
      const next = segments[index + 1]
      const available = next.end - current.start
      const padding = Math.min(requestedPadding, available)
      const minStart = current.start
      const maxStart = next.end - padding
      const start = Math.min(Math.max(current.end - padding / 2, minStart), maxStart)
      gaps.push({ start, end: start + padding })
    }

    return gaps
  }

  private getGroupLayout(index: number, space: ChartSpace) {
    const x1 = space.chartToLayoutX(index)
    const x2 = space.chartToLayoutX(index + 1)
    const cellLeft = Math.min(x1, x2)
    const cellWidth = Math.abs(x2 - x1)
    const paddingOption = Math.max(0, this.strategy.padding ?? 0)
    const padding = paddingOption < 1 ? cellWidth * paddingOption : paddingOption
    const maxWidth = this.strategy.maxWidth !== undefined && this.strategy.maxWidth > 0
      ? this.strategy.maxWidth
      : Infinity
    const width = Math.min(Math.max(0, cellWidth - padding), maxWidth)

    return {
      left: cellLeft + (cellWidth - width) / 2,
      width,
    }
  }

  private syncElements() {
    while (this.datasetElements.length < this.datasets.length) {
      const root = document.createElementNS(NAMESPACE, 'g')
      addClasses(root, 'dataset')
      this.root.appendChild(root)
      this.datasetElements.push({ root, bars: [] })
    }

    while (this.datasetElements.length > this.datasets.length)
      this.datasetElements.pop()?.root.remove()

    for (let datasetIndex = 0; datasetIndex < this.datasets.length; datasetIndex++) {
      const dataset = this.datasets[datasetIndex]
      const elements = this.datasetElements[datasetIndex]
      elements.root.dataset.datasetIndex = datasetIndex.toString()

      while (elements.bars.length < dataset.values.length) {
        const bar = document.createElementNS(NAMESPACE, 'path')
        elements.root.appendChild(bar)
        elements.bars.push(bar)
      }

      while (elements.bars.length > dataset.values.length)
        elements.bars.pop()?.remove()

      const classes = ['bar', ...classNames(dataset.classes)].join(' ')
      for (let index = 0; index < elements.bars.length; index++) {
        const bar = elements.bars[index]
        bar.setAttribute('class', classes)
        bar.dataset.datasetIndex = datasetIndex.toString()
        bar.dataset.index = index.toString()
      }
    }
  }

  private getCategoryCount() {
    let count = 0
    for (const dataset of this.datasets) count = Math.max(count, dataset.values.length)
    return count
  }

  private getCategoryRange(index: number) {
    let min = 0
    let max = 0

    if (this.strategy.type === 'grouped') {
      for (const dataset of this.datasets) {
        const value = dataset.values[index]
        if (!Number.isFinite(value)) continue
        min = Math.min(min, value)
        max = Math.max(max, value)
      }
    } else {
      for (const dataset of this.datasets) {
        const value = dataset.values[index]
        if (!Number.isFinite(value)) continue
        if (value > 0) max += value
        else if (value < 0) min += value
      }
    }

    return { min, max }
  }

  private categoryIntersectsXConstraint(index: number, constraint?: BoundsConstraint) {
    if (!constraint) return true
    if (constraint.minX !== undefined && index + 1 <= constraint.minX) return false
    if (constraint.maxX !== undefined && index >= constraint.maxX) return false
    return true
  }

  private rangeIntersectsYConstraint(range: { min: number, max: number }, constraint?: BoundsConstraint) {
    if (!constraint) return true
    if (constraint.minY !== undefined && range.max < constraint.minY) return false
    if (constraint.maxY !== undefined && range.min > constraint.maxY) return false
    return true
  }

  private isCategoryVisible(index: number, space: ChartSpace) {
    return index + 1 > space.bounds.minX && index < space.bounds.maxX
  }
}

function resolveRadius(
  radius: BarRadius,
  sign: 'positive' | 'negative',
  numberMode: 'outer' | 'all',
): CornerRadii {
  if (typeof radius === 'number') {
    if (numberMode === 'all') return allRadii(radius)
    return sign === 'positive'
      ? { topLeft: radius, topRight: radius, bottomRight: 0, bottomLeft: 0 }
      : { topLeft: 0, topRight: 0, bottomRight: radius, bottomLeft: radius }
  }

  if (Array.isArray(radius)) {
    if (radius.length === 2) {
      const [top, bottom] = radius
      return { topLeft: top, topRight: top, bottomRight: bottom, bottomLeft: bottom }
    }

    const [topLeft, topRight, bottomRight, bottomLeft] = radius
    return { topLeft, topRight, bottomRight, bottomLeft }
  }

  return {
    topLeft: radius.topLeft ?? radius.top ?? radius.left ?? 0,
    topRight: radius.topRight ?? radius.top ?? radius.right ?? 0,
    bottomRight: radius.bottomRight ?? radius.bottom ?? radius.right ?? 0,
    bottomLeft: radius.bottomLeft ?? radius.bottom ?? radius.left ?? 0,
  }
}

function normalizeRadii(radii: CornerRadii, width: number, height: number): CornerRadii {
  const maxRadius = width / 2
  const result = {
    topLeft: Math.max(0, Math.min(radii.topLeft, maxRadius)),
    topRight: Math.max(0, Math.min(radii.topRight, maxRadius)),
    bottomRight: Math.max(0, Math.min(radii.bottomRight, maxRadius)),
    bottomLeft: Math.max(0, Math.min(radii.bottomLeft, maxRadius)),
  }

  const leftHeight = result.topLeft + result.bottomLeft
  if (leftHeight > height) {
    const scale = height / leftHeight
    result.topLeft *= scale
    result.bottomLeft *= scale
  }

  const rightHeight = result.topRight + result.bottomRight
  if (rightHeight > height) {
    const scale = height / rightHeight
    result.topRight *= scale
    result.bottomRight *= scale
  }

  return result
}

function emptyRadii(): CornerRadii {
  return { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 }
}

function allRadii(radius: number): CornerRadii {
  return { topLeft: radius, topRight: radius, bottomRight: radius, bottomLeft: radius }
}

function createBarPath(x: number, y: number, width: number, height: number, radii: CornerRadii) {
  const right = x + width
  const bottom = y + height
  const { topLeft, topRight, bottomRight, bottomLeft } = radii
  const path = [
    `M ${format(x + topLeft)} ${format(y)}`,
    `H ${format(right - topRight)}`,
  ]

  if (topRight > 0)
    path.push(`A ${format(topRight)} ${format(topRight)} 0 0 1 ${format(right)} ${format(y + topRight)}`)

  path.push(`V ${format(bottom - bottomRight)}`)
  if (bottomRight > 0)
    path.push(`A ${format(bottomRight)} ${format(bottomRight)} 0 0 1 ${format(right - bottomRight)} ${format(bottom)}`)

  path.push(`H ${format(x + bottomLeft)}`)
  if (bottomLeft > 0)
    path.push(`A ${format(bottomLeft)} ${format(bottomLeft)} 0 0 1 ${format(x)} ${format(bottom - bottomLeft)}`)

  path.push(`V ${format(y + topLeft)}`)
  if (topLeft > 0)
    path.push(`A ${format(topLeft)} ${format(topLeft)} 0 0 1 ${format(x + topLeft)} ${format(y)}`)

  path.push('Z')
  return path.join(' ')
}

function format(value: number) {
  return value.toFixed(2)
}
