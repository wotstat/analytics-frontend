import { ChartClip } from '@/shared/uiKit/chart/universalChart/defs/ChartClip'
import { ChartGradient } from '@/shared/uiKit/chart/universalChart/defs/ChartGradient'
import { ChartMask } from '@/shared/uiKit/chart/universalChart/defs/ChartMask'
import { AutoLabels, Options as LabelsOptions } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { steppedOverrides } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/steppedGenerator'
import { ChartTooltip, TooltipCtx } from '@/shared/uiKit/chart/universalChart/hover/composableHover/components/chartTooltip/ChartTooltip'
import { VerticalLine } from '@/shared/uiKit/chart/universalChart/hover/composableHover/components/lines/VerticalLine'
import { NearestMarker } from '@/shared/uiKit/chart/universalChart/hover/composableHover/components/nearestMarker/NearestMarker'
import { ComposableHover } from '@/shared/uiKit/chart/universalChart/hover/composableHover/ComposableHover'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { TicksByLabels } from '@/shared/uiKit/chart/universalChart/ticks/TicksByLabels'
import { TicksByValues } from '@/shared/uiKit/chart/universalChart/ticks/TicksByValues'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import { ref } from 'vue'
import { RectangleArea } from '@/shared/uiKit/chart/universalChart/plot/area/RectangleArea'
import { ChartRawPattern } from '@/shared/uiKit/chart/universalChart/defs/ChartRawPattern'
import { ZoomChartComponent } from '@/shared/uiKit/chart/universalChart/hover/composableHover/components/zoomChartComponent/ZoomChartComponent'


const MINUTE = 1 * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const WEEK = DAY * 7


class BaseChart extends UniversalChart {
  tooltipCtx = ref<TooltipCtx | null>(null)

  private line: AutoLine
  private hover: ComposableHover
  private dayTicks: TicksByValues
  private restrictionArea: RectangleArea

  constructor(protected seasonInterval: { start: Date, end: Date }) {
    super({ layoutVariant: 'vertical' })

    const clipMain = new ChartClip('center', { top: -1, bottom: -1 })
    const clipLeft = new ChartClip('left')
    const clipBottom = new ChartClip('bottom')
    const maskMain = new ChartMask('center', { top: -1, bottom: -1 })

    const labelsX = new AutoLabels('horizontal', this.getXLabelsOptions()).clipBy(clipBottom)
    const labelsY = new AutoLabels('vertical', this.getYLabelsOptions()).clipBy(clipLeft)

    const gradient = new ChartGradient({ classes: 'blue-gradient' })
    this.line = new AutoLine({ classes: 'main-line', area: gradient, smoothingMethod: 'monotone' })

    const pattern = new ChartRawPattern()
      .setContent('<path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" class="diagonal-fill-pattern" />',
        { width: 4, height: 4 })
      .addAttribute('patternTransform', 'scale(1.5)')

    this.restrictionArea = new RectangleArea('restriction-area', { layoutLimited: true, padding: { right: 0.5 } }).fillByPattern(pattern)

    const plotRoot = new PlotGroup()
      .addPlot(this.line)
      .addPlot(this.restrictionArea)
      .maskBy(maskMain)
      .clipBy(clipMain)

    this.hover = new ComposableHover('hover')
      .addComponent(new ZoomChartComponent({
        chart: this,
      }))
      .addComponent(new VerticalLine({
        offset: { end: 0.5 },
        position: 'data-point-x',
      }))
      .addComponent(new NearestMarker({
        classes: 'markers',
        markerClasses: 'hover-marker',
        size: 4,
        maskSize: 6,
        classesForDataSource: ['m1', 'm2'],
        targetMasks: [maskMain.root],
        position: 'data-point-x',
      }))
      .addComponent(new ChartTooltip({
        position: 'data-point-x',
        tooltipPivot: 'avg',
        onHide: () => this.tooltipCtx.value = null,
        onPositionChange: ctx => this.tooltipCtx.value = ctx,
      }))

    this.dayTicks = new TicksByValues('horizontal', { start: 0, classes: 'day-ticks' })
    this
      .addPlot(new TicksByLabels(labelsY, { start: 0 }), 'ticks')
      .addPlot(new TicksByLabels(labelsX, { start: 0, classes: 'week-ticks' }), 'ticks')
      .addPlot(this.dayTicks, 'ticks')
      .addPlot(plotRoot, 'plot')
      .addSlot('bottom', labelsX, 'labels')
      .addSlot('left', labelsY, 'labels')
      .addPlot(this.hover)
      .addDefs(gradient, clipMain, clipLeft, clipBottom, maskMain, pattern)

    this.setRenderBounds({ minX: 0 })
    this.setMinLayoutSize({ right: 5, top: 5 })
  }

  setPoints(points: ({ x: number, y: number } | null)[]) {
    this.line.setPoints(points)
    this.hover.setDataSources(points)
    this.recalculateRestrictionArea()
    return this
  }

  setInterval(seasonInterval: { start: Date, end: Date }) {
    const start = Math.floor(seasonInterval.start.getTime() / 1000)
    const end = Math.floor(seasonInterval.end.getTime() / 1000)
    const delta = end - start
    const roundedDelta = Math.ceil(delta / WEEK) * WEEK
    this.setRenderBounds({ minX: 0, maxX: roundedDelta })

    const dayTicks = []
    for (let i = 0; i <= end - start; i += DAY) dayTicks.push(i)
    this.dayTicks.setTicks(dayTicks)

    this.recalculateRestrictionArea()
    return this
  }

  protected recalculateRestrictionArea() {
    const start = Math.floor(this.seasonInterval.start.getTime() / 1000)
    const end = Math.floor(this.seasonInterval.end.getTime() / 1000)
    const duration = end - start
    const weakDuration = Math.ceil(duration / WEEK) * WEEK

    if (weakDuration > duration) {
      this.restrictionArea.setPoints(
        { x: Math.max(duration, this.line.getBounds().maxX), y: -Infinity },
        { x: weakDuration, y: Infinity })
    }
  }

  protected getXLabelsOptions(): LabelsOptions {

    const steps: [number, (v: number) => string][] = [
      [DAY, v => `${1 + v / DAY} день`],
      [DAY, v => `${1 + v / DAY}`],
      // [2 * DAY, v => `${1 + v / DAY}`],
      [WEEK, v => `${1 + v / WEEK} неделя`],
      [WEEK, v => `${1 + v / WEEK} нед.`],
      [WEEK, v => `${1 + v / WEEK} н.`],
      [2 * WEEK, v => `${1 + v / WEEK} – ${2 + v / WEEK} нед.`],
      [2 * WEEK, v => `${1 + v / WEEK} – ${2 + v / WEEK}`],
      [12 * WEEK, v => `${1 + v / WEEK} – ${1 + (v + 4 * WEEK) / WEEK}`],
    ]

    return {
      padding: 10,
      labelOffset: 5,
      values: steppedOverrides({ step: steps.map(s => ({ step: s[0], labelForValue: s[1] })) }),
      strategy: { type: 'interval', fit: true, offset: 3 },
      // onlyFitted: true,
      from: 0,
    }
  }

  protected getYLabelsOptions(): LabelsOptions {
    return {
      labelForValue: (v, step) => `${v}`,
      padding: {
        clip: 10,
        flow: 5,
      },
      labelOffset: 5,
      values: [
        ...steppedOverrides({
          step: [1, 2, 5, 10, 25, 50, 100, 200, 250, 500],
          offset: 0,
        }),
      ],
      onlyFitted: true,
      strategy: 'classic-flow',
    }
  }
}


export class ScoreChart extends BaseChart {

  constructor(seasonInterval: { start: Date, end: Date }) {
    super(seasonInterval)
  }
}


export class BattlesChart extends BaseChart {

  constructor(seasonInterval: { start: Date, end: Date }) {
    super(seasonInterval)
  }
}