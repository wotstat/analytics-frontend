import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { ChartTooltip, ChartTooltipOptions, TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { VerticalLine } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/lines/VerticalLine'
import { MarkerOverlay, MarkerOverlayOptions } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/markerOverlay/MarkerOverlay'
import { ZoomChartComponent } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/zoomChartComponent/ZoomChartComponent'
import { HoverSynchronizer } from '@/shared/uiKit/chart/universalChart/interaction/composable/sync/HoverSynchronizer'
import { Selection } from '@/shared/uiKit/chart/universalChart/interaction/core/Selection'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { LinePointHit } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLineInteractionSource'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { EventEmitter } from '@/shared/uiKit/chart/universalChart/utils/EventEmitter'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import { baseMarkerOptions, buildChartScaffold, clipAndMask, resetChartView } from './chartScaffold'
import { HitProbe } from './HitProbe'
import { LinePoint } from './linePoints'

export type SyncHit = LinePointHit<LinePoint>

export type SyncConfig = {
  verticalLineSynced: boolean
  markerSynced: boolean
  tooltipSynced: boolean
  tooltipPivot: 'cursor' | 'nearest' | 'avg'
  zoom: boolean
}

export function defaultSyncConfig(): SyncConfig {
  return { verticalLineSynced: true, markerSynced: false, tooltipSynced: false, tooltipPivot: 'cursor', zoom: false }
}

type Init = {
  points: (LinePoint | null)[]
  hoverSync: HoverSynchronizer
  config?: Partial<SyncConfig>
}

// Один и тот же line.interaction.nearestByAxis('x') резолвится и напрямую (local),
// и через withInput(hoverSync) (synced) — какой из них слушает VerticalLine/MarkerOverlay/ChartTooltip,
// решает конфиг. hoverSync добавляется в controller последним, тем же порядком, что и в production Charts.ts
export class SyncChart extends UniversalChart {

  readonly controller: InteractionController
  readonly zoomComponent: ZoomChartComponent
  readonly onTooltip = new EventEmitter<TooltipCtx<SyncHit> | null>()
  // Один и тот же resolver под двумя input в одном кадре: local — то, что видно только
  // при локальном ховере этого графика; synced — то, что приходит от текущего источника хаба
  readonly onLocalHits = new EventEmitter<readonly SyncHit[]>()
  readonly onSyncedHits = new EventEmitter<readonly SyncHit[]>()

  private readonly line: AutoLine<LinePoint>
  private readonly maskRoot: Element
  private readonly localSelection: Selection<SyncHit>
  private readonly syncedSelection: Selection<SyncHit>

  private readonly verticalLine: VerticalLine
  private readonly marker: MarkerOverlay<SyncHit>
  private readonly tooltip: ChartTooltip<SyncHit>
  private readonly localProbe: HitProbe<SyncHit>
  private readonly syncedProbe: HitProbe<SyncHit>

  private config: SyncConfig

  constructor(init: Init) {
    super({ layoutVariant: 'vertical', renderManager: globalChartRenderManagerSteps4 })

    this.config = { ...defaultSyncConfig(), ...init.config }

    const { clip: clipMain, mask: maskMain, maskRoot } = clipAndMask()
    this.maskRoot = maskRoot

    this.line = new AutoLine<LinePoint>({ classes: ['main-line', 's0'], smoothingMethod: 'monotone' })
    const plotRoot = new PlotGroup().addPlot(this.line)

    // maxAxisDistance обязателен: без него nearestByAxis всегда находит ближайшую точку вне зависимости
    // от расстояния, и разрыв никогда не дал бы по-настоящему пустой selection
    this.localSelection = this.line.interaction.nearestByAxis('x', { maxAxisDistance: 40 })
    this.syncedSelection = this.localSelection.withInput(init.hoverSync)

    this.verticalLine = new VerticalLine({ selection: this.selectionFor('verticalLineSynced') })
    this.marker = new MarkerOverlay(this.markerOptions())
    this.tooltip = new ChartTooltip(this.tooltipOptions())
    this.localProbe = new HitProbe(this.localSelection, hits => this.onLocalHits.emit(hits))
    this.syncedProbe = new HitProbe(this.syncedSelection, hits => this.onSyncedHits.emit(hits))

    // Порядок фиксирован здесь и не меняется тумблерами: zoom всегда виден onBeforeLayout раньше hub'а,
    // а "выключенный" зум переключается через updateOptions, а не add/removeComponent
    this.zoomComponent = new ZoomChartComponent({ chart: this, zoom: false, panDirection: false, autoFitFollow: true })
    this.controller = new InteractionController('hover')
      .addComponent(this.zoomComponent)
      .addComponent(this.verticalLine)
      .addComponent(this.marker)
      .addComponent(this.tooltip)
      .addComponent(this.localProbe)
      .addComponent(this.syncedProbe)
      .addComponent(init.hoverSync)

    buildChartScaffold({ chart: this, plotRoot, controller: this.controller, clip: clipMain, mask: maskMain })

    this.line.setPoints(init.points)
    this.applyConfig()
  }

  setConfig(config: Partial<SyncConfig>) {
    this.config = { ...this.config, ...config }
    this.applyConfig()
    return this
  }

  resetView() {
    return resetChartView(this)
  }

  private selectionFor(key: keyof Pick<SyncConfig, 'verticalLineSynced' | 'markerSynced' | 'tooltipSynced'>): Selection<SyncHit> {
    return this.config[key] ? this.syncedSelection : this.localSelection
  }

  private markerOptions(): MarkerOverlayOptions<SyncHit> {
    return {
      ...baseMarkerOptions(this.maskRoot),
      selection: this.selectionFor('markerSynced'),
    }
  }

  private tooltipOptions(): ChartTooltipOptions<SyncHit> {
    return {
      selection: this.selectionFor('tooltipSynced'),
      tooltipPivot: this.config.tooltipPivot,
      onPositionChange: ctx => this.onTooltip.emit(ctx),
      onHide: () => this.onTooltip.emit(null),
    }
  }

  private applyConfig() {
    this.verticalLine.updateOptions({ selection: this.selectionFor('verticalLineSynced') })
    this.marker.updateOptions(this.markerOptions())
    this.tooltip.updateOptions(this.tooltipOptions())
    this.zoomComponent.updateOptions({
      chart: this,
      zoom: this.config.zoom,
      panDirection: this.config.zoom ? 'horizontal' : false,
      autoFitFollow: true,
    })

    this.scheduleRender()
  }
}
