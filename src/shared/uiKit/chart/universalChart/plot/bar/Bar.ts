import { InteractionBounds } from '../../interaction/core/InteractionGeometry'
import { Bounds, BoundsConstraint } from '../../utils/Bounds'
import { ChartSpace } from '../../utils/ChartSpace'
import { addClasses, classNames, Classes } from '../../utils/utils'
import { BasePlotRenderer } from '../BasePlotRenderer'
import { BarInteractionSource } from './BarInteractionSource'


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
  affectsBounds?: boolean
}

type CornerRadii = {
  topLeft: number
  topRight: number
  bottomRight: number
  bottomLeft: number
}

export type BarLayoutItem = {
  readonly datasetIndex: number
  readonly categoryIndex: number
  readonly value: number
  readonly rect: InteractionBounds
  readonly slotRect: InteractionBounds
  readonly groupRect: InteractionBounds
  readonly target: SVGPathElement
  readonly radii: CornerRadii
}

type BarLayoutDraft = Omit<BarLayoutItem, 'groupRect'>

type DatasetElements = {
  root: SVGGElement
  bars: SVGPathElement[]
  classes: string[]
}

type StackSegment = {
  datasetIndex: number
  value: number
  start: number
  end: number
}

type Gap = {
  start: number
  end: number
}

type GroupLayout = {
  left: number
  width: number
}

export class Bar extends BasePlotRenderer {
  protected datasets: BarDataset[] = []
  protected strategy: BarStrategy

  private datasetElements: DatasetElements[] = []

  private layoutCacheKey: string | null = null
  private readonly layoutCache = new Map<number, readonly BarLayoutItem[]>()

  readonly interaction: BarInteractionSource = new BarInteractionSource({
    datasets: () => this.datasets,
    categoryCount: () => this.getCategoryCount(),
    categoryLayout: (categoryIndex, space) => this.getCategoryLayout(categoryIndex, space),
    strategyType: () => this.strategy.type,
  })

  constructor(options: Options) {
    super(options.classes, { affectsBounds: options.affectsBounds ?? true })
    this.strategy = options.strategy
    addClasses(this.root, 'bar-plot')
  }

  setDatasets(datasets: BarDataset[]) {
    this.datasets = datasets
    this.invalidateLayout()
    this.syncElements()
    this.requestRender()
    return this
  }

  setStrategy(strategy: BarStrategy) {
    this.strategy = strategy
    this.invalidateLayout()
    this.requestRender()
    return this
  }

  getCategoryLayout(categoryIndex: number, space: ChartSpace): readonly BarLayoutItem[] {
    const key = space.getHash()
    if (key !== this.layoutCacheKey) {
      this.layoutCacheKey = key
      this.layoutCache.clear()
    }

    const cached = this.layoutCache.get(categoryIndex)
    if (cached) return cached

    const layout = this.calculateCategoryLayout(categoryIndex, space)
    this.layoutCache.set(categoryIndex, layout)
    return layout
  }

  protected calculateBounds(constraint?: BoundsConstraint): Bounds {
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

    if (isDegenerateSpace(space)) {
      this.applyPaths(paths)
      return
    }

    const categoryCount = this.getCategoryCount()
    for (let index = 0; index < categoryCount; index++) {
      if (!this.isCategoryVisible(index, space)) continue

      for (const item of this.getCategoryLayout(index, space)) {
        const width = item.rect.maxX - item.rect.minX
        const height = item.rect.maxY - item.rect.minY
        if (width <= 0 || height <= 0) continue

        paths[item.datasetIndex][item.categoryIndex] = createBarPath(item.rect.minX, item.rect.minY, width, height, item.radii)
      }
    }

    this.applyPaths(paths)
  }

  private applyPaths(paths: string[][]) {
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

  private calculateCategoryLayout(categoryIndex: number, space: ChartSpace): readonly BarLayoutItem[] {
    if (isDegenerateSpace(space) || this.datasets.length === 0) return []

    const group = this.getGroupLayout(categoryIndex, space)
    const axisY = space.chartToLayoutY(0)
    if (!Number.isFinite(group.left) || !Number.isFinite(group.width) || !Number.isFinite(axisY)) return []

    const drafts = this.strategy.type === 'grouped'
      ? this.groupedLayout(categoryIndex, space, group, axisY)
      : this.stackedLayout(categoryIndex, space, group, axisY, this.strategy)

    let minY = axisY
    let maxY = axisY
    for (const draft of drafts) {
      minY = Math.min(minY, draft.slotRect.minY)
      maxY = Math.max(maxY, draft.slotRect.maxY)
    }

    const groupRect: InteractionBounds = { minX: group.left, maxX: group.left + group.width, minY, maxY }
    return drafts.map(draft => ({ ...draft, groupRect }))
  }

  private groupedLayout(categoryIndex: number, space: ChartSpace, group: GroupLayout, axisY: number): BarLayoutDraft[] {
    const datasetCount = this.datasets.length
    const { barWidth, innerPadding } = groupedBarMetrics(group.width, datasetCount, this.strategy.innerPadding ?? 0)
    const radius = this.strategy.radius ?? 0
    const groupRight = group.left + group.width

    const drafts: BarLayoutDraft[] = []
    for (let datasetIndex = 0; datasetIndex < datasetCount; datasetIndex++) {
      const value = this.datasets[datasetIndex].values[categoryIndex]
      const target = this.datasetElements[datasetIndex]?.bars[categoryIndex]
      if (!Number.isFinite(value) || !target) continue

      const left = group.left + datasetIndex * (barWidth + innerPadding)
      const yValue = space.chartToLayoutY(value)
      const rect: InteractionBounds = {
        minX: left,
        maxX: left + barWidth,
        minY: Math.min(axisY, yValue),
        maxY: Math.max(axisY, yValue),
      }

      const slotRect: InteractionBounds = {
        minX: Math.max(group.left, left - innerPadding / 2),
        maxX: Math.min(groupRight, left + barWidth + innerPadding / 2),
        minY: rect.minY,
        maxY: rect.maxY,
      }

      if (!isFiniteRect(rect) || !isFiniteRect(slotRect)) continue

      drafts.push({
        datasetIndex,
        categoryIndex,
        value,
        rect,
        slotRect,
        target,
        radii: normalizeRadii(resolveRadius(radius, value > 0 ? 'positive' : 'negative', 'outer'), barWidth, rect.maxY - rect.minY),
      })
    }

    return drafts
  }

  private stackedLayout(categoryIndex: number, space: ChartSpace, group: GroupLayout, axisY: number, strategy: StackedBarStrategy): BarLayoutDraft[] {
    const byDataset = new Array<BarLayoutDraft | null>(this.datasets.length).fill(null)

    this.fillStackSign(byDataset, categoryIndex, space, group, axisY, strategy, 'positive')
    this.fillStackSign(byDataset, categoryIndex, space, group, axisY, strategy, 'negative')

    for (let datasetIndex = 0; datasetIndex < this.datasets.length; datasetIndex++) {
      if (byDataset[datasetIndex]) continue

      const value = this.datasets[datasetIndex].values[categoryIndex]
      const target = this.datasetElements[datasetIndex]?.bars[categoryIndex]
      if (value !== 0 || !target) continue

      const rect: InteractionBounds = { minX: group.left, maxX: group.left + group.width, minY: axisY, maxY: axisY }
      byDataset[datasetIndex] = { datasetIndex, categoryIndex, value, rect, slotRect: rect, target, radii: emptyRadii() }
    }

    return byDataset.filter((draft): draft is BarLayoutDraft => draft !== null)
  }

  private fillStackSign(
    byDataset: (BarLayoutDraft | null)[],
    categoryIndex: number,
    space: ChartSpace,
    group: GroupLayout,
    axisY: number,
    strategy: StackedBarStrategy,
    sign: 'positive' | 'negative',
  ) {
    const segments: StackSegment[] = []
    let sum = 0

    for (let datasetIndex = 0; datasetIndex < this.datasets.length; datasetIndex++) {
      const value = this.datasets[datasetIndex].values[categoryIndex]
      if (!Number.isFinite(value) || value === 0) continue
      if (sign === 'positive' ? value < 0 : value > 0) continue

      const start = Math.abs(space.chartToLayoutY(sum) - axisY)
      sum += value
      const end = Math.abs(space.chartToLayoutY(sum) - axisY)
      segments.push({ datasetIndex, value, start, end })
    }

    if (segments.length === 0) return

    const gaps = getStackGaps(segments, strategy.innerPadding ?? 0)
    const innerRadius = resolveRadius(strategy.innerRadius ?? 0, sign, 'all')
    const outerRadius = resolveRadius(strategy.radius ?? 0, sign, 'outer')
    const direction = sign === 'positive' ? -1 : 1

    for (let index = 0; index < segments.length; index++) {
      const segment = segments[index]
      const target = this.datasetElements[segment.datasetIndex]?.bars[categoryIndex]
      if (!target) continue

      const visibleStart = Math.max(segment.start, gaps[index - 1]?.end ?? segment.start)
      const visibleEnd = Math.max(visibleStart, Math.min(segment.end, gaps[index]?.start ?? segment.end))

      const rect = stackRect(group, axisY, direction, visibleStart, visibleEnd)
      const slotRect = stackRect(group, axisY, direction, segment.start, segment.end)
      if (!isFiniteRect(rect) || !isFiniteRect(slotRect)) continue

      const radii = stackSegmentRadii(sign, index, segments.length, innerRadius, outerRadius)

      byDataset[segment.datasetIndex] = {
        datasetIndex: segment.datasetIndex,
        categoryIndex,
        value: segment.value,
        rect,
        slotRect,
        target,
        radii: normalizeRadii(radii, group.width, rect.maxY - rect.minY),
      }
    }
  }

  private getGroupLayout(index: number, space: ChartSpace): GroupLayout {
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

  private invalidateLayout() {
    this.layoutCacheKey = null
    this.layoutCache.clear()
  }

  private syncElements() {
    while (this.datasetElements.length < this.datasets.length) {
      const root = document.createElementNS(NAMESPACE, 'g')
      addClasses(root, 'dataset')
      this.root.appendChild(root)
      this.datasetElements.push({ root, bars: [], classes: [] })
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

      const classes = ['bar', ...classNames(dataset.classes)]
      const removed = elements.classes.filter(name => !classes.includes(name))

      for (let index = 0; index < elements.bars.length; index++) {
        const bar = elements.bars[index]
        if (removed.length > 0) bar.classList.remove(...removed)
        bar.classList.add(...classes)
        bar.dataset.datasetIndex = datasetIndex.toString()
        bar.dataset.index = index.toString()
      }

      elements.classes = classes
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

function isDegenerateSpace(space: ChartSpace) {
  const { minX, maxX, minY, maxY } = space.bounds
  if (space.bounds.isEmpty()) return true
  return minX === maxX || minY === maxY || !Number.isFinite(maxX - minX) || !Number.isFinite(maxY - minY)
}

function isFiniteRect(rect: InteractionBounds) {
  return Number.isFinite(rect.minX) && Number.isFinite(rect.maxX) && Number.isFinite(rect.minY) && Number.isFinite(rect.maxY)
}

function groupedBarMetrics(groupWidth: number, datasetCount: number, innerPadding: number) {
  const paddingOption = Math.max(0, innerPadding)
  const relativePadding = paddingOption < 1 ? paddingOption / (1 - paddingOption) : null
  const barWidth = relativePadding === null
    ? Math.max(0, (groupWidth - paddingOption * (datasetCount - 1)) / datasetCount)
    : groupWidth / (datasetCount + relativePadding * (datasetCount - 1))

  return {
    barWidth,
    innerPadding: relativePadding === null ? paddingOption : barWidth * relativePadding,
  }
}

function stackSegmentRadii(
  sign: 'positive' | 'negative',
  index: number,
  segmentsLength: number,
  innerRadius: CornerRadii,
  outerRadius: CornerRadii,
): CornerRadii {
  const isFirst = index === 0
  const isLast = index === segmentsLength - 1
  const outward = isLast ? outerRadius : innerRadius
  const inward = isFirst ? emptyRadii() : innerRadius

  return sign === 'positive'
    ? {
      topLeft: outward.topLeft,
      topRight: outward.topRight,
      bottomRight: inward.bottomRight,
      bottomLeft: inward.bottomLeft,
    }
    : {
      topLeft: inward.topLeft,
      topRight: inward.topRight,
      bottomRight: outward.bottomRight,
      bottomLeft: outward.bottomLeft,
    }
}

function getStackGaps(segments: StackSegment[], innerPadding: number): Gap[] {
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

function stackRect(group: GroupLayout, axisY: number, direction: number, start: number, end: number): InteractionBounds {
  const p1 = axisY + direction * start
  const p2 = axisY + direction * end

  return {
    minX: group.left,
    maxX: group.left + group.width,
    minY: Math.min(p1, p2),
    maxY: Math.max(p1, p2),
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
