import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { ChartTooltip, ChartTooltipOptions, TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { VerticalLine } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/lines/VerticalLine'
import { MarkerOverlay, MarkerOverlayOptions } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/markerOverlay/MarkerOverlay'
import { ZoomChartComponent } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/zoomChartComponent/ZoomChartComponent'
import { CursorHit, cursorSelection } from '@/shared/uiKit/chart/universalChart/interaction/core/CursorSelection'
import { Selection } from '@/shared/uiKit/chart/universalChart/interaction/core/Selection'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { AutoLineInteractionQuery, LinePointHit } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLineInteractionSource'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { EventEmitter } from '@/shared/uiKit/chart/universalChart/utils/EventEmitter'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import { Classes } from '@/shared/uiKit/chart/universalChart/utils/utils'
import { baseMarkerOptions, buildChartScaffold, clipAndMask, resetChartView } from './chartScaffold'
import { ComponentToggle } from './ComponentToggle'
import { CompositionProbe, CompositionSnapshot } from './CompositionProbe'
import { LinePoint } from './linePoints'
import { presetSeries, SeriesPreset, seriesClass } from './tooltipSeries'

export type MultiLineHit = LinePointHit<LinePoint>
export type ComposedHit = MultiLineHit | CursorHit

export type CompositionConfig = {
  preset: SeriesPreset
  maxAxisDistance: number | null
  maxDistance: number | null
  duplicateUnion: boolean
  cursorUnion: boolean
  cursorFallback: boolean
  tooltipPivot: 'cursor' | 'nearest' | 'avg'
  verticalLine: boolean
  marker: boolean
  tooltip: boolean
}

export function defaultComposition(): CompositionConfig {
  return {
    preset: 'aligned',
    maxAxisDistance: null,
    maxDistance: null,
    duplicateUnion: false,
    cursorUnion: false,
    cursorFallback: false,
    tooltipPivot: 'cursor',
    verticalLine: true,
    marker: true,
    tooltip: true,
  }
}

type Init = {
  config?: Partial<CompositionConfig>
  zoom?: boolean
}

const LINE_COUNT = 3

// Три совместимые линии объединяются до запроса через lineA.interaction.union(lineB.interaction),
// и все overlay считают по одной композиции selections
export class MultiLineChart extends UniversalChart {

  readonly controller: InteractionController
  readonly onTooltip = new EventEmitter<TooltipCtx<ComposedHit> | null>()
  readonly onTooltipEvent = new EventEmitter<'show' | 'hide'>()
  readonly onSnapshot = new EventEmitter<CompositionSnapshot<ComposedHit>>()

  private readonly lines: AutoLine<LinePoint>[] = []
  private readonly query: AutoLineInteractionQuery<LinePoint>
  private readonly cursor = cursorSelection()
  private readonly maskRoot: Element

  private readonly verticalLine: VerticalLine
  private readonly marker: MarkerOverlay<ComposedHit>
  private readonly tooltip: ChartTooltip<ComposedHit>
  private readonly probe: CompositionProbe<ComposedHit>
  private readonly toggles: ComponentToggle

  private config: CompositionConfig

  constructor(init: Init = {}) {
    super({ layoutVariant: 'vertical', renderManager: globalChartRenderManagerSteps4 })

    this.config = { ...defaultComposition(), ...init.config }

    const { clip: clipMain, mask: maskMain, maskRoot } = clipAndMask()
    this.maskRoot = maskRoot

    const plotRoot = new PlotGroup()

    for (let i = 0; i < LINE_COUNT; i++) {
      const line = new AutoLine<LinePoint>({ classes: ['main-line', `s${i}`], smoothingMethod: 'monotone' })
      this.lines.push(line)
      plotRoot.addPlot(line)
    }

    this.query = this.lines[0].interaction.union(this.lines[1].interaction).union(this.lines[2].interaction)

    const initial = this.buildSelections()
    this.verticalLine = new VerticalLine({ selection: initial.composed })
    this.marker = new MarkerOverlay(this.markerOptions(initial.composed))
    this.tooltip = new ChartTooltip(this.tooltipOptions(initial.composed))
    this.probe = new CompositionProbe<ComposedHit>(snapshot => this.onSnapshot.emit(snapshot))

    this.controller = new InteractionController()
    this.toggles = new ComponentToggle(this.controller)
    if (init.zoom) this.controller.addComponent(new ZoomChartComponent({ chart: this, zoom: true, panDirection: 'horizontal' }))
    this.controller.addComponent(this.probe)

    buildChartScaffold({ chart: this, plotRoot, controller: this.controller, clip: clipMain, mask: maskMain })

    this.applyConfig()
  }

  setConfig(config: Partial<CompositionConfig>) {
    this.config = { ...this.config, ...config }
    this.applyConfig()
    return this
  }

  resetView() {
    return resetChartView(this)
  }

  private buildSelections() {
    const options = { maxAxisDistance: this.config.maxAxisDistance ?? undefined }

    let points: Selection<MultiLineHit> = this.query.nearestByAxis('x', options)

    // Тот же bucket второй раз: дубликаты обязаны сохранить позицию из левой и содержимое из правой
    const right = this.config.duplicateUnion ? this.lines[1].interaction.nearestByAxis('x', options) : null
    if (right) points = points.union(right)

    if (this.config.maxDistance !== null) points = points.within({ maxDistance: this.config.maxDistance })

    let composed: Selection<ComposedHit> = points
    if (this.config.cursorUnion) composed = composed.union(this.cursor)
    if (this.config.cursorFallback) composed = composed.orElse(this.cursor)

    return { composed, right }
  }

  private markerOptions(selection: Selection<ComposedHit>): MarkerOverlayOptions<ComposedHit> {
    return {
      ...baseMarkerOptions(this.maskRoot),
      selection,
      classesForHit: hit => this.classesForHit(hit),
    }
  }

  private tooltipOptions(selection: Selection<ComposedHit>): ChartTooltipOptions<ComposedHit> {
    return {
      selection,
      tooltipPivot: this.config.tooltipPivot,
      onShow: () => this.onTooltipEvent.emit('show'),
      onPositionChange: ctx => this.onTooltip.emit(ctx),
      onHide: () => {
        this.onTooltipEvent.emit('hide')
        this.onTooltip.emit(null)
      },
    }
  }

  private classesForHit(hit: ComposedHit): Classes {
    return hit.kind === 'cursor' ? 'cursor' : seriesClass(hit.datum)
  }

  private applyConfig() {
    // Новая конфигурация — новые узлы графа: selections immutable
    const { composed, right } = this.buildSelections()

    const series = presetSeries(this.config.preset)
    for (let i = 0; i < this.lines.length; i++) this.lines[i].setPoints(series[i] ?? [])

    this.verticalLine.updateOptions({ selection: composed })
    this.marker.updateOptions(this.markerOptions(composed))
    this.tooltip.updateOptions(this.tooltipOptions(composed))
    this.probe.setSelections(composed, right)

    this.toggles.set(this.verticalLine, this.config.verticalLine)
    this.toggles.set(this.marker, this.config.marker)
    this.toggles.set(this.tooltip, this.config.tooltip)

    this.scheduleRender()
  }
}
