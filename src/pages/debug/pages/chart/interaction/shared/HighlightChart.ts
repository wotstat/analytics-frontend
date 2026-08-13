import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { ChartTooltip, ChartTooltipOptions, TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { Highlight } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/highlight/Highlight'
import { MarkerOverlay, MarkerOverlayOptions } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/markerOverlay/MarkerOverlay'
import { ZoomChartComponent } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/zoomChartComponent/ZoomChartComponent'
import { isSameIdentity } from '@/shared/uiKit/chart/universalChart/interaction/core/InteractionHit'
import { Selection } from '@/shared/uiKit/chart/universalChart/interaction/core/Selection'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { AutoLineInteractionQuery, LinePointHit, LineStrokeHit } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLineInteractionSource'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { EventEmitter } from '@/shared/uiKit/chart/universalChart/utils/EventEmitter'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import { baseMarkerOptions, buildChartScaffold, clipAndMask, resetChartView } from './chartScaffold'
import { ComponentToggle } from './ComponentToggle'
import { crossingPair, LinePoint, wavePoints } from './linePoints'

export type HighlightPreset = 'parallel' | 'intersect'

export const highlightPresets: { value: HighlightPreset, label: string }[] = [
  { value: 'parallel', label: 'параллельные линии' },
  { value: 'intersect', label: 'пересечение' },
]

export type HighlightPointHit = LinePointHit<LinePoint>
export type HighlightStrokeHit = LineStrokeHit<LinePoint>

export type HighlightConfig = {
  preset: HighlightPreset
  maxDistance: number
  secondSameClass: boolean
  secondDiffClass: boolean
}

export function defaultHighlightConfig(): HighlightConfig {
  return { preset: 'parallel', maxDistance: 12, secondSameClass: false, secondDiffClass: false }
}

// Живое сравнение обоих порядков addComponent(): tooltipBefore/tooltipAfter публикуют независимо,
// active === false означает «оба тултипа сейчас скрыты», а не «порядки разошлись»
export type OrderCheck = { readonly active: boolean, readonly match: boolean }

type Init = { config?: Partial<HighlightConfig>, zoom?: boolean }

function presetData(preset: HighlightPreset): [LinePoint[], LinePoint[]] {
  if (preset === 'intersect') return crossingPair()

  const a = wavePoints(20)
  const b = a.map(p => ({ ...p, y: p.y + 170 }))
  return [a, b]
}

// Сравнение по identity + isHighlighted(), не по ссылке на ctx целиком: pivot/cursor физически совпадают
// у before/after (тот же frame.input), значимо тут именно состав hits и подсветка
function ctxMatches(a: TooltipCtx<HighlightPointHit>, b: TooltipCtx<HighlightPointHit>, highlight: Highlight<HighlightStrokeHit>): boolean {
  if (a.hits.length !== b.hits.length) return false

  return a.hits.every((hit, i) => {
    const other = b.hits[i]
    return isSameIdentity(hit.identity, other.identity) && a.isHighlighted(hit, highlight) === b.isHighlighted(hit, highlight)
  })
}

// lineHighlight подсвечивает ближайший stroke, а тултип отмечает жирным точки той же серии через
// ctx.isHighlighted() — сопоставление идёт по series membership, а не по совпадению DOM targets.
// tooltipBefore/tooltipAfter стоят по разные стороны от lineHighlight в components — единственный
// честный способ проверить оба порядка addComponent() внутри одного кадра, а не последовательной пересборкой
export class HighlightChart extends UniversalChart {

  readonly controller: InteractionController
  readonly lineHighlight: Highlight<HighlightStrokeHit>
  readonly secondSameClass: Highlight<HighlightStrokeHit>
  readonly secondDiffClass: Highlight<HighlightStrokeHit>

  readonly onTooltip = new EventEmitter<TooltipCtx<HighlightPointHit> | null>()
  readonly onOrderCheck = new EventEmitter<OrderCheck>()

  private readonly lineA: AutoLine<LinePoint>
  private readonly lineB: AutoLine<LinePoint>
  private readonly query: AutoLineInteractionQuery<LinePoint>
  private readonly maskRoot: Element

  private readonly marker: MarkerOverlay<HighlightPointHit>
  private readonly tooltipBefore: ChartTooltip<HighlightPointHit>
  private readonly tooltipAfter: ChartTooltip<HighlightPointHit>
  private readonly toggles: ComponentToggle

  private config: HighlightConfig
  private strokeNearest: Selection<HighlightStrokeHit>
  private linePointsByX: Selection<HighlightPointHit>

  private lastBefore: TooltipCtx<HighlightPointHit> | null = null
  private lastAfter: TooltipCtx<HighlightPointHit> | null = null

  // Геометрия (points/selection) обновляется только когда preset/maxDistance реально изменились.
  // Иначе updateOptions() на lineHighlight от каждого чекбокса сбрасывал бы его собственный appliedTargets
  // и маскировал бы «два Highlight одного класса» — ровно то, что эта секция должна показать
  private lastGeometryKey = ''

  constructor(init: Init = {}) {
    super({ layoutVariant: 'vertical', renderManager: globalChartRenderManagerSteps4 })

    this.config = { ...defaultHighlightConfig(), ...init.config }

    const { clip: clipMain, mask: maskMain, maskRoot } = clipAndMask()
    this.maskRoot = maskRoot

    this.lineA = new AutoLine<LinePoint>({ classes: ['main-line', 's0'], smoothingMethod: 'monotone' })
    this.lineB = new AutoLine<LinePoint>({ classes: ['main-line', 's1'], smoothingMethod: 'monotone' })
    const plotRoot = new PlotGroup().addPlot(this.lineA).addPlot(this.lineB)

    this.query = this.lineA.interaction.union(this.lineB.interaction)
    this.strokeNearest = this.query.nearStroke({ maxDistance: this.config.maxDistance }).nearest()
    this.linePointsByX = this.query.nearestByAxis('x')

    // Все три Highlight читают один и тот же strokeNearest — умышленно: демонстрирует одновременно
    // «разные классы на одном target» (lineHighlight + secondDiffClass) и «два Highlight одного класса,
    // конфликт без арбитража» (lineHighlight + secondSameClass), не полагаясь на случайное совпадение
    this.lineHighlight = new Highlight({ selection: this.strokeNearest, class: 'line-highlighted' })
    this.secondSameClass = new Highlight({ selection: this.strokeNearest, class: 'line-highlighted' })
    this.secondDiffClass = new Highlight({ selection: this.strokeNearest, class: 'flagged-highlighted' })

    this.marker = new MarkerOverlay(this.markerOptions())

    this.tooltipBefore = new ChartTooltip(this.tooltipOptionsFor('before'))
    this.tooltipAfter = new ChartTooltip(this.tooltipOptionsFor('after'))

    this.controller = new InteractionController()
    this.toggles = new ComponentToggle(this.controller)
    if (init.zoom) this.controller.addComponent(new ZoomChartComponent({ chart: this, zoom: true, panDirection: 'horizontal' }))
    this.controller.addComponent(this.tooltipBefore)
    this.controller.addComponent(this.lineHighlight)
    this.controller.addComponent(this.tooltipAfter)
    this.controller.addComponent(this.marker)

    buildChartScaffold({ chart: this, plotRoot, controller: this.controller, clip: clipMain, mask: maskMain })

    this.applyConfig()
  }

  // Идентичность source для UI-таблицы стенда: показать, какой из двух lines дал точку
  get lineASource() {
    return this.lineA.interaction.id
  }

  get lineBSource() {
    return this.lineB.interaction.id
  }

  setConfig(config: Partial<HighlightConfig>) {
    this.config = { ...this.config, ...config }
    this.applyConfig()
    return this
  }

  resetView() {
    return resetChartView(this)
  }

  // before/after — одна и та же selection/exposeHighlights, разница только в том, какой slot
  // (lastBefore/lastAfter) обновляется и публикуется ли результат наружу через onTooltip. Экземпляры
  // ChartTooltip создаются отдельно: у компонента нет общего selection-состояния между инстансами
  private tooltipOptionsFor(slot: 'before' | 'after'): ChartTooltipOptions<HighlightPointHit> {
    return {
      selection: this.linePointsByX,
      exposeHighlights: [this.lineHighlight],
      onPositionChange: ctx => {
        if (slot === 'before') this.lastBefore = ctx
        else { this.lastAfter = ctx; this.onTooltip.emit(ctx) }
        this.publishOrderCheck()
      },
      onHide: () => {
        if (slot === 'before') this.lastBefore = null
        else { this.lastAfter = null; this.onTooltip.emit(null) }
        this.publishOrderCheck()
      },
    }
  }

  // tooltipAfter стоит в components после tooltipBefore, поэтому его колбэк в этом кадре обязательно
  // видит уже свежий lastBefore — итоговое сравнение всегда актуально для текущего кадра
  private publishOrderCheck() {
    if (!this.lastBefore || !this.lastAfter) {
      this.onOrderCheck.emit({ active: false, match: true })
      return
    }

    this.onOrderCheck.emit({ active: true, match: ctxMatches(this.lastBefore, this.lastAfter, this.lineHighlight) })
  }

  private markerOptions(): MarkerOverlayOptions<HighlightPointHit> {
    return {
      ...baseMarkerOptions(this.maskRoot),
      selection: this.linePointsByX,
      classesForHit: hit => hit.sourceId === this.lineA.interaction.id ? 's0' : 's1',
    }
  }

  private applyConfig() {
    const geometryKey = `${this.config.preset}:${this.config.maxDistance}`

    if (geometryKey !== this.lastGeometryKey) {
      this.lastGeometryKey = geometryKey

      const [pointsA, pointsB] = presetData(this.config.preset)
      this.lineA.setPoints(pointsA)
      this.lineB.setPoints(pointsB)

      // Новый maxDistance — новый узел графа: selections immutable
      this.strokeNearest = this.query.nearStroke({ maxDistance: this.config.maxDistance }).nearest()
      this.linePointsByX = this.query.nearestByAxis('x')

      this.lineHighlight.updateOptions({ selection: this.strokeNearest, class: 'line-highlighted' })
      this.secondSameClass.updateOptions({ selection: this.strokeNearest, class: 'line-highlighted' })
      this.secondDiffClass.updateOptions({ selection: this.strokeNearest, class: 'flagged-highlighted' })
      this.marker.updateOptions(this.markerOptions())
      this.tooltipBefore.updateOptions(this.tooltipOptionsFor('before'))
      this.tooltipAfter.updateOptions(this.tooltipOptionsFor('after'))
    }

    this.toggles.set(this.secondSameClass, this.config.secondSameClass)
    this.toggles.set(this.secondDiffClass, this.config.secondDiffClass)

    this.scheduleRender()
  }
}
