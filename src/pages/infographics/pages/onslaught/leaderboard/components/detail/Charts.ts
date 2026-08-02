import { ChartClip } from '@/shared/uiKit/chart/universalChart/defs/ChartClip'
import { ChartGradient } from '@/shared/uiKit/chart/universalChart/defs/ChartGradient'
import { ChartMask } from '@/shared/uiKit/chart/universalChart/defs/ChartMask'
import { AutoLabels, Options as LabelsOptions, TickSource } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { steppedGenerator, steppedOverrides } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/steppedGenerator'
import { ChartTooltip, TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { VerticalLine } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/lines/VerticalLine'
import { NearestMarker } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/nearestMarker/NearestMarker'
import { InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { AutoLineArea } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLineArea'
import { TicksByLabels } from '@/shared/uiKit/chart/universalChart/ticks/TicksByLabels'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import { ref } from 'vue'
import { RectangleArea } from '@/shared/uiKit/chart/universalChart/plot/area/RectangleArea'
import { ChartRawPattern } from '@/shared/uiKit/chart/universalChart/defs/ChartRawPattern'
import { ZoomChartComponent } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/zoomChartComponent/ZoomChartComponent'
import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { HoverSynchronizer } from '@/shared/uiKit/chart/universalChart/interaction/composable/sync/HoverSynchronizer'
import { BoundsSynchronizer } from '@/shared/uiKit/chart/universalChart/interaction/composable/sync/BoundsSynchronizer'
import { CallbackComponent } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/callback/CallbackComponent'


const MINUTE = 1 * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const WEEK = DAY * 7


class BaseChart extends UniversalChart {
  tooltipCtx = ref<TooltipCtx | null>(null)

  private readonly line: AutoLine
  private readonly minMaxArea: AutoLineArea
  private readonly interactionController: InteractionController
  private readonly restrictionArea: RectangleArea
  private readonly labelsX: AutoLabels
  private readonly maxX: number

  public readonly callback = new CallbackComponent()

  constructor(protected seasonInterval: { start: Date, end: Date }, sync: { hover: HoverSynchronizer, bounds: BoundsSynchronizer }) {
    super({ layoutVariant: 'vertical', renderManager: globalChartRenderManagerSteps4 })

    const start = Math.floor(seasonInterval.start.getTime() / 1000)
    const end = Math.floor(seasonInterval.end.getTime() / 1000)
    const delta = end - start
    const roundedToWeeks = Math.ceil(delta / WEEK) * WEEK
    this.maxX = Math.max(roundedToWeeks, delta + HOUR)

    const clipMain = new ChartClip('center', { top: -1, bottom: -1 })
    const clipLeft = new ChartClip('left')
    const clipBottom = new ChartClip('bottom')
    const maskMain = new ChartMask('center', { top: -1, bottom: -1 })

    this.labelsX = new AutoLabels('horizontal', this.getXLabelsOptions()).clipBy(clipBottom)
    const labelsY = new AutoLabels('vertical', this.getYLabelsOptions()).clipBy(clipLeft)

    const gradient = new ChartGradient({ classes: 'blue-gradient' })
    this.line = new AutoLine({ classes: 'main-line', area: gradient, smoothingMethod: 'monotone' })
    this.minMaxArea = new AutoLineArea({ classes: 'minmax-area', smoothingMethod: 'monotone' })

    const pattern = new ChartRawPattern()
      .setContent('<path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" class="diagonal-fill-pattern" />',
        { width: 4, height: 4 })
      .addAttribute('patternTransform', 'scale(1.5)')

    this.restrictionArea = new RectangleArea('restriction-area', { layoutLimited: true, padding: { right: 0.5 } }).fillByPattern(pattern)

    const plotRoot = new PlotGroup()
      .addPlot(this.minMaxArea)
      .addPlot(this.line)
      .addPlot(this.restrictionArea)
      .maskBy(maskMain)
      .clipBy(clipMain)

    this.interactionController = new InteractionController('hover')
      .addComponent(new ZoomChartComponent({
        chart: this,
        zoom: true,
        panDirection: 'horizontal',
        autoFitFollow: true,
        boundsSync: sync.bounds,
        limits: {
          minX: 0,
          maxX: this.maxX,
          maxDeltaX: this.maxX,
          minDeltaX: 60 * 60 * 12,
          elastic: true
        },
      }))
      .addComponent(new VerticalLine({
        offset: { end: 0.5, start: -5 },
        position: 'data-point-x',
        hoverSync: sync.hover,
      }))
      .addComponent(new NearestMarker({
        classes: 'markers',
        markerClasses: 'hover-marker',
        size: 4,
        maskSize: 6,
        classesForDataSource: ['m1', 'm2'],
        targetMasks: [maskMain.root],
        position: 'data-point-x',
        hoverSync: sync.hover,
      }))
      .addComponent(new ChartTooltip({
        position: 'data-point-x',
        tooltipPivot: 'avg',
        onHide: () => this.tooltipCtx.value = null,
        onPositionChange: ctx => this.tooltipCtx.value = ctx,
        hoverSync: sync.hover,
      }))
      .addComponent(sync.hover)
      .addComponent(this.callback)

    this
      .addPlot(new TicksByLabels(labelsY), 'ticks')
      .addPlot(new TicksByLabels(this.labelsX, { classes: 'time-grid' }), 'ticks')
      .addPlot(plotRoot, 'plot')
      .addSlot('bottom', this.labelsX, 'labels')
      .addSlot('left', labelsY, 'labels')
      .addPlot(this.interactionController)
      .addDefs(gradient, clipMain, clipLeft, clipBottom, maskMain, pattern)

    this.recalculateRestrictionArea()
    this.setRenderBounds({ minX: 0, maxX: this.maxX })
    this.setMinLayoutSize({ right: 5, top: 5 })
  }

  setPoints(points: ({ x: number, y: number } | null)[]) {
    this.line.setPoints(points)
    this.interactionController.setDataSources(points)
    this.recalculateRestrictionArea()
    return this
  }

  setMinMaxPoints(max: ({ x: number, y: number } | null)[], min: ({ x: number, y: number } | null)[]) {
    this.minMaxArea.setPoints(max, min)
    return this
  }

  setViewInterval(interval: { start: Date, end: Date } | null) {
    if (!interval) {
      this.setRenderBounds({ minX: 0, maxX: this.maxX })
      return
    }

    const seasonStart = this.seasonInterval.start.getTime()
    this.setRenderBounds({
      minX: (interval.start.getTime() - seasonStart) / 1000,
      maxX: (interval.end.getTime() - seasonStart) / 1000,
    })
  }

  protected recalculateRestrictionArea() {
    const start = Math.floor(this.seasonInterval.start.getTime() / 1000)
    const end = Math.floor(this.seasonInterval.end.getTime() / 1000)
    const duration = end - start

    if (this.maxX > duration) {
      this.restrictionArea.setPoints(
        { x: Math.max(duration, this.line.getBounds().maxX), y: -Infinity },
        { x: this.maxX, y: Infinity })
    }
  }

  protected getXLabelsOptions(): LabelsOptions {
    const duration = Math.floor(this.seasonInterval.end.getTime() / 1000) - Math.floor(this.seasonInterval.start.getTime() / 1000)

    const hourTicks: TickSource = { gen: steppedGenerator({ step: HOUR }), minPixelSpacing: 6, classes: 'hour-ticks', to: duration }
    const dayTicks: TickSource = { gen: steppedGenerator({ step: DAY }), minPixelSpacing: 5, classes: 'day-ticks', to: duration }
    const dayLabels: TickSource = { gen: 'labels', classes: 'day-ticks' }
    const weekLabels: TickSource = { gen: 'labels', classes: 'week-ticks' }

    const steps = [
      [DAY, (v: number) => `${1 + v / DAY} день`, [dayLabels, hourTicks]],
      [DAY, (v: number) => `${1 + v / DAY}`, [dayLabels, hourTicks]],
      [WEEK, (v: number) => `${1 + v / WEEK} неделя`, [weekLabels, dayTicks, hourTicks]],
      [WEEK, (v: number) => `${1 + v / WEEK} нед.`, [weekLabels, dayTicks, hourTicks]],
      [WEEK, (v: number) => `${1 + v / WEEK} н.`, [weekLabels, dayTicks, hourTicks]],
      [2 * WEEK, (v: number) => `${1 + v / WEEK} – ${2 + v / WEEK} нед.`, [weekLabels, dayTicks]],
      [2 * WEEK, (v: number) => `${1 + v / WEEK} – ${2 + v / WEEK}`, [weekLabels, dayTicks]],
      [12 * WEEK, (v: number) => `${1 + v / WEEK} – ${1 + (v + 4 * WEEK) / WEEK}`, [weekLabels, dayTicks]],
    ] as [step: number, labelForValue: (v: number) => string, ticks: TickSource[]][]

    return {
      padding: 10,
      labelOffset: 5,
      values: steppedOverrides({
        step: steps.map(([step, labelForValue, ticks]) => ({ step, labelForValue, ticks }))
      }),
      strategy: { type: 'interval', fit: true, offset: 3 },
      from: 0,
      to: this.maxX
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
      strategy: 'classic-flow',
    }
  }
}


export class ScoreChart extends BaseChart {

  constructor(seasonInterval: { start: Date, end: Date }, sync: { hover: HoverSynchronizer, bounds: BoundsSynchronizer }) {
    super(seasonInterval, sync)
  }
}


export class BattlesChart extends BaseChart {

  constructor(seasonInterval: { start: Date, end: Date }, sync: { hover: HoverSynchronizer, bounds: BoundsSynchronizer }) {
    super(seasonInterval, sync)
  }
}
