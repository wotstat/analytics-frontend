import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { HorizontalLine } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/lines/HorizontalLine'
import { VerticalLine } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/lines/VerticalLine'
import { MarkerOverlay, MarkerOverlayOptions } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/markerOverlay/MarkerOverlay'
import { ZoomChartComponent } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/zoomChartComponent/ZoomChartComponent'
import { Selection } from '@/shared/uiKit/chart/universalChart/interaction/core/Selection'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { LinePointHit } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLineInteractionSource'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { EventEmitter } from '@/shared/uiKit/chart/universalChart/utils/EventEmitter'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import { baseMarkerOptions, buildChartScaffold, clipAndMask, resetChartView } from './chartScaffold'
import { ComponentToggle } from './ComponentToggle'
import { HitProbe } from './HitProbe'
import { LinePoint } from './linePoints'

export type LinePointsHit = LinePointHit<LinePoint>

export type LinePointsConfig = {
  axis: 'x' | 'y'
  maxAxisDistance: number | null
  verticalLine: boolean
  horizontalLine: boolean
  marker: boolean
}

export function defaultLinePoints(): LinePointsConfig {
  return { axis: 'x', maxAxisDistance: null, verticalLine: true, horizontalLine: false, marker: true }
}

type Init = {
  points?: (LinePoint | null)[]
  config?: Partial<LinePointsConfig>
  smoothingMethod?: 'monotone' | 'smooth'
  zoom?: boolean
}

// Одна линия, и все overlay считают по её собственному selection
// line.interaction.nearestByAxis(). Source один намеренно — это изолирует edge cases одиночной линии;
// union совместимых линий закрывает MultiLineChart
export class LinePointsChart extends UniversalChart {

  readonly controller: InteractionController
  readonly zoomComponent: ZoomChartComponent
  readonly onHits = new EventEmitter<readonly LinePointsHit[]>()

  private readonly line: AutoLine<LinePoint>
  private readonly maskRoot: Element
  private readonly verticalLine: VerticalLine
  private readonly horizontalLine: HorizontalLine
  private readonly marker: MarkerOverlay<LinePointsHit>
  private readonly probe: HitProbe<LinePointsHit>
  private readonly toggles: ComponentToggle

  private config: LinePointsConfig
  private selection: Selection<LinePointsHit>

  constructor(init: Init = {}) {
    super({ layoutVariant: 'vertical', renderManager: globalChartRenderManagerSteps4 })

    this.config = { ...defaultLinePoints(), ...init.config }

    const { clip: clipMain, mask: maskMain, maskRoot } = clipAndMask()
    this.maskRoot = maskRoot

    this.line = new AutoLine<LinePoint>({ classes: ['main-line', 's0'], smoothingMethod: init.smoothingMethod ?? 'monotone' })
    const plotRoot = new PlotGroup().addPlot(this.line)

    this.selection = this.buildSelection()

    this.verticalLine = new VerticalLine({ selection: this.selection })
    this.horizontalLine = new HorizontalLine({ selection: this.selection })
    this.marker = new MarkerOverlay(this.markerOptions())
    this.probe = new HitProbe(this.selection, hits => this.onHits.emit(hits))

    this.zoomComponent = new ZoomChartComponent({ chart: this, zoom: init.zoom ?? false, panDirection: init.zoom ? 'horizontal' : false })
    this.controller = new InteractionController('hover')
    this.toggles = new ComponentToggle(this.controller)
    if (init.zoom) this.controller.addComponent(this.zoomComponent)
    this.controller.addComponent(this.probe)

    buildChartScaffold({ chart: this, plotRoot, controller: this.controller, clip: clipMain, mask: maskMain })

    if (init.points) this.setPoints(init.points)
    this.applyConfig()
  }

  setPoints(points: (LinePoint | null)[]) {
    this.line.setPoints(points)
    return this
  }

  setConfig(config: Partial<LinePointsConfig>) {
    this.config = { ...this.config, ...config }
    this.applyConfig()
    return this
  }

  resetView() {
    return resetChartView(this)
  }

  // Сколько вершин осталось в отрисованном пути: децимация выбрасывает их, но не значения данных
  pathVertexCount() {
    const d = this.svg.querySelector('path.line')?.getAttribute('d') ?? ''
    return (d.match(/[MLC]/g) ?? []).length
  }

  private buildSelection() {
    return this.line.interaction.nearestByAxis(this.config.axis, { maxAxisDistance: this.config.maxAxisDistance ?? undefined })
  }

  private markerOptions(): MarkerOverlayOptions<LinePointsHit> {
    return {
      ...baseMarkerOptions(this.maskRoot),
      selection: this.selection,
      classesForHit: hit => hit.datum.flagged ? 'flagged' : [],
    }
  }

  private applyConfig() {
    // Новая пара (ось, maxAxisDistance) — новый узел графа: selections immutable
    this.selection = this.buildSelection()

    this.verticalLine.updateOptions({ selection: this.selection })
    this.horizontalLine.updateOptions({ selection: this.selection })
    this.marker.updateOptions(this.markerOptions())
    this.probe.setSelection(this.selection)

    this.toggles.set(this.verticalLine, this.config.verticalLine)
    this.toggles.set(this.horizontalLine, this.config.horizontalLine)
    this.toggles.set(this.marker, this.config.marker)

    this.scheduleRender()
  }
}
