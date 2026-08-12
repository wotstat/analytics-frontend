import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { HorizontalArea } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/areas/HorizontalArea'
import { VerticalArea } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/areas/VerticalArea'
import { Highlight } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/highlight/Highlight'
import { PolygonArea } from '@/shared/uiKit/chart/universalChart/plot/area/PolygonArea'
import { PolygonAreaInteractionSource, PolygonHit } from '@/shared/uiKit/chart/universalChart/plot/area/PolygonAreaInteractionSource'
import { AutoMarkers } from '@/shared/uiKit/chart/universalChart/plot/markers/autoMarkers/AutoMarkers'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { EventEmitter } from '@/shared/uiKit/chart/universalChart/utils/EventEmitter'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import type { Point } from '@/shared/uiKit/chart/universalChart/utils/Point'
import { buildChartScaffold, clipAndMask } from './chartScaffold'
import { ComponentToggle } from './ComponentToggle'
import { HitProbe } from './HitProbe'

// Вогнутый внешний контур (форма "П" с вырезом снизу-по-центру) — тот же, что и в plots/sections/Polygons.vue
const outer: Point[] = [
  { x: 10, y: 10 },
  { x: 85, y: 10 },
  { x: 85, y: 85 },
  { x: 55, y: 85 },
  { x: 55, y: 55 },
  { x: 35, y: 55 },
  { x: 35, y: 85 },
  { x: 10, y: 85 },
]

// Передан в обратном направлении относительно outer — под fill-rule nonzero это корректная дырка
const holeReversed: Point[] = [
  { x: 60, y: 25 },
  { x: 60, y: 42 },
  { x: 77, y: 42 },
  { x: 77, y: 25 },
]

// Три опорные точки для точного наведения курсора: solid — внутри заливки вне дырки, notch — внутри bbox,
// но в вогнутом вырезе (снаружи заливки), hole — центр прямоугольника дырки
const solidPoint: Point = { x: 45, y: 30 }
const notchPoint: Point = { x: 45, y: 70 }
const holePoint: Point = { x: 68.5, y: 33.5 }

export type PolygonShapeConfig = {
  offsetX: number
  // false — hole передан в обратном направлении (корректная дырка под nonzero, как в Polygons.vue);
  // true — то же направление, что и outer (демонстрирует зависимость nonzero от winding)
  holeSameWinding: boolean
  evenodd: boolean
  highlight: boolean
  // У полигона нет именованных geometry scopes — обе области читают default geometry, то есть bounds
  verticalArea: boolean
  horizontalArea: boolean
}

export function defaultPolygonShapeConfig(): PolygonShapeConfig {
  return { offsetX: 0, holeSameWinding: false, evenodd: false, highlight: true, verticalArea: false, horizontalArea: false }
}

// Один PolygonArea с вогнутым контуром и дыркой. offsetX сдвигает фигуру относительно фиксированных
// renderBounds — от полностью видимой до частично видимой и полностью отсечённой culling'ом.
// holeSameWinding и evenodd независимо переключают nonzero/evenodd семантику дырки
export class PolygonShapeChart extends UniversalChart {

  readonly controller: InteractionController
  readonly highlight: Highlight<PolygonHit>
  readonly onHit = new EventEmitter<readonly PolygonHit[]>()

  private readonly polygon: PolygonArea
  // Декоративные прицелы для Playwright/ручной проверки: наведение на центр circle даёt точную
  // chart-space координату теста, в interaction они не участвуют
  private readonly probeMarkers: AutoMarkers
  private readonly selection
  private readonly verticalArea: VerticalArea<PolygonHit>
  private readonly horizontalArea: HorizontalArea<PolygonHit>
  private readonly probe: HitProbe<PolygonHit>
  private readonly toggles: ComponentToggle

  private config: PolygonShapeConfig

  constructor(init: { config?: Partial<PolygonShapeConfig> } = {}) {
    super({ layoutVariant: 'vertical', renderManager: globalChartRenderManagerSteps4 })

    this.config = { ...defaultPolygonShapeConfig(), ...init.config }

    const { clip } = clipAndMask()

    this.polygon = new PolygonArea(['polygon-demo'])
    this.probeMarkers = new AutoMarkers({ classes: 'probe-marker', size: 3, affectsBounds: false })

    const plotRoot = new PlotGroup().addPlot(this.polygon).addPlot(this.probeMarkers)

    this.selection = this.polygon.interaction.contains()
    this.highlight = new Highlight({ selection: this.selection, class: 'polygon-highlighted' })
    // Без geometry-опции: PolygonHit не объявляет именованных scopes, поэтому обе области рисуют bounds hit'а
    this.verticalArea = new VerticalArea({ selection: this.selection, classes: 'polygon-area' })
    this.horizontalArea = new HorizontalArea({ selection: this.selection, classes: 'polygon-area' })
    this.probe = new HitProbe(this.selection, hits => this.onHit.emit(hits))

    this.controller = new InteractionController('hover')
    this.toggles = new ComponentToggle(this.controller)
    this.controller.addComponent(this.probe)

    buildChartScaffold({ chart: this, plotRoot, controller: this.controller, clip })

    // Фиксированные bounds, не auto-fit: offsetX должен уметь увозить фигуру за пределы видимой области
    this.setRenderBounds({ minX: 0, maxX: 100, minY: 0, maxY: 100 })
    this.applyConfig()
  }

  get interaction(): PolygonAreaInteractionSource {
    return this.polygon.interaction
  }

  setConfig(config: Partial<PolygonShapeConfig>) {
    this.config = { ...this.config, ...config }
    this.applyConfig()
    return this
  }

  // Пустой d — единственный сигнал "path отсечён culling'ом целиком": сам by-hit-test результат
  // в этом случае просто отсутствует, а не приходит с contains: false
  pathInfo(): { empty: boolean, length: number } {
    const d = this.polygon.getRootElement().querySelector('path')?.getAttribute('d') ?? ''
    return { empty: d.length === 0, length: d.length }
  }

  private applyConfig() {
    const move = (point: Point): Point => ({ x: point.x + this.config.offsetX, y: point.y })
    const hole = this.config.holeSameWinding ? [...holeReversed].reverse() : holeReversed

    this.polygon.setPoints([outer.map(move), hole.map(move)])
    this.polygon.getRootElement().classList.toggle('evenodd', this.config.evenodd)

    this.probeMarkers.setMarkers([
      { ...move(solidPoint), markerClasses: 'solid' },
      { ...move(notchPoint), markerClasses: 'notch' },
      { ...move(holePoint), markerClasses: 'hole' },
    ])

    this.toggles.set(this.highlight, this.config.highlight)
    this.toggles.set(this.verticalArea, this.config.verticalArea)
    this.toggles.set(this.horizontalArea, this.config.horizontalArea)

    this.scheduleRender()
  }
}
