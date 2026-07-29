// Минимальный чарт-подложка для секций страницы: ось + тики + подписи и самый простой
// рендерер данных. Всё, что меняется структурно (стороны осей, тип тиков, слот подписей),
// задаётся в конструкторе — экземпляр пересоздаётся.

import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { ChartAxis } from '@/shared/uiKit/chart/universalChart/plot/axis/ChartAxis'
import { PlotAreaBorder, type PlotAreaBorderSides } from '@/shared/uiKit/chart/universalChart/plot/axis/PlotAreaBorder'
import { ChartClip } from '@/shared/uiKit/chart/universalChart/defs/ChartClip'
import { AutoLabels, type Options as LabelsOptions } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { Bar, type BarDataset, type BarStrategy } from '@/shared/uiKit/chart/universalChart/plot/bar/Bar'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { BaseTicks } from '@/shared/uiKit/chart/universalChart/ticks/BaseTicks'
import { TicksByLabels, type TickLayerOptions } from '@/shared/uiKit/chart/universalChart/ticks/TicksByLabels'
import { TicksByValues } from '@/shared/uiKit/chart/universalChart/ticks/TicksByValues'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { joinClasses, type Classes, type Offset4Side } from '@/shared/uiKit/chart/universalChart/utils/utils'
import type { ChartSeries } from '@/pages/debug/shared/fixtures/types'
import { readRenderedLabels, readTickLevels, type ProbeState, type StepProbe } from './probe'

export type { BorderVariant, PlotAreaBorderSides } from '@/shared/uiKit/chart/universalChart/plot/axis/PlotAreaBorder'

// У TicksByValues start/end задаются только в конструкторе. Пересоздавать чарт на каждый шаг
// ползунка не хочется — открываем их наружу подклассом, движку это знать незачем.
// У TicksByLabels для этого есть updateOptions.
class LiveTicksByValues extends TicksByValues {
  setOffsets(start: number | null, end: number | null) {
    this.sizes.start = start
    this.sizes.end = end
  }
}

export type TicksKind = 'none' | 'labels' | 'values'
export type LayoutVariant = 'horizontal' | 'vertical' | 'square'
export type XLabelsSlot = 'bottom' | 'top'
export type YLabelsSlot = 'left' | 'right'

export type LabelsChartSetup = {
  layoutVariant?: LayoutVariant
  x?: LabelsOptions | null
  y?: LabelsOptions | null
  xSlot?: XLabelsSlot
  ySlot?: YLabelsSlot
  xSlots?: readonly XLabelsSlot[]
  ySlots?: readonly YLabelsSlot[]
  axes?: PlotAreaBorderSides
  ticks?: {
    x?: TicksKind
    y?: TicksKind
    start?: number
    end?: number
    classes?: Classes
    levels?: readonly TickLayerOptions[]
  }
  plot?: 'line' | 'bar' | 'none'
  barStrategy?: BarStrategy
  clipLabels?: boolean
  clipPlot?: boolean
  zeroLine?: boolean
  minLayoutSize?: Offset4Side
  renderBoundsPadding?: Offset4Side
  stepProbe?: StepProbe
  onRender?: (state: ProbeState) => void
}

export class LabelsChart extends UniversalChart {

  readonly labelsXs: readonly AutoLabels[]
  readonly labelsYs: readonly AutoLabels[]
  readonly labelsX: AutoLabels | null
  readonly labelsY: AutoLabels | null
  readonly ticksX: BaseTicks | TicksByLabels | null = null
  readonly ticksY: BaseTicks | TicksByLabels | null = null

  private line: AutoLine | null = null
  private bar: Bar | null = null

  constructor(private setup: LabelsChartSetup) {
    super({
      layoutVariant: setup.layoutVariant ?? 'vertical',
      renderManager: globalChartRenderManagerSteps4,
      renderBoundsPadding: setup.renderBoundsPadding,
    })

    const xSlots = [...new Set(setup.xSlots ?? [setup.xSlot ?? 'bottom'])]
    const ySlots = [...new Set(setup.ySlots ?? [setup.ySlot ?? 'left'])]
    const clips: ChartClip[] = []
    const plotClip = setup.clipPlot ? new ChartClip('center') : null

    if (plotClip) clips.push(plotClip)

    this.labelsXs = setup.x
      ? xSlots.map(side => new AutoLabels('horizontal', setup.x!, side))
      : []
    this.labelsYs = setup.y
      ? ySlots.map(side => new AutoLabels('vertical', setup.y!, side))
      : []
    this.labelsX = this.labelsXs[0] ?? null
    this.labelsY = this.labelsYs[0] ?? null

    if (setup.clipLabels) {
      for (const labels of [...this.labelsXs, ...this.labelsYs]) {
        const clip = new ChartClip(labels.side)
        labels.clipBy(clip)
        clips.push(clip)
      }
    }

    this.ticksX = this.createTicks('horizontal', setup.ticks?.x ?? 'none', this.labelsX)
    this.ticksY = this.createTicks('vertical', setup.ticks?.y ?? 'none', this.labelsY)

    if (this.ticksY) this.addPlot(this.ticksY, 'ticks')
    if (this.ticksX) this.addPlot(this.ticksX, 'ticks')

    if (setup.plot === 'bar') {
      this.bar = new Bar({ classes: 'debug-bars', strategy: setup.barStrategy ?? { type: 'grouped', padding: 0.25 } })
      if (plotClip) this.bar.clipBy(plotClip)
      this.addPlot(this.bar, 'plot')
    } else if (setup.plot !== 'none') {
      this.line = new AutoLine({ classes: 'main-line', smoothingMethod: 'monotone' })
      if (plotClip) this.line.clipBy(plotClip)
      this.addPlot(this.line, 'plot')
    }

    if (setup.axes && Object.keys(setup.axes).length > 0) this.addPlot(new PlotAreaBorder(setup.axes), 'ticks')
    if (setup.zeroLine) this.addPlot(new ChartAxis('vertical', 0, 'zero-line'), 'ticks')

    for (const labels of this.labelsXs) this.addSlot(labels.side, labels, 'labels')
    for (const labels of this.labelsYs) this.addSlot(labels.side, labels, 'labels')

    if (clips.length > 0) this.addDefs(...clips)

    if (setup.onRender) this.onAfterRender.on(({ space, overflow, full }) => setup.onRender?.({
      bounds: { minX: space.bounds.minX, maxX: space.bounds.maxX, minY: space.bounds.minY, maxY: space.bounds.maxY },
      layout: { ...space.layout },
      overflow: { ...overflow },
      full: { ...full },
      step: setup.stepProbe?.step ?? -1,
      x: readRenderedLabels(this.labelsX, 'horizontal'),
      y: readRenderedLabels(this.labelsY, 'vertical'),
      xTicks: this.ticksX instanceof BaseTicks ? this.ticksX.getTicks(space).map(tick => tick.value) : [],
      yTicks: this.ticksY instanceof BaseTicks ? this.ticksY.getTicks(space).map(tick => tick.value) : [],
      xLevels: readTickLevels(this.labelsX, this.ticksX),
      yLevels: readTickLevels(this.labelsY, this.ticksY),
    }))

    this.setMinLayoutSize(setup.minLayoutSize ?? { top: 8, right: 8 })
  }

  private rootClasses(axis: 'horizontal' | 'vertical') {
    return joinClasses(axis === 'horizontal' ? 'x-grid' : 'y-grid', this.setup.ticks?.classes)
  }

  private createTicks(axis: 'horizontal' | 'vertical', kind: TicksKind, labels: AutoLabels | null) {
    const options = { start: this.setup.ticks?.start, end: this.setup.ticks?.end, classes: this.rootClasses(axis) }

    if (kind === 'labels') return labels ? new TicksByLabels(labels, { ...options, levels: this.setup.ticks?.levels }) : null
    if (kind === 'values') return new LiveTicksByValues(axis, options)
    return null
  }

  setTickOffsets(axis: 'horizontal' | 'vertical', start: number | null, end: number | null) {
    const ticks = axis === 'horizontal' ? this.ticksX : this.ticksY
    if (ticks instanceof LiveTicksByValues) ticks.setOffsets(start, end)
    if (ticks instanceof TicksByLabels) ticks.updateOptions({
      classes: this.rootClasses(axis),
      start: start ?? undefined,
      end: end ?? undefined,
      levels: this.setup.ticks?.levels,
    })
    this.dataDidChange()
    return this
  }

  setTickLevels(axis: 'horizontal' | 'vertical', levels: readonly TickLayerOptions[]) {
    const ticks = axis === 'horizontal' ? this.ticksX : this.ticksY
    if (!(ticks instanceof TicksByLabels)) return this

    ticks.updateOptions({
      classes: this.rootClasses(axis),
      start: this.setup.ticks?.start,
      end: this.setup.ticks?.end,
      levels,
    })
    return this
  }

  setPoints(points: ChartSeries) {
    this.line?.setPoints(points)
    return this
  }

  setDatasets(datasets: BarDataset[]) {
    this.bar?.setDatasets(datasets)
    return this
  }

  setBarStrategy(strategy: BarStrategy) {
    this.bar?.setStrategy(strategy)
    return this
  }

  setXLabels(options: LabelsOptions) {
    for (const labels of this.labelsXs) labels.updateOptions(options)
    return this
  }

  setYLabels(options: LabelsOptions) {
    for (const labels of this.labelsYs) labels.updateOptions(options)
    return this
  }

  setTickValues(axis: 'horizontal' | 'vertical', values: number[]) {
    const ticks = axis === 'horizontal' ? this.ticksX : this.ticksY
    if (ticks instanceof TicksByValues) ticks.setTicks(values)
    return this
  }
}
