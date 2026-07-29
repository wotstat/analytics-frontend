import { Axis, BaseLabels } from '../labels/BaseLabels'
import { Overflow, PlotRenderer, Size, UniversalChart } from '../UniversalChart'
import { ChartSpace } from '../utils/ChartSpace'
import { addClasses, Classes, classNames, removeClasses } from '../utils/utils'
import { BaseOffsetTicks } from './BaseOffsetTicks'

export type TickLayerOptions = {
  start?: number
  end?: number
  classes?: Classes
}

export type TicksByLabelsOptions = {
  classes?: Classes
  start?: number
  end?: number
  levels?: readonly TickLayerOptions[]
}

const NAMESPACE = 'http://www.w3.org/2000/svg'

class TickLevelRenderer extends BaseOffsetTicks {

  private values: readonly number[] = []
  private dynamicClasses: string[] = []

  constructor(axis: Axis, index: number) {
    super(axis)
    this.root.classList.remove('x-ticks', 'y-ticks')
    this.root.classList.add('tick-level', `tick-level-${index}`)
  }

  getTicksValues(): readonly number[] {
    return this.values
  }

  setValues(values: readonly number[]) {
    this.values = values
  }

  setOffsets(start: number | null, end: number | null) {
    this.sizes.start = start
    this.sizes.end = end
  }

  setDynamicClasses(...classes: (Classes | undefined)[]) {
    const next = classNames(...classes)
    if (next.length === this.dynamicClasses.length && next.every((item, index) => item === this.dynamicClasses[index])) return

    removeClasses(this.root, this.dynamicClasses)
    addClasses(this.root, next)
    this.dynamicClasses = next
  }
}

export class TicksByLabels implements PlotRenderer {

  private root = document.createElementNS(NAMESPACE, 'g')
  private chart: UniversalChart | null = null
  private levels: TickLevelRenderer[] = []
  private rootClasses: Classes | undefined

  constructor(private labels: BaseLabels, private options: TicksByLabelsOptions = {}) {
    this.root.classList.add(labels.axis === 'horizontal' ? 'x-ticks' : 'y-ticks')
    this.rootClasses = options.classes
    addClasses(this.root, this.rootClasses)
  }

  getRootElement(): Element {
    return this.root
  }

  attach(root: SVGGElement, chart: UniversalChart): void {
    this.chart = chart
    for (const level of this.levels) level.attach(this.root, chart)
  }

  detach(): void {
    for (const level of this.levels) {
      level.getRootElement().remove()
      level.detach()
    }
    this.levels = []
    this.chart = null
  }

  updateOptions(options: TicksByLabelsOptions) {
    this.options = options

    if (classNames(this.rootClasses).join(' ') !== classNames(options.classes).join(' ')) {
      removeClasses(this.root, this.rootClasses)
      addClasses(this.root, options.classes)
      this.rootClasses = options.classes
    }

    this.chart?.dataDidChange()
  }

  render(space: ChartSpace, overflow: Overflow, full: Size): void {
    const levels = this.labels.getTickLevels()
    this.syncLevels(levels.length)

    for (let index = 0; index < levels.length; index++) {
      const level = levels[index]
      const layer = this.options.levels?.[index]
      const renderer = this.levels[index]

      renderer.setDynamicClasses(level.classes, layer?.classes)
      renderer.setOffsets(
        layer?.start ?? (index === 0 ? this.options.start : undefined) ?? level.suggestedStart,
        layer?.end ?? (index === 0 ? this.options.end : undefined) ?? null,
      )
      renderer.setValues(level.values)
      renderer.render(space, overflow, full)
    }
  }

  private syncLevels(count: number) {
    if (this.levels.length === count) return

    while (this.levels.length > count) {
      const level = this.levels.pop()
      level?.getRootElement().remove()
      level?.detach()
    }

    while (this.levels.length < count) {
      const level = new TickLevelRenderer(this.labels.axis, this.levels.length)
      this.levels.push(level)
      if (this.chart) level.attach(this.root, this.chart)
    }

    for (let index = this.levels.length - 1; index >= 0; index--) this.root.appendChild(this.levels[index].getRootElement())
  }
}
