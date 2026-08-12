import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { Highlight } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/highlight/Highlight'
import { PolygonArea } from '@/shared/uiKit/chart/universalChart/plot/area/PolygonArea'
import { PolygonHit } from '@/shared/uiKit/chart/universalChart/plot/area/PolygonAreaInteractionSource'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { EventEmitter } from '@/shared/uiKit/chart/universalChart/utils/EventEmitter'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import type { Point } from '@/shared/uiKit/chart/universalChart/utils/Point'
import { buildChartScaffold, clipAndMask } from './chartScaffold'
import { ComponentToggle } from './ComponentToggle'
import { CompositionProbe, CompositionSnapshot } from './CompositionProbe'

const overlapA: Point[] = [
  { x: 5, y: 15 },
  { x: 55, y: 15 },
  { x: 55, y: 85 },
  { x: 5, y: 85 },
]

const overlapB: Point[] = [
  { x: 30, y: 5 },
  { x: 80, y: 5 },
  { x: 80, y: 75 },
  { x: 30, y: 75 },
]

export type PolygonOverlapConfig = {
  // DOM-порядок (визуально сверху), никак не влияет на composition order ниже
  swapPaintOrder: boolean
  highlight: boolean
}

export function defaultPolygonOverlapConfig(): PolygonOverlapConfig {
  return { swapPaintOrder: false, highlight: true }
}

// Два перекрывающихся PolygonArea. Composition order union() зафиксирован в коде (B — правый операнд,
// topmost() всегда выбирает его), swapPaintOrder меняет только DOM/paint order — какой path нарисован
// поверх другого визуально. По умолчанию они расходятся: A нарисован поверх B, но topmost() выбирает B —
// topmost() не читает DOM paint order
export class PolygonOverlapChart extends UniversalChart {

  readonly controller: InteractionController
  readonly highlight: Highlight<PolygonHit>
  readonly onSnapshot = new EventEmitter<CompositionSnapshot<PolygonHit>>()

  private readonly polygonA: PolygonArea
  private readonly polygonB: PolygonArea
  private readonly plotRoot: PlotGroup
  private readonly probe: CompositionProbe<PolygonHit>
  private readonly toggles: ComponentToggle

  private config: PolygonOverlapConfig

  constructor(init: { config?: Partial<PolygonOverlapConfig> } = {}) {
    super({ layoutVariant: 'vertical', renderManager: globalChartRenderManagerSteps4 })

    this.config = { ...defaultPolygonOverlapConfig(), ...init.config }

    const { clip } = clipAndMask()

    this.polygonA = new PolygonArea(['polygon-overlap', 'overlap-a'])
    this.polygonB = new PolygonArea(['polygon-overlap', 'overlap-b'])
    this.polygonA.setPoints(overlapA)
    this.polygonB.setPoints(overlapB)

    // Начальный порядок неважен: applyConfig() ниже сразу расставляет DOM-порядок по конфигу явно
    this.plotRoot = new PlotGroup().addPlot(this.polygonA).addPlot(this.polygonB)

    // bContains переиспользуется как в union(), так и в CompositionProbe: frame.resolve() мемоизирует
    // по паре (resolver instance, input), поэтому только общая ссылка даёт совпадающие по === hit-объекты
    // для "из правой" — два отдельных contains() дали бы структурно те же, но разные по ссылке хиты
    const bContains = this.polygonB.interaction.contains()
    const composed = this.polygonA.interaction.contains().union(bContains)
    const topmost = composed.topmost()

    this.highlight = new Highlight({ selection: topmost, class: 'polygon-overlap-highlighted' })
    this.probe = new CompositionProbe<PolygonHit>(snapshot => this.onSnapshot.emit(snapshot))
    this.probe.setSelections(composed, bContains)

    this.controller = new InteractionController('hover')
    this.toggles = new ComponentToggle(this.controller)
    this.controller.addComponent(this.probe)

    buildChartScaffold({ chart: this, plotRoot: this.plotRoot, controller: this.controller, clip })

    this.setRenderBounds({ minX: 0, maxX: 85, minY: 0, maxY: 90 })
    this.applyConfig()
  }

  get interactionA(): symbol {
    return this.polygonA.interaction.id
  }

  get interactionB(): symbol {
    return this.polygonB.interaction.id
  }

  setConfig(config: Partial<PolygonOverlapConfig>) {
    this.config = { ...this.config, ...config }
    this.applyConfig()
    return this
  }

  private applyConfig() {
    // appendChild на уже прикреплённом узле перемещает его в конец: чей узел двигаем последним,
    // тот и оказывается визуально сверху. По умолчанию (false) сверху A — расходится с topmost(),
    // который всегда B; swapPaintOrder переключает видимый верх на B, совпадая с topmost()
    const top = this.config.swapPaintOrder ? this.polygonB : this.polygonA
    this.plotRoot.root.appendChild(top.getRootElement())

    this.toggles.set(this.highlight, this.config.highlight)

    this.scheduleRender()
  }
}
