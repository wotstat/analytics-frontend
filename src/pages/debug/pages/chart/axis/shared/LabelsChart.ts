// Минимальный чарт-подложка для секций страницы: ось + тики + подписи и самый простой
// рендерер данных. Всё, что меняется структурно (стороны осей, тип тиков, слот подписей),
// задаётся в конструкторе — экземпляр пересоздаётся, потому что убрать renderer из чарта
// движок не умеет.

import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { Axis } from '@/shared/uiKit/chart/universalChart/axis/Axis'
import { ChartClip } from '@/shared/uiKit/chart/universalChart/defs/ChartClip'
import { AutoLabels, type Options as LabelsOptions } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { Bar, type BarDataset, type BarStrategy } from '@/shared/uiKit/chart/universalChart/plot/bar/Bar'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import type { BaseTicks } from '@/shared/uiKit/chart/universalChart/ticks/BaseTicks'
import { TicksByLabels } from '@/shared/uiKit/chart/universalChart/ticks/TicksByLabels'
import { TicksByValues } from '@/shared/uiKit/chart/universalChart/ticks/TicksByValues'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import type { Offset4Side } from '@/shared/uiKit/chart/universalChart/utils/utils'
import type { ChartSeries } from '@/pages/debug/shared/fixtures/types'
import { readRenderedLabels, RenderProbe, type ProbeState, type StepProbe } from './probe'

// start/end у тиков задаются только в конструкторе. Пересоздавать чарт на каждый шаг
// ползунка не хочется — открываем их наружу подклассом.
class LiveTicksByValues extends TicksByValues {
  setOffsets(start: number | null, end: number | null) {
    this.sizes.start = start
    this.sizes.end = end
  }
}

class LiveTicksByLabels extends TicksByLabels {
  setOffsets(start: number | null, end: number | null) {
    this.sizes.start = start
    this.sizes.end = end
  }
}

export type AxisVariant = 'space' | 'full'
export type AxisSides = { top?: AxisVariant, right?: AxisVariant, bottom?: AxisVariant, left?: AxisVariant }
export type TicksKind = 'none' | 'labels' | 'values'
export type LayoutVariant = 'horizontal' | 'vertical' | 'square'

export type LabelsChartSetup = {
  layoutVariant?: LayoutVariant
  x?: LabelsOptions | null
  y?: LabelsOptions | null
  // Подписи всегда рисуются снизу и слева; слот меняет только то, где резервируется место.
  xSlot?: 'bottom' | 'top'
  ySlot?: 'left' | 'right'
  axes?: AxisSides
  ticks?: {
    x?: TicksKind
    y?: TicksKind
    start?: number
    end?: number
  }
  plot?: 'line' | 'bar' | 'none'
  barStrategy?: BarStrategy
  clipLabels?: boolean
  zeroLine?: boolean
  minLayoutSize?: Offset4Side
  renderBoundsPadding?: Offset4Side
  stepProbe?: StepProbe
  onRender?: (state: ProbeState) => void
}

export class LabelsChart extends UniversalChart {

  readonly labelsX: AutoLabels | null = null
  readonly labelsY: AutoLabels | null = null
  readonly ticksX: BaseTicks | null = null
  readonly ticksY: BaseTicks | null = null

  private line: AutoLine | null = null
  private bar: Bar | null = null
  private zeroTicks: TicksByValues | null = null

  constructor(private setup: LabelsChartSetup) {
    super({
      layoutVariant: setup.layoutVariant ?? 'vertical',
      renderManager: globalChartRenderManagerSteps4,
      renderBoundsPadding: setup.renderBoundsPadding,
    })

    const clipBottom = setup.clipLabels ? new ChartClip('bottom') : null
    const clipLeft = setup.clipLabels ? new ChartClip('left') : null

    if (setup.x) {
      this.labelsX = new AutoLabels('horizontal', setup.x)
      if (clipBottom) this.labelsX.clipBy(clipBottom)
    }

    if (setup.y) {
      this.labelsY = new AutoLabels('vertical', setup.y)
      if (clipLeft) this.labelsY.clipBy(clipLeft)
    }

    this.ticksX = this.createTicks('horizontal', setup.ticks?.x ?? 'none', this.labelsX)
    this.ticksY = this.createTicks('vertical', setup.ticks?.y ?? 'none', this.labelsY)

    // Ось по нулю Axis рисовать не умеет — только по границам layout. Обходной путь:
    // тик по значению 0 на всю ширину области.
    if (setup.zeroLine) {
      this.zeroTicks = new TicksByValues('vertical', { classes: 'zero-line' })
      this.zeroTicks.setTicks([0])
    }

    if (this.ticksY) this.addPlot(this.ticksY, 'ticks')
    if (this.ticksX) this.addPlot(this.ticksX, 'ticks')
    if (this.zeroTicks) this.addPlot(this.zeroTicks, 'ticks')

    if (setup.plot === 'bar') {
      this.bar = new Bar({ classes: 'debug-bars', strategy: setup.barStrategy ?? { type: 'grouped', padding: 0.25 } })
      this.addPlot(this.bar, 'plot')
    } else if (setup.plot !== 'none') {
      this.line = new AutoLine({ classes: 'main-line', smoothingMethod: 'monotone' })
      this.addPlot(this.line, 'plot')
    }

    if (setup.axes && Object.keys(setup.axes).length > 0) this.addPlot(new Axis(setup.axes), 'ticks')

    if (this.labelsX) this.addSlot(setup.xSlot ?? 'bottom', this.labelsX, 'labels')
    if (this.labelsY) this.addSlot(setup.ySlot ?? 'left', this.labelsY, 'labels')

    const defs = [clipBottom, clipLeft].filter(x => x !== null)
    if (defs.length > 0) this.addDefs(...defs)

    if (setup.onRender) this.addPlot(new RenderProbe((space, overflow, full) => setup.onRender?.({
      bounds: { minX: space.bounds.minX, maxX: space.bounds.maxX, minY: space.bounds.minY, maxY: space.bounds.maxY },
      layout: { ...space.layout },
      overflow: { ...overflow },
      full: { ...full },
      step: setup.stepProbe?.step ?? -1,
      x: readRenderedLabels(this.labelsX, 'horizontal'),
      y: readRenderedLabels(this.labelsY, 'vertical'),
      xTicks: this.ticksX?.getTicks(space).map(tick => tick.value) ?? [],
      yTicks: this.ticksY?.getTicks(space).map(tick => tick.value) ?? [],
    })))

    this.setMinLayoutSize(setup.minLayoutSize ?? { top: 8, right: 8 })
  }

  private createTicks(axis: 'horizontal' | 'vertical', kind: TicksKind, labels: AutoLabels | null) {
    const classes = axis === 'horizontal' ? 'x-grid' : 'y-grid'
    const options = { start: this.setup.ticks?.start, end: this.setup.ticks?.end, classes }

    if (kind === 'labels') return labels ? new LiveTicksByLabels(labels, options) : null
    if (kind === 'values') return new LiveTicksByValues(axis, options)
    return null
  }

  setTickOffsets(axis: 'horizontal' | 'vertical', start: number | null, end: number | null) {
    const ticks = axis === 'horizontal' ? this.ticksX : this.ticksY
    if (ticks instanceof LiveTicksByValues || ticks instanceof LiveTicksByLabels) ticks.setOffsets(start, end)
    this.dataDidChange()
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

  // updateOptions сам по себе перерисовку не заказывает — нужен dataDidChange.
  setXLabels(options: LabelsOptions) {
    this.labelsX?.updateOptions(options)
    this.dataDidChange()
    return this
  }

  setYLabels(options: LabelsOptions) {
    this.labelsY?.updateOptions(options)
    this.dataDidChange()
    return this
  }

  setTickValues(axis: 'horizontal' | 'vertical', values: number[]) {
    const ticks = axis === 'horizontal' ? this.ticksX : this.ticksY
    if (ticks instanceof TicksByValues) ticks.setTicks(values)
    this.dataDidChange()
    return this
  }
}
