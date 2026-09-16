import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { ChartClip } from '@/shared/uiKit/chart/universalChart/defs/ChartClip'
import { AutoLabels } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { labelCandidates } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/labelCandidates'
import { InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { ChartTooltip, TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { Highlight } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/highlight/Highlight'
import { HighlightSynchronizer } from '@/shared/uiKit/chart/universalChart/interaction/composable/sync/HighlightSynchronizer'
import { PlotAreaBorder } from '@/shared/uiKit/chart/universalChart/plot/axis/PlotAreaBorder'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { LinePointHit, LineStrokeHit } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLineInteractionSource'
import { TicksByLabels } from '@/shared/uiKit/chart/universalChart/ticks/TicksByLabels'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import { shallowRef } from 'vue'

const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export type BloggerTimeSeriesPoint = {
  x: number
  y: number
  series: string
  seriesIndex: number
}

export type BloggerTimeSeriesHit = LinePointHit<BloggerTimeSeriesPoint>

export type BloggerTimeSeriesState = {
  labels: readonly number[]
  data: readonly (readonly (number | null | undefined)[])[]
  enabledSeries: readonly string[]
  min?: number
  max?: number
  yValues?: readonly number[]
  yIsPercent?: boolean
  smallScreen: boolean
}

type Options = {
  series: readonly string[]
  highlightSync: HighlightSynchronizer
}

export class BloggerTimeSeriesChart extends UniversalChart {

  readonly tooltipCtx = shallowRef<TooltipCtx<BloggerTimeSeriesHit> | null>(null)
  readonly highlight: Highlight<LineStrokeHit<BloggerTimeSeriesPoint>>

  private readonly series: readonly string[]
  private readonly lines: AutoLine<BloggerTimeSeriesPoint>[]
  private readonly labelsX: AutoLabels
  private readonly labelsY: AutoLabels
  private readonly ticksY: TicksByLabels
  private yAxisVisible = false

  constructor(options: Options) {
    super({
      layoutVariant: 'vertical',
      renderManager: globalChartRenderManagerSteps4,
      minLayoutSize: { top: 5, right: 3 },
    })

    this.series = options.series
    this.labelsX = new AutoLabels('horizontal', {
      values: labelCandidates({ step: HOUR }),
      labelForValue: formatDateHHMM,
      padding: 5,
      labelOffset: 7,
      strategy: 'classic',
    })
    this.labelsY = new AutoLabels('vertical', {
      values: labelCandidates({ values: [] }),
      padding: { clip: 8, flow: 4 },
      labelOffset: 5,
      strategy: 'classic-flow',
    })
    this.ticksY = new TicksByLabels(this.labelsY, { classes: 'value-grid' })

    const clip = new ChartClip('center')
    this.lines = this.series.map((series, index) => new AutoLine<BloggerTimeSeriesPoint>({
      classes: ['blogger-line', `blogger-line-${index}`],
      interactionTag: series,
    }))

    const plotGroup = new PlotGroup(['blogger-lines']).clipBy(clip)
    for (const line of this.lines) plotGroup.addPlot(line)

    const lineInteractions = this.lines[0].interaction
      .union(this.lines[1].interaction)
      .union(this.lines[2].interaction)
      .union(this.lines[3].interaction)
    const selectedPoints = lineInteractions.nearestByAxis('x')
    const hoveredLine = lineInteractions.nearStroke({ maxDistance: Infinity }).nearest()

    this.highlight = new Highlight({ selection: hoveredLine, class: 'highlighted' })
      .syncWith(options.highlightSync)

    const interactionController = new InteractionController()
      .addComponent(this.highlight)
      .addComponent(new ChartTooltip({
        selection: selectedPoints,
        tooltipPivot: 'nearest',
        exposeHighlights: [this.highlight],
        onHide: () => this.tooltipCtx.value = null,
        onPositionChange: ctx => this.tooltipCtx.value = ctx,
      }))

    this
      .addPlot(new PlotAreaBorder({ bottom: 'space' }), 'ticks')
      .addPlot(new TicksByLabels(this.labelsX, { classes: 'time-grid' }), 'ticks')
      .addPlot(plotGroup, 'plot')
      .addSlot('bottom', this.labelsX, 'labels')
      .addPlot(interactionController)
      .addDefs(clip)
  }

  update(state: BloggerTimeSeriesState) {
    const labels = state.labels.filter(Number.isFinite)
    const firstX = labels[0] ?? 0
    const lastX = labels[labels.length - 1] ?? firstX + 1
    const maxX = lastX > firstX ? lastX : firstX + 1
    const spanX = maxX - firstX
    const labelStep = targetLabelStep(spanX) * (state.smallScreen ? 2 : 1)
    const edgeOffset = spanX * (state.smallScreen ? 0.03 : 0.01)

    this.labelsX.updateOptions({
      from: firstX + edgeOffset,
      to: maxX - edgeOffset,
      values: labelCandidates({ step: labelStep }),
      labelForValue: labelStep < DAY ? formatDateHHMM : formatDateDay,
      padding: 5,
      labelOffset: 7,
      strategy: 'classic',
    })

    const enabled = new Set(state.enabledSeries)
    for (let seriesIndex = 0; seriesIndex < this.lines.length; seriesIndex++) {
      const series = this.series[seriesIndex]
      const values = state.data[seriesIndex] ?? []
      const points = state.labels.map((x, index): BloggerTimeSeriesPoint | null => {
        const y = values[index]
        if (!enabled.has(series) || y == null || !Number.isFinite(x) || !Number.isFinite(y)) return null
        return { x, y, series, seriesIndex }
      })
      this.lines[seriesIndex].setPoints(points)
    }

    const values = state.data.flatMap((series, seriesIndex) => enabled.has(this.series[seriesIndex])
      ? series.filter((value): value is number => value != null && Number.isFinite(value))
      : [])
    const dataMin = values.length === 0 ? 0 : Math.min(...values)
    const dataMax = values.length === 0 ? 1 : Math.max(...values)
    const requestedValues = state.yValues?.filter(Number.isFinite) ?? []
    const visibleMin = Math.min(dataMin, ...requestedValues)
    const visibleMax = Math.max(dataMax, ...requestedValues)
    const range = Math.max(visibleMax - visibleMin, Math.abs(visibleMax) * 0.01, 1)
    const minY = state.min ?? visibleMin - range * 0.05
    const maxY = state.max ?? visibleMax + range * 0.05

    this.setYAxisVisible(requestedValues.length > 0)
    if (requestedValues.length > 0) {
      this.labelsY.updateOptions({
        from: minY,
        to: maxY,
        values: labelCandidates({ values: requestedValues }),
        labelForValue: value => state.yIsPercent ? `${value * 100}%` : `${value}`,
        padding: { clip: 8, flow: 4 },
        labelOffset: 5,
        strategy: 'classic-flow',
      })
    }

    this.setRenderBounds({
      minX: firstX,
      maxX,
      minY,
      maxY: maxY > minY ? maxY : minY + 1,
    })
  }

  private setYAxisVisible(visible: boolean) {
    if (visible === this.yAxisVisible) return
    this.yAxisVisible = visible

    if (visible) {
      this.addSlot('left', this.labelsY, 'labels')
      this.addPlot(this.ticksY, 'ticks')
    } else {
      this.removeSlot(this.labelsY)
      this.removePlot(this.ticksY)
    }
  }
}

function targetLabelStep(delta: number) {
  if (delta < MINUTE) return 5
  if (delta < HOUR * 2) return MINUTE * 5
  if (delta < HOUR * 6) return MINUTE * 30
  if (delta < DAY * 2) return HOUR
  if (delta < DAY * 5) return HOUR * 12
  return DAY
}

function pad(value: number) {
  return value.toString().padStart(2, '0')
}

export function formatDateFull(timestamp: number) {
  const date = new Date(timestamp * 1000)
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear().toString().slice(-2)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function formatDateHHMM(timestamp: number) {
  const date = new Date(timestamp * 1000)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDateDay(timestamp: number) {
  const date = new Date(timestamp * 1000)
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}`
}
