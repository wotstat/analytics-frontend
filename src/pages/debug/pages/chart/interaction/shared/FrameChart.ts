import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { ChartTooltip, ChartTooltipOptions, TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { Highlight } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/highlight/Highlight'
import { MarkerOverlay } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/markerOverlay/MarkerOverlay'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { LinePointHit, LineStrokeHit } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLineInteractionSource'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { EventEmitter } from '@/shared/uiKit/chart/universalChart/utils/EventEmitter'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import { baseMarkerOptions, buildChartScaffold, clipAndMask, resetChartView } from './chartScaffold'
import { LinePoint, wavePoints } from './linePoints'

export type FrameHit = LinePointHit<LinePoint>
export type FrameStrokeHit = LineStrokeHit<LinePoint>

function pointsFor(variant: 'a' | 'b'): LinePoint[] {
  const base = wavePoints(16)
  return variant === 'a' ? base : base.map(p => ({ ...p, y: p.y + 60 }))
}

// Один AutoLine внутри PlotGroup — единственный источник bounds чарта, поэтому
// removePlot() естественно (без спецкейсов в source) обрушивает ChartSpace.bounds в пустой, и
// nearestByAxis() перестаёт находить точки сам по себе (Bounds.contains() ложен при minX=Infinity)
export class FrameChart extends UniversalChart {

  readonly controller: InteractionController
  readonly highlight: Highlight<FrameStrokeHit>
  readonly marker: MarkerOverlay<FrameHit>
  readonly tooltip: ChartTooltip<FrameHit>

  readonly onTooltip = new EventEmitter<TooltipCtx<FrameHit> | null>()
  // Тултип вызывает controller.removeComponent(marker) из собственного onShow — marker добавлен в
  // controller позже tooltip, поэтому в момент вызова его renderInteraction этого кадра ещё не выполнялся
  readonly onCallbackRemove = new EventEmitter<void>()

  private readonly plotRoot: PlotGroup
  private readonly maskRoot: Element

  private readonly line: AutoLine<LinePoint>

  private removeMarkerOnShow = false
  private plotAttached = true
  private dataVariant: 'a' | 'b' = 'a'

  constructor() {
    super({ layoutVariant: 'vertical', renderManager: globalChartRenderManagerSteps4 })

    const { clip, mask, maskRoot } = clipAndMask()
    this.maskRoot = maskRoot

    this.line = new AutoLine<LinePoint>({ classes: ['main-line', 's0'], smoothingMethod: 'monotone' })
    this.plotRoot = new PlotGroup().addPlot(this.line)

    const points = this.line.interaction.nearestByAxis('x')
    // Point hit target пуст — у исходной точки нет своего SVG-элемента, поэтому highlight читает
    // stroke: только у него есть реальный target, на котором виден class diff
    const stroke = this.line.interaction.nearStroke({ maxDistance: 60 }).nearest()

    this.highlight = new Highlight({ selection: stroke, class: 'line-highlighted' })
    this.marker = new MarkerOverlay({ ...baseMarkerOptions(maskRoot), selection: points })
    this.tooltip = new ChartTooltip(this.tooltipOptions(points))

    this.controller = new InteractionController('hover')
    this.controller.addComponent(this.highlight)
    this.controller.addComponent(this.tooltip)
    this.controller.addComponent(this.marker)

    buildChartScaffold({ chart: this, plotRoot: this.plotRoot, controller: this.controller, clip, mask })

    this.line.setPoints(pointsFor(this.dataVariant))
  }

  get plotIsAttached(): boolean {
    return this.plotAttached
  }

  setRemoveMarkerOnShow(enabled: boolean) {
    this.removeMarkerOnShow = enabled
  }

  // Тот же X-grid, умеренный сдвиг по Y — курсор остаётся и над тем же bucket nearestByAxis, и в пределах
  // maxDistance ближайшего stroke, поэтому обновление видно сразу у highlight, marker и tooltip одновременно
  changeData() {
    this.dataVariant = this.dataVariant === 'a' ? 'b' : 'a'
    this.line.setPoints(pointsFor(this.dataVariant))
  }

  removeLinePlot() {
    if (!this.plotAttached) return
    this.plotAttached = false
    this.plotRoot.removePlot(this.line)
  }

  // Тот же AutoLine instance, что и до removePlot(): PlotGroup/BasePlotRenderer поддерживают add/remove
  // одного инстанса так же, как InteractionComponent — detach() возвращает плот в чистое
  // «до первого render» состояние, attach() форсирует пересборку DOM на ближайшем render()
  restoreLinePlot() {
    if (this.plotAttached) return
    this.plotAttached = true
    this.plotRoot.addPlot(this.line)
  }

  private tooltipOptions(selection: ChartTooltipOptions<FrameHit>['selection']): ChartTooltipOptions<FrameHit> {
    return {
      selection,
      onShow: ctx => {
        this.onTooltip.emit(ctx)
        if (this.removeMarkerOnShow) {
          this.controller.removeComponent(this.marker)
          this.onCallbackRemove.emit()
        }
      },
      onPositionChange: ctx => this.onTooltip.emit(ctx),
      onHide: () => this.onTooltip.emit(null),
    }
  }

  // detach() снимает marker из components и зовёт его detach() руками — восстановить можно тем же
  // addComponent(), это обычный add/remove той же instance, штатный для InteractionComponent
  restoreMarker() {
    this.controller.addComponent(this.marker)
  }

  markerCount(): number {
    return this.svg.querySelectorAll('.hover-markers .hover-marker').length
  }

  highlightCount(): number {
    return this.svg.querySelectorAll('.line-highlighted').length
  }

  resetView() {
    return resetChartView(this)
  }
}
