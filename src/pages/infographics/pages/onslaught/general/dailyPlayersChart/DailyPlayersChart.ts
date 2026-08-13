import { ref } from 'vue'
import { ChartClip } from '@/shared/uiKit/chart/universalChart/defs/ChartClip'
import { ChartGradient } from '@/shared/uiKit/chart/universalChart/defs/ChartGradient'
import { ChartMask } from '@/shared/uiKit/chart/universalChart/defs/ChartMask'
import { ChartTooltip, type TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { VerticalLine } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/lines/VerticalLine'
import { MarkerOverlay } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/markerOverlay/MarkerOverlay'
import { InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { AutoLabels, type Options as LabelsOptions, type TickSource } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { steppedGenerator, steppedOverrides } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/steppedGenerator'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { type LinePointHit } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLineInteractionSource'
import { AutoMarkers } from '@/shared/uiKit/chart/universalChart/plot/markers/autoMarkers/AutoMarkers'
import { TicksByLabels } from '@/shared/uiKit/chart/universalChart/ticks/TicksByLabels'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'

const DAY = 24 * 60 * 60
const WEEK = 7 * DAY

export type DailyPlayersChartPoint = {
  x: number
  y: number
  isCurrentDay: boolean
}

export type DailyPlayersHit = LinePointHit<DailyPlayersChartPoint>

export class DailyPlayersChart extends UniversalChart {
  readonly tooltipCtx = ref<TooltipCtx<DailyPlayersHit> | null>(null)

  private readonly line: AutoLine<DailyPlayersChartPoint>
  private readonly markers: AutoMarkers
  private readonly interactionController: InteractionController
  private readonly maxX: number

  constructor(seasonLength: number) {
    super({ layoutVariant: 'vertical', renderManager: globalChartRenderManagerSteps4 })

    this.maxX = Math.ceil(seasonLength) * DAY

    const clipMain = new ChartClip('center', { top: -1, bottom: -1 })
    const clipLeft = new ChartClip('left')
    const clipBottom = new ChartClip('bottom')
    const maskMain = new ChartMask('center', { top: -1, bottom: -1 })

    const labelsX = new AutoLabels('horizontal', this.getXLabelsOptions()).clipBy(clipBottom)
    const labelsY = new AutoLabels('vertical', this.getYLabelsOptions()).clipBy(clipLeft)

    const gradient = new ChartGradient({ classes: 'blue-gradient' })
    this.line = new AutoLine<DailyPlayersChartPoint>({ classes: 'main-line', area: gradient, smoothingMethod: 'monotone' })
    this.markers = new AutoMarkers({
      classes: 'daily-markers',
      targetMasks: [maskMain.root],
      size: 3,
      maskSize: 5,
    })

    const plotRoot = new PlotGroup()
      .addPlot(this.line)
      .maskBy(maskMain)
      .clipBy(clipMain)

    const linePoints = this.line.interaction.nearestByAxis('x')

    this.interactionController = new InteractionController('interaction')
      .addComponent(new VerticalLine({
        offset: { end: 0.5, start: -5 },
        selection: linePoints,
      }))
      .addComponent(new MarkerOverlay({
        classes: 'markers',
        markerClasses: 'hover-marker',
        size: 5,
        maskSize: 7,
        targetMasks: [maskMain.root],
        selection: linePoints,
      }))
      .addComponent(new ChartTooltip({
        selection: linePoints,
        tooltipPivot: 'avg',
        onHide: () => this.tooltipCtx.value = null,
        onPositionChange: ctx => this.tooltipCtx.value = ctx,
      }))

    this
      .addPlot(new TicksByLabels(labelsY), 'ticks')
      .addPlot(new TicksByLabels(labelsX, { classes: 'time-grid' }), 'ticks')
      .addPlot(plotRoot, 'plot')
      .addPlot(this.markers, 'plot')
      .addSlot('bottom', labelsX, 'labels')
      .addSlot('left', labelsY, 'labels')
      .addPlot(this.interactionController)
      .addDefs(gradient, clipMain, clipLeft, clipBottom, maskMain)

    this.setRenderBounds({ minX: 0, maxX: this.maxX, minY: 0, maxY: 1 })
    this.setMinLayoutSize({ right: 5, top: 5 })
  }

  setPoints(points: (DailyPlayersChartPoint | null)[]) {
    const visiblePoints = points.filter((point): point is DailyPlayersChartPoint => point !== null)
    const maxY = Math.max(1, ...visiblePoints.map(point => point.y))

    this.line.setPoints(points)
    this.markers.setMarkers(visiblePoints.map(point => ({
      x: point.x,
      y: point.y,
      size: point.isCurrentDay ? 5 : 3,
      maskSize: point.isCurrentDay ? 7 : 5,
      markerClasses: point.isCurrentDay
        ? ['daily-marker', 'current-day-marker']
        : ['daily-marker'],
    })))
    this.setRenderBounds({ maxY: maxY * 1.08 })

    return this
  }

  private getXLabelsOptions(): LabelsOptions {
    const dayTicks: TickSource = { gen: steppedGenerator({ step: DAY }), minPixelSpacing: 5, classes: 'day-ticks' }

    const steps: [number, (value: number) => string][] = [
      [WEEK, value => `${1 + value / WEEK} неделя`],
      [WEEK, value => `${1 + value / WEEK} нед.`],
      [WEEK, value => `${1 + value / WEEK} н.`],
      [2 * WEEK, value => `${1 + value / WEEK} – ${2 + value / WEEK} нед.`],
      [2 * WEEK, value => `${1 + value / WEEK} – ${2 + value / WEEK}`],
      [12 * WEEK, value => `${1 + value / WEEK} – ${1 + (value + 4 * WEEK) / WEEK}`],
    ]

    return {
      padding: 10,
      labelOffset: 5,
      values: steppedOverrides({
        step: steps.map(step => ({ step: step[0], labelForValue: step[1] })),
        ticks: [{ gen: 'labels', classes: 'week-ticks' }, dayTicks],
      }),
      strategy: { type: 'interval', fit: true, offset: 3 },
      from: 0,
      to: this.maxX,
    }
  }

  private getYLabelsOptions(): LabelsOptions {
    const format = (value: number) => Math.abs(value) >= 10_000
      ? `${Math.round(value / 1000)}k`
      : value.toFixed()

    return {
      labelForValue: value => format(value),
      padding: {
        clip: 10,
        flow: 5,
      },
      labelOffset: 5,
      values: steppedOverrides({
        step: [
          1, 2, 5, 10, 20, 50,
          100, 200, 500,
          1000, 2000, 5000,
          10000, 20000, 50000,
          100000,
        ],
        offset: 0,
      }),
      onlyFitted: true,
      strategy: 'classic-flow',
    }
  }
}
