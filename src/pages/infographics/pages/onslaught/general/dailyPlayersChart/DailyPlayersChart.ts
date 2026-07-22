import { ref } from 'vue'
import { ChartClip } from '@/shared/uiKit/chart/universalChart/defs/ChartClip'
import { ChartGradient } from '@/shared/uiKit/chart/universalChart/defs/ChartGradient'
import { ChartMask } from '@/shared/uiKit/chart/universalChart/defs/ChartMask'
import { ChartTooltip, type TooltipCtx } from '@/shared/uiKit/chart/universalChart/hover/composableHover/components/chartTooltip/ChartTooltip'
import { VerticalLine } from '@/shared/uiKit/chart/universalChart/hover/composableHover/components/lines/VerticalLine'
import { NearestMarker } from '@/shared/uiKit/chart/universalChart/hover/composableHover/components/nearestMarker/NearestMarker'
import { ComposableHover } from '@/shared/uiKit/chart/universalChart/hover/composableHover/ComposableHover'
import { AutoLabels, type Options as LabelsOptions } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { steppedOverrides } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/steppedGenerator'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { AutoMarkers } from '@/shared/uiKit/chart/universalChart/plot/markers/autoMarkers/AutoMarkers'
import { TicksByLabels } from '@/shared/uiKit/chart/universalChart/ticks/TicksByLabels'
import { TicksByValues } from '@/shared/uiKit/chart/universalChart/ticks/TicksByValues'
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

export class DailyPlayersChart extends UniversalChart {
  readonly tooltipCtx = ref<TooltipCtx | null>(null)

  private readonly line: AutoLine
  private readonly markers: AutoMarkers
  private readonly hover: ComposableHover
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
    const dayTicks = new TicksByValues('horizontal', { start: 0, classes: 'day-ticks' })
    dayTicks.setTicks(Array.from(
      { length: Math.ceil(this.maxX / DAY) + 1 },
      (_, index) => index * DAY,
    ))

    const gradient = new ChartGradient({ classes: 'blue-gradient' })
    this.line = new AutoLine({ classes: 'main-line', area: gradient, smoothingMethod: 'monotone' })
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

    this.hover = new ComposableHover('hover')
      .addComponent(new VerticalLine({
        offset: { end: 0.5, start: -5 },
        position: 'data-point-x',
      }))
      .addComponent(new NearestMarker({
        classes: 'markers',
        markerClasses: 'hover-marker',
        size: 5,
        maskSize: 7,
        targetMasks: [maskMain.root],
        position: 'data-point-x',
      }))
      .addComponent(new ChartTooltip({
        position: 'data-point-x',
        tooltipPivot: 'avg',
        onHide: () => this.tooltipCtx.value = null,
        onPositionChange: ctx => this.tooltipCtx.value = ctx,
      }))

    this
      .addPlot(new TicksByLabels(labelsY, { start: 0 }), 'ticks')
      .addPlot(new TicksByLabels(labelsX, { start: 0, classes: 'week-ticks' }), 'ticks')
      .addPlot(dayTicks, 'ticks')
      .addPlot(plotRoot, 'plot')
      .addPlot(this.markers, 'plot')
      .addSlot('bottom', labelsX, 'labels')
      .addSlot('left', labelsY, 'labels')
      .addPlot(this.hover)
      .addDefs(gradient, clipMain, clipLeft, clipBottom, maskMain)

    this.setRenderBounds({ minX: 0, maxX: this.maxX, minY: 0, maxY: 1 })
    this.setMinLayoutSize({ right: 5, top: 5 })
  }

  setPoints(points: (DailyPlayersChartPoint | null)[]) {
    const linePoints = points.map(point => point ? { x: point.x, y: point.y } : null)
    const visiblePoints = points.filter((point): point is DailyPlayersChartPoint => point !== null)
    const maxY = Math.max(1, ...visiblePoints.map(point => point.y))

    this.line.setPoints(linePoints)
    this.markers.setMarkers(visiblePoints.map(point => ({
      x: point.x,
      y: point.y,
      size: point.isCurrentDay ? 5 : 3,
      maskSize: point.isCurrentDay ? 7 : 5,
      markerClasses: point.isCurrentDay
        ? ['daily-marker', 'current-day-marker']
        : ['daily-marker'],
    })))
    this.hover.setDataSources(linePoints)
    this.setRenderBounds({ maxY: maxY * 1.08 })

    return this
  }

  private getXLabelsOptions(): LabelsOptions {
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
