import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { ChartTooltip, TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { Highlight } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/highlight/Highlight'
import { HorizontalLine } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/lines/HorizontalLine'
import { VerticalLine } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/lines/VerticalLine'
import { ZoomChartComponent } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/zoomChartComponent/ZoomChartComponent'
import { Selection } from '@/shared/uiKit/chart/universalChart/interaction/core/Selection'
import { AutoMarkerDatum, AutoMarkers } from '@/shared/uiKit/chart/universalChart/plot/markers/autoMarkers/AutoMarkers'
import { AutoMarkerHit } from '@/shared/uiKit/chart/universalChart/plot/markers/autoMarkers/AutoMarkersInteractionSource'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { EventEmitter } from '@/shared/uiKit/chart/universalChart/utils/EventEmitter'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import { buildChartScaffold, clipAndMask, resetChartView } from './chartScaffold'
import { ComponentToggle } from './ComponentToggle'
import { HitProbe } from './HitProbe'

// label — не часть AutoMarkerDatum: если он доехал до hit.datum, значит datum — точная исходная ссылка,
// а не normalized spread-копия
export type ScatterPoint = AutoMarkerDatum & { readonly label: string }

export type ScatterHit = AutoMarkerHit<ScatterPoint>

export type ScatterConfig = {
  maxDistance: number
  // Тот же набор точек, но с другим size при неизменном количестве — сценарий известного бага
  // переиспользования маркеров: BaseMarkers переиспользует Marker-инстансы, и без починки DOM-радиус отставал бы
  bigSize: boolean
  highlight: boolean
  verticalLine: boolean
  horizontalLine: boolean
  tooltip: boolean
}

export function defaultScatterConfig(): ScatterConfig {
  return {
    maxDistance: 12,
    bigSize: false,
    highlight: true,
    verticalLine: true,
    horizontalLine: true,
    tooltip: true,
  }
}

// A — внутри visual radius; B — вне radius, внутри maxDistance; C — radius больше maxDistance (без мёртвого
// края); D/E — точное перекрытие: побеждает более поздний по порядку source
function points(bigSize: boolean): ScatterPoint[] {
  const scale = bigSize ? 2 : 1
  return [
    { x: 1, y: 500, size: 5 * scale, label: 'A: внутри радиуса' },
    { x: 4, y: 470, size: 4 * scale, label: 'B: вне радиуса, внутри maxDistance' },
    { x: 7, y: 520, size: 26 * scale, label: 'C: радиус больше maxDistance' },
    { x: 10, y: 500, size: 6 * scale, label: 'D: перекрытие (раньше по порядку)' },
    { x: 10, y: 500, size: 6 * scale, label: 'E: перекрытие (позже — побеждает)' },
  ]
}

// Один AutoMarkers, один nearestPoint() selection обслуживает Highlight, ChartTooltip
// и обе направляющие одновременно
export class ScatterChart extends UniversalChart {

  readonly controller: InteractionController

  // Публичный: секция сверяет ctx.isHighlighted(hit, chart.highlight), демонстрируя, что Highlight
  // и ChartTooltip читают один и тот же selection
  readonly highlight: Highlight<ScatterHit>

  readonly onHit = new EventEmitter<readonly ScatterHit[]>()
  readonly onTooltip = new EventEmitter<TooltipCtx<ScatterHit> | null>()

  private readonly scatter: AutoMarkers<ScatterPoint>
  private readonly maskRoot: Element

  private readonly verticalLine: VerticalLine
  private readonly horizontalLine: HorizontalLine
  private readonly tooltip: ChartTooltip<ScatterHit>
  private readonly probe: HitProbe<ScatterHit>
  private readonly toggles: ComponentToggle

  private config: ScatterConfig
  private selection: Selection<ScatterHit>
  private currentPoints: ScatterPoint[] = []

  // updateOptions() сбрасывает applied-состояние Highlight/ChartTooltip, поэтому пересобирать selection
  // нужно только при реальном изменении геометрии, не на каждый чекбокс-тумблер (ср. BarChart/HighlightChart)
  private lastGeometryKey = ''

  constructor(init: { config?: Partial<ScatterConfig>, zoom?: boolean } = {}) {
    super({ layoutVariant: 'vertical', renderManager: globalChartRenderManagerSteps4 })

    this.config = { ...defaultScatterConfig(), ...init.config }

    const { clip, mask, maskRoot } = clipAndMask()
    this.maskRoot = maskRoot

    this.scatter = new AutoMarkers<ScatterPoint>({ classes: 'scatter-markers', targetMasks: [maskRoot] })
    const plotRoot = new PlotGroup().addPlot(this.scatter)

    this.selection = this.scatter.interaction.nearestPoint({ maxDistance: this.config.maxDistance })

    this.highlight = new Highlight({ selection: this.selection, class: 'scatter-highlighted' })
    this.verticalLine = new VerticalLine({ selection: this.selection })
    this.horizontalLine = new HorizontalLine({ selection: this.selection })
    this.tooltip = new ChartTooltip({
      selection: this.selection,
      exposeHighlights: [this.highlight],
      onPositionChange: ctx => this.onTooltip.emit(ctx),
      onHide: () => this.onTooltip.emit(null),
    })
    this.probe = new HitProbe(this.selection, hits => this.onHit.emit(hits))

    this.controller = new InteractionController()
    this.toggles = new ComponentToggle(this.controller)
    if (init.zoom) this.controller.addComponent(new ZoomChartComponent({ chart: this, zoom: true, panDirection: 'horizontal' }))
    this.controller.addComponent(this.probe)

    buildChartScaffold({ chart: this, plotRoot, controller: this.controller, clip, mask })

    this.setRenderBounds({ minX: -1, maxX: 12, minY: 430, maxY: 570 })
    this.applyConfig()
  }

  // Точные ссылки, ушедшие в setMarkers(): datum-равенство hit'а сверяется с этим же массивом
  get points(): readonly ScatterPoint[] {
    return this.currentPoints
  }

  setConfig(config: Partial<ScatterConfig>) {
    this.config = { ...this.config, ...config }
    this.applyConfig()
    return this
  }

  resetView() {
    return resetChartView(this)
  }

  // Читает r напрямую из DOM: единственный способ живьём убедиться, что AutoMarker.render()
  // действительно обновляет радиус переиспользуемого инстанса, а не только cx/cy
  markerDomRadius(index: number): { r: number | null, maskR: number | null } {
    const circle = this.svg.querySelectorAll('.scatter-markers circle')[index] ?? null
    const maskCircle = this.maskRoot.querySelectorAll('circle')[index] ?? null

    return {
      r: circle ? Number(circle.getAttribute('r')) : null,
      maskR: maskCircle ? Number(maskCircle.getAttribute('r')) : null,
    }
  }

  private applyConfig() {
    const geometryKey = `${this.config.maxDistance}:${this.config.bigSize}`

    if (geometryKey !== this.lastGeometryKey) {
      this.lastGeometryKey = geometryKey

      this.currentPoints = points(this.config.bigSize)
      this.scatter.setMarkers(this.currentPoints)

      // Новый maxDistance — новый узел графа: selections immutable
      this.selection = this.scatter.interaction.nearestPoint({ maxDistance: this.config.maxDistance })

      this.highlight.updateOptions({ selection: this.selection, class: 'scatter-highlighted' })
      this.verticalLine.updateOptions({ selection: this.selection })
      this.horizontalLine.updateOptions({ selection: this.selection })
      this.tooltip.updateOptions({
        selection: this.selection,
        exposeHighlights: [this.highlight],
        onPositionChange: ctx => this.onTooltip.emit(ctx),
        onHide: () => this.onTooltip.emit(null),
      })
      this.probe.setSelection(this.selection)
    }

    this.toggles.set(this.highlight, this.config.highlight)
    this.toggles.set(this.verticalLine, this.config.verticalLine)
    this.toggles.set(this.horizontalLine, this.config.horizontalLine)
    this.toggles.set(this.tooltip, this.config.tooltip)

    this.scheduleRender()
  }
}
