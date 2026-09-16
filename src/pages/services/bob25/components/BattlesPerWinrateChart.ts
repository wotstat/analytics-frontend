import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { ChartClip } from '@/shared/uiKit/chart/universalChart/defs/ChartClip'
import { ChartShadowFilter } from '@/shared/uiKit/chart/universalChart/defs/ChartShadowFilter'
import { AutoLabels } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { labelCandidates } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/labelCandidates'
import { InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { ChartTooltip, TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { Highlight } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/highlight/Highlight'
import { VerticalLine } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/lines/VerticalLine'
import { HoverSynchronizer } from '@/shared/uiKit/chart/universalChart/interaction/composable/sync/HoverSynchronizer'
import { PlotAreaBorder } from '@/shared/uiKit/chart/universalChart/plot/axis/PlotAreaBorder'
import { Bar } from '@/shared/uiKit/chart/universalChart/plot/bar/Bar'
import { BarItemHit } from '@/shared/uiKit/chart/universalChart/plot/bar/BarInteractionSource'
import { TicksByLabels } from '@/shared/uiKit/chart/universalChart/ticks/TicksByLabels'
import { TicksByValues } from '@/shared/uiKit/chart/universalChart/ticks/TicksByValues'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { shallowRef } from 'vue'

export type BattlesPerWinrateHit = BarItemHit<number>

type Options = {
  color: string
  hoverSync: HoverSynchronizer
}

export class BattlesPerWinrateChart extends UniversalChart {

  readonly tooltipCtx = shallowRef<TooltipCtx<BattlesPerWinrateHit> | null>(null)

  private readonly labelsX: AutoLabels
  private readonly bar: Bar<number>

  constructor(options: Options) {
    super({
      layoutVariant: 'vertical',
      renderManager: globalChartRenderManagerSteps4,
      minLayoutSize: { top: 5, right: 12, left: 12 },
    })

    const clip = new ChartClip('center')
    const shadow = new ChartShadowFilter({ color: options.color, blurRadius: 5 })
    const highlightedShadow = new ChartShadowFilter({ color: options.color, blurRadius: 7, strength: 1.3 })

    this.labelsX = new AutoLabels('horizontal', {
      values: labelCandidates({ values: [] }),
      ticks: { values: [25, 50, 75] },
      labelForValue: value => `${value}%`,
      strategy: 'classic',
      padding: 5,
      labelOffset: 11,
    })
    this.bar = new Bar<number>({
      classes: 'winrate-bars',
      strategy: {
        type: 'grouped',
        padding: 0.28,
      },
    })
      .filterBy(shadow)
      .clipBy(clip)

    const selectedBar = this.bar.interaction.contains({
      hitArea: 'vertical',
      gaps: 'nearest',
      groupGaps: 'nearest',
    })
    const syncedBar = selectedBar.withInput(options.hoverSync)
    const interactionController = new InteractionController()
      .addComponent(new VerticalLine({
        selection: syncedBar,
        classes: 'winrate-hover-line',
      }))
      .addComponent(new ChartTooltip({
        selection: selectedBar,
        tooltipPivot: 'avg',
        onHide: () => this.tooltipCtx.value = null,
        onPositionChange: ctx => this.tooltipCtx.value = ctx,
      }))
      .addComponent(new Highlight({
        selection: selectedBar,
        class: 'highlighted',
        onHighlight: target => highlightedShadow.apply(target),
        onDehighlight: target => highlightedShadow.remove(target),
      }))
      .addComponent(options.hoverSync)

    const centerTick = new TicksByValues('horizontal', { classes: 'winrate-center-grid', start: 8 })
    centerTick.setTicks([50])

    this
      .addPlot(new PlotAreaBorder({ bottom: 'space' }), 'ticks')
      .addPlot(new TicksByLabels(this.labelsX, { classes: 'winrate-grid', start: 8 }), 'ticks')
      .addPlot(centerTick, 'ticks')
      .addSlot('bottom', this.labelsX, 'labels')
      .addPlot(this.bar, 'plot')
      .addPlot(interactionController)
      .addDefs(clip, shadow, highlightedShadow)
  }

  setData(values: readonly number[]) {
    const categories = values.map((_, index) => index)
    const labels = categories.filter(value => value > 0 && value < 100 && value % 25 === 0)

    this.labelsX.updateOptions({
      from: 0,
      to: Math.max(0, values.length - 1),
      values: labelCandidates({ values: labels }),
      ticks: { values: [25, 50, 75] },
      labelForValue: value => `${value}%`,
      strategy: 'classic',
      padding: 5,
      labelOffset: 11,
    })
    this.bar.setData({ categories, datasets: [{ values }] })

    const maxValue = values.length === 0 ? 1 : Math.max(...values)
    this.setRenderBounds({
      minX: 0,
      maxX: Math.max(1, values.length),
      minY: 0,
      maxY: maxValue > 0 ? maxValue * 1.08 : 1,
    })
  }
}
