import { ChartClip } from '@/shared/uiKit/chart/universalChart/defs/ChartClip'
import { ChartGradient } from '@/shared/uiKit/chart/universalChart/defs/ChartGradient'
import { ChartMask } from '@/shared/uiKit/chart/universalChart/defs/ChartMask'
import { AutoLabels, Options as LabelsOptions } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { steppedOverrides } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/steppedGenerator'
import { ChartTooltip, TooltipCtx } from '@/shared/uiKit/chart/universalChart/plot/hover/composableHover/components/chartTooltip/ChartTooltip'
import { VerticalLine } from '@/shared/uiKit/chart/universalChart/plot/hover/composableHover/components/lines/VerticalLine'
import { NearestMarker } from '@/shared/uiKit/chart/universalChart/plot/hover/composableHover/components/nearestMarker/NearestMarker'
import { ComposableHover } from '@/shared/uiKit/chart/universalChart/plot/hover/composableHover/ComposableHover'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { TicksByLabels } from '@/shared/uiKit/chart/universalChart/ticks/TicksByLabels'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import { ref } from 'vue'


const MINUTE = 1 * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const WEEK = DAY * 7


class BaseChart extends UniversalChart {
  tooltipCtx = ref<TooltipCtx | null>(null)

  private line: AutoLine
  private hover: ComposableHover

  constructor(protected seasonInterval: { start: Date, end: Date }) {
    super({ layoutVariant: 'vertical' })

    const clipMain = new ChartClip('center')
    const clipLeft = new ChartClip('left')
    const clipBottom = new ChartClip('bottom')
    const maskMain = new ChartMask('center')

    const labelsX = new AutoLabels('horizontal', this.getXLabelsOptions()).clipBy(clipBottom)
    const labelsY = new AutoLabels('vertical', this.getYLabelsOptions()).clipBy(clipLeft)

    const gradient = new ChartGradient({ classes: 'blue-gradient' })
    this.line = new AutoLine({ classes: 'main-line', area: gradient, smoothingMethod: 'monotone' })


    const plotRoot = new PlotGroup()
      .addPlot(this.line.maskBy(maskMain))
      .clipBy(clipMain)

    this.hover = new ComposableHover('hover')
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

    this
      .addPlot(new TicksByLabels(labelsX, { start: 0 }), 'ticks')
      .addPlot(new TicksByLabels(labelsY, { start: 0 }), 'ticks')
      .addPlot(plotRoot, 'plot')
      .addSlot('bottom', labelsX, 'labels')
      .addSlot('left', labelsY, 'labels')
      .addPlot(this.hover)
      .addDefs(gradient, clipMain, clipLeft, clipBottom, maskMain)

    this.setRenderBounds({ minX: 0 })
    this.setMinLayoutSize({ right: 5, top: 5 })
  }

  setPoints(points: ({ x: number, y: number } | null)[]) {
    this.line.setPoints(points)
    this.hover.setDataSources(points)
  }

  protected getXLabelsOptions(): LabelsOptions {

    function label(value: number, step: number) {
      const day = 1 + value / DAY
      const week = 1 + value / WEEK
      if (step == 0) return `${day} день`
      if (step == 1) return `${day}`
      if (step == 2) return `${day}`
      if (step == 3) return `${week} неделя`
      if (step == 4) return `${week} нед.`
      return `${value} | ${step}`
    }

    return {
      padding: 10,
      labelOffset: 5,
      labelForValue: (v, s) => label(v, s),
      values: [
        ...steppedOverrides({
          step: [DAY, DAY, 2 * DAY, WEEK, WEEK],
        })
      ],
      strategy: { type: 'interval', offset: 3 },
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