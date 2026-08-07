import { ChartClip } from '../defs/ChartClip'
import { SlotRenderer, UniversalChart, Overflow, Size } from '../UniversalChart'
import { ChartSpace } from '../utils/ChartSpace'
import { addClasses, Classes, classNames, removeClasses } from '../utils/utils'

export type LabelData = {
  key: string
  p: number
  label: string
  value: number
  classes?: Classes
}

export type LabelTickLevel = {
  values: readonly number[]
  classes?: Classes
  suggestedStart: number
}

export type LabelLevelData = {
  labels: LabelData[]
  classes?: Classes
}

export type LabelsFrame = {
  levels: readonly LabelLevelData[]
  tickLevels: readonly LabelTickLevel[]
}


export const DEFAULT_LABEL_OFFSET = 15
export const DEFAULT_LEVEL_GAP = 4
export type Axis = 'vertical' | 'horizontal'
export type LabelsSide = 'top' | 'right' | 'bottom' | 'left'
export type SlotSize = 'auto' | 'stable' | 'max-candidate' | number

type LabelLevelRoot = {
  root: SVGGElement
  dynamicClasses: string[]
}

export abstract class BaseLabels implements SlotRenderer {

  protected root = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  protected chart: UniversalChart | null = null
  private cachedSizes = new Map<string, number>()
  private cachedMetrics: TextMetrics | null = null
  private ctx = document.createElement('canvas').getContext('2d')


  private elementByKey = new Map<string, SVGTextElement>()
  private dynamicLabelClasses = new Map<string, string[]>()
  private levelRoots: LabelLevelRoot[] = []
  private tickLevels: readonly LabelTickLevel[] = []
  private maxObservedSize = 0

  private offset: number
  private levelGap: number
  private slotSize: SlotSize
  private maxLevelCount: number
  private fontStyleDirty = false
  private probeLabel: SVGTextElement | null = null

  constructor(
    readonly axis: Axis,
    options: {
      offset?: number
      levelGap?: number
      slotSize?: SlotSize
      maxLevelCount?: number
    } = {},
    readonly side: LabelsSide = axis === 'horizontal' ? 'bottom' : 'left',
  ) {
    const validSide = axis === 'horizontal'
      ? side === 'top' || side === 'bottom'
      : side === 'left' || side === 'right'

    if (!validSide) throw new Error(`Labels side "${side}" is incompatible with axis "${axis}"`)

    this.root.classList.add(axis == 'horizontal' ? 'x-labels' : 'y-labels', `${side}-labels`)
    this.offset = options.offset ?? DEFAULT_LABEL_OFFSET
    this.levelGap = options.levelGap ?? DEFAULT_LEVEL_GAP
    this.slotSize = options.slotSize ?? 'auto'
    this.maxLevelCount = options.maxLevelCount ?? 1
    this.validateSlotSize()
    this.probeLabel = this.createLabel()
    this.probeLabel.classList.add('probe-label')
  }

  updateOptions(options: {
    offset?: number
    levelGap?: number
    slotSize?: SlotSize
    maxLevelCount?: number
  }) {
    let changed = false
    if (options.offset !== undefined && options.offset !== this.offset) {
      this.offset = options.offset
      changed = true
    }
    if (options.levelGap !== undefined && options.levelGap !== this.levelGap) {
      this.levelGap = options.levelGap
      changed = true
    }
    if (options.slotSize !== undefined && options.slotSize !== this.slotSize) {
      this.slotSize = options.slotSize
      changed = true
    }
    if (options.maxLevelCount !== undefined && options.maxLevelCount !== this.maxLevelCount) {
      this.maxLevelCount = options.maxLevelCount
      changed = true
    }

    if (changed) {
      this.validateSlotSize()
      this.fontStyleDirty = true
      this.requestLayout()
    }
  }

  protected requestLayout() {
    this.chart?.layoutDidChange()
  }

  getRootElement(): Element {
    return this.root
  }

  attach(root: SVGGElement, chart: UniversalChart): void {
    this.chart = chart
  }

  detach(): void {
    this.chart = null
    for (const element of this.elementByKey.values()) element.remove()
    for (const level of this.levelRoots) level.root.remove()
    this.elementByKey.clear()
    this.dynamicLabelClasses.clear()
    this.cachedSizes.clear()
    this.cachedMetrics = null
    this.tickLevels = []
    this.levelRoots = []
  }

  didMount() {
    this.fontStyleDirty = true
  }

  clipBy(clip: ChartClip) {
    clip.clip(this.root)
    return this
  }

  getSize(space: ChartSpace, overflow: Overflow, full: Size): { width: number | null; height: number | null } {
    if (this.axis === 'horizontal') {
      if (typeof this.slotSize === 'number') return { width: null, height: this.slotSize }

      const { levels } = this.calculateLabelsFrame(space, { start: overflow.left, end: overflow.right })
      const levelCount = Math.max(1, levels.length)
      const current = this.getLevelsSize(levelCount)
      const maxCandidate = this.getLevelsSize(Math.max(1, this.maxLevelCount))
      return { width: null, height: this.resolveSlotSize(current, maxCandidate) }
    } else {
      if (typeof this.slotSize === 'number') return { width: this.slotSize, height: null }

      const { levels } = this.calculateLabelsFrame(space, { start: overflow.top, end: overflow.bottom })
      const labels = levels.flatMap(level => level.labels)
      const maxWidth = labels.reduce((max, l) => Math.max(max, this.getTextWidth(l.label)), 0)
      return { width: this.resolveSlotSize(maxWidth + this.offset), height: null }
    }
  }

  beforeLayout(space: ChartSpace, full: Size): void {
    if (!this.fontStyleDirty) return
    this.recalculateFont()
    this.fontStyleDirty = false
  }

  render(space: ChartSpace, overflow: Overflow) {
    const localOverflow = this.axis === 'horizontal' ? { start: overflow.left, end: overflow.right } : { start: overflow.top, end: overflow.bottom }

    const frame = this.calculateLabelsFrame(space, localOverflow)
    this.tickLevels = frame.tickLevels
    this.syncLevelRoots(frame.levels)

    const labels = frame.levels.flatMap((level, levelIndex) =>
      level.labels.map(label => ({ label, levelIndex, key: `${levelIndex}:${label.key}` }))
    )
    const usedKeys = new Set<string>(labels.map(label => label.key))

    for (const [key, element] of this.elementByKey) {
      if (!usedKeys.has(key)) {
        element.remove()
        this.elementByKey.delete(key)
        this.dynamicLabelClasses.delete(key)
      }
    }

    if (this.axis === 'horizontal') this.renderHorizontalLabel(space, labels)
    else this.renderVerticalLabel(space, labels)

  }

  protected renderHorizontalLabel(
    space: ChartSpace,
    labels: { label: LabelData, levelIndex: number, key: string }[],
  ) {
    const step = this.getLevelStep()

    for (const current of labels) {
      const { label, levelIndex, key } = current
      const y = this.side === 'top'
        ? space.layout.y - this.offset - this.getTextMetrics().fontBoundingBoxDescent - levelIndex * step
        : space.layout.y + space.layout.height + this.getYOffset() + levelIndex * step
      let element = this.elementByKey.get(key)

      if (!element) {
        element = this.createLabel('', this.levelRoots[levelIndex]?.root)
        this.elementByKey.set(key, element)
      }

      element.setAttribute('y', y.toString())
      element.setAttribute('x', label.p.toString())
      this.syncLabelClasses(key, element, label.classes)
      if (element.textContent !== label.label) element.textContent = label.label
    }
  }

  protected renderVerticalLabel(
    space: ChartSpace,
    labels: { label: LabelData, levelIndex: number, key: string }[],
  ) {
    const x = this.side === 'right'
      ? space.layout.x + space.layout.width + this.getXOffset(space)
      : space.layout.x - this.getXOffset(space)
    const xStr = x.toString()

    for (const current of labels) {
      const { label, levelIndex, key } = current
      let element = this.elementByKey.get(key)
      if (!element) {
        element = this.createLabel('', this.levelRoots[levelIndex]?.root)
        this.elementByKey.set(key, element)
      }

      element.setAttribute('x', xStr)
      element.setAttribute('y', label.p.toString())
      this.syncLabelClasses(key, element, label.classes)
      if (element.textContent !== label.label) element.textContent = label.label
    }
  }

  getTickLevels(): readonly LabelTickLevel[] {
    return this.tickLevels
  }

  recalculateFont() {
    if (!this.ctx) return
    if (!this.probeLabel) return

    const { fontWeight, fontSize, fontFamily } = getComputedStyle(this.probeLabel)
    const target = `${fontWeight} ${fontSize} ${fontFamily}`
    if (this.ctx.font == target) return

    this.ctx.font = target
    this.cachedSizes.clear()
    this.cachedMetrics = null
  }

  getHeight(): number {
    const metrics = this.getTextMetrics()
    return this.getYOffset() + metrics.fontBoundingBoxDescent
  }

  protected getLevelOuterOffset(level: number): number {
    return this.getHeight() + level * this.getLevelStep()
  }

  private getLevelsSize(levelCount: number): number {
    return this.getLevelOuterOffset(Math.max(0, levelCount - 1))
  }

  private getLevelStep(): number {
    return this.getTextHeight('M') + this.levelGap
  }

  getYOffset(): number {
    const metrics = this.getTextMetrics()
    return metrics.hangingBaseline + this.offset
  }

  getXOffset(space: ChartSpace): number {
    return this.offset
  }

  abstract calculateLabelsFrame(space: ChartSpace, overflow: { start: number, end: number }): LabelsFrame

  protected createLabel(textContent = '', root: SVGElement = this.root): SVGTextElement {
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    label.classList.add('label')
    label.textContent = textContent
    root.appendChild(label)
    return label
  }

  private syncLabelClasses(key: string, element: SVGTextElement, classes?: Classes) {
    const next = classNames(classes)
    const current = this.dynamicLabelClasses.get(key) ?? []
    if (next.length === current.length && next.every((item, index) => item === current[index])) return

    removeClasses(element, current)
    addClasses(element, next)
    if (next.length > 0) this.dynamicLabelClasses.set(key, next)
    else this.dynamicLabelClasses.delete(key)
  }

  private syncLevelRoots(levels: readonly LabelLevelData[]) {
    while (this.levelRoots.length > levels.length) {
      const current = this.levelRoots.pop()
      current?.root.remove()
    }

    while (this.levelRoots.length < levels.length) {
      const index = this.levelRoots.length
      const root = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      root.classList.add('label-level', `label-level-${index}`)
      this.root.appendChild(root)
      this.levelRoots.push({ root, dynamicClasses: [] })
    }

    for (let index = 0; index < levels.length; index++) {
      const target = this.levelRoots[index]
      const next = classNames(levels[index].classes)
      if (next.length === target.dynamicClasses.length && next.every((item, i) => item === target.dynamicClasses[i])) continue

      removeClasses(target.root, target.dynamicClasses)
      addClasses(target.root, next)
      target.dynamicClasses = next
    }
  }

  private resolveSlotSize(current: number, maxCandidate = current) {
    this.maxObservedSize = Math.max(this.maxObservedSize, current)

    if (this.slotSize === 'stable') return this.maxObservedSize
    if (this.slotSize === 'max-candidate') return maxCandidate
    return current
  }

  private validateSlotSize() {
    if (this.axis === 'vertical' && this.slotSize === 'max-candidate') {
      throw new Error('slotSize "max-candidate" is supported only for horizontal labels')
    }
  }

  getTextWidth(text: string): number {
    if (!this.ctx) return 30
    if (this.cachedSizes.has(text)) return this.cachedSizes.get(text) as number

    const width = this.ctx.measureText(text).width

    this.cachedSizes.set(text, width)

    return width
  }

  getTextHeight(text: string): number {
    const metrics = this.getTextMetrics()
    return metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent
  }

  getTextMetrics() {
    if (this.cachedMetrics !== null) return this.cachedMetrics
    if (!this.ctx) return new TextMetrics()
    const metrics = this.ctx.measureText('M')
    this.cachedMetrics = metrics

    return this.cachedMetrics
  }
}
