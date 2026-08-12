import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { MarkerOverlay, MarkerOverlayOptions } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/markerOverlay/MarkerOverlay'
import { ZoomChartComponent } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/zoomChartComponent/ZoomChartComponent'
import { InteractionFrame } from '@/shared/uiKit/chart/universalChart/interaction/core/InteractionFrame'
import { Selection } from '@/shared/uiKit/chart/universalChart/interaction/core/Selection'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { LineStrokeHit } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLineInteractionSource'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { EventEmitter } from '@/shared/uiKit/chart/universalChart/utils/EventEmitter'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import { baseMarkerOptions, buildChartScaffold, clipAndMask, resetChartView } from './chartScaffold'
import { CompositionProbe, CompositionSnapshot } from './CompositionProbe'
import { crossingPair, densePoints, gapPoints, LinePoint, parallelPair, sparsePoints, wavePoints } from './linePoints'

export type StrokePreset = 'straight' | 'smooth' | 'monotone' | 'sparse' | 'nullgap' | 'intersect' | 'parallel' | 'dense'

export const strokePresets: { value: StrokePreset, label: string }[] = [
  { value: 'straight', label: 'прямая' },
  { value: 'smooth', label: 'smooth' },
  { value: 'monotone', label: 'monotone' },
  { value: 'sparse', label: 'разреженный сегмент' },
  { value: 'nullgap', label: 'разрыв null' },
  { value: 'intersect', label: 'пересечение линий' },
  { value: 'parallel', label: 'близкие параллельные' },
  { value: 'dense', label: '20 000 точек (перф)' },
]

export type StrokeChartHit = LineStrokeHit<LinePoint>

export type StrokeConfig = {
  preset: StrokePreset
  maxDistance: number
  thickStroke: boolean
}

export function defaultStrokeConfig(): StrokeConfig {
  return { preset: 'straight', maxDistance: 12, thickStroke: false }
}

function presetData(preset: StrokePreset): {
  pointsA: (LinePoint | null)[]
  pointsB: (LinePoint | null)[]
  smoothingMethod?: 'monotone' | 'smooth'
} {
  switch (preset) {
    case 'straight': return { pointsA: wavePoints(20), pointsB: [] }
    case 'smooth': return { pointsA: wavePoints(20), pointsB: [], smoothingMethod: 'smooth' }
    case 'monotone': return { pointsA: wavePoints(20), pointsB: [], smoothingMethod: 'monotone' }
    case 'sparse': return { pointsA: sparsePoints(), pointsB: [], smoothingMethod: 'monotone' }
    case 'nullgap': return { pointsA: gapPoints(), pointsB: [], smoothingMethod: 'monotone' }
    case 'intersect': { const [a, b] = crossingPair(); return { pointsA: a, pointsB: b } }
    case 'parallel': { const [a, b] = parallelPair(); return { pointsA: a, pointsB: b, smoothingMethod: 'monotone' } }
    case 'dense': return { pointsA: densePoints(20_000), pointsB: [], smoothingMethod: 'monotone' }
  }
}

export type HoverCostMeasurement = {
  cold: number
  warmAvg: number
  steps: number
}

// nearStroke() на реально отрисованном centerline. Один чарт закрывает всю матрицу near-stroke сценариев
// через preset — так же, как MultiLineChart закрывает матрицу composition через свои presets
export class NearStrokeChart extends UniversalChart {

  readonly controller: InteractionController
  readonly onSnapshot = new EventEmitter<CompositionSnapshot<StrokeChartHit>>()

  private readonly lineA: AutoLine<LinePoint>
  private readonly lineB: AutoLine<LinePoint>
  private readonly maskRoot: Element

  private readonly marker: MarkerOverlay<StrokeChartHit>
  private readonly probe: CompositionProbe<StrokeChartHit>

  private config: StrokeConfig
  private selection: Selection<StrokeChartHit>

  constructor(init: { config?: Partial<StrokeConfig>, zoom?: boolean } = {}) {
    super({ layoutVariant: 'vertical', renderManager: globalChartRenderManagerSteps4 })

    this.config = { ...defaultStrokeConfig(), ...init.config }

    const { clip: clipMain, mask: maskMain, maskRoot } = clipAndMask()
    this.maskRoot = maskRoot

    this.lineA = new AutoLine<LinePoint>({ classes: ['main-line', 's0'] })
    this.lineB = new AutoLine<LinePoint>({ classes: ['main-line', 's1'] })
    const plotRoot = new PlotGroup().addPlot(this.lineA).addPlot(this.lineB)

    // Пустая lineB естественно не даёт stroke hit: не нужна ветка «один/два источника» в query
    this.selection = this.lineA.interaction.union(this.lineB.interaction).nearStroke({ maxDistance: this.config.maxDistance })

    this.marker = new MarkerOverlay(this.markerOptions())
    this.probe = new CompositionProbe<StrokeChartHit>(snapshot => this.onSnapshot.emit(snapshot))

    this.controller = new InteractionController('hover')
    if (init.zoom) this.controller.addComponent(new ZoomChartComponent({ chart: this, zoom: true, panDirection: 'horizontal' }))
    this.controller.addComponent(this.marker)
    this.controller.addComponent(this.probe)

    buildChartScaffold({ chart: this, plotRoot, controller: this.controller, clip: clipMain, mask: maskMain })

    this.applyConfig()
  }

  // Идентичность source для UI-таблицы стенда: показать, какой из двух lines дал stroke hit
  get seriesASource() {
    return this.lineA.interaction
  }

  get seriesBSource() {
    return this.lineB.interaction
  }

  setConfig(config: Partial<StrokeConfig>) {
    this.config = { ...this.config, ...config }
    this.applyConfig()
    return this
  }

  resetView() {
    return resetChartView(this)
  }

  // Синтетический прогон resolve() по многим pointer-позициям вдоль layout, без реальных DOM-событий.
  // cold — первый resolve после смены preset: строка d новая, семплирование ещё не закешировано.
  // warmAvg — следующие resolve с тем же d: кеш уже построен, каждый кадр только точечная математика
  measureHoverCost(steps = 400): HoverCostMeasurement {
    const space = this.space
    const y = space.layout.y + space.layout.height / 2
    const key = {}

    const coldStart = performance.now()
    new InteractionFrame(space, { key, pointer: { point: { x: space.layout.x, y }, isTouch: false } }).resolve(this.selection)
    const cold = performance.now() - coldStart

    const warmStart = performance.now()
    for (let i = 0; i < steps; i++) {
      const x = space.layout.x + (space.layout.width * i) / steps
      new InteractionFrame(space, { key, pointer: { point: { x, y }, isTouch: false } }).resolve(this.selection)
    }
    const warmAvg = (performance.now() - warmStart) / steps

    return { cold, warmAvg, steps }
  }

  private markerOptions(): MarkerOverlayOptions<StrokeChartHit> {
    return {
      ...baseMarkerOptions(this.maskRoot),
      selection: this.selection,
      classesForHit: hit => [hit.source === this.lineA.interaction ? 's0' : 's1', hit.contains ? 'contains' : 'reach-only'],
    }
  }

  private applyConfig() {
    const { pointsA, pointsB, smoothingMethod } = presetData(this.config.preset)

    // smoothingMethod у AutoLine фиксируется в options при конструировании, но объект options
    // мутируем напрямую (как это уже делает Decimation.vue) — следующий setPoints перестроит путь им же
    Object.assign(this.lineA.options, { smoothingMethod })
    Object.assign(this.lineB.options, { smoothingMethod })
    this.lineA.setPoints(pointsA)
    this.lineB.setPoints(pointsB)

    this.lineA.getRootElement().classList.toggle('thick', this.config.thickStroke)

    // Новый maxDistance — новый узел графа: selections immutable
    this.selection = this.lineA.interaction.union(this.lineB.interaction).nearStroke({ maxDistance: this.config.maxDistance })

    this.marker.updateOptions(this.markerOptions())
    this.probe.setSelections(this.selection, null)

    this.scheduleRender()
  }
}
