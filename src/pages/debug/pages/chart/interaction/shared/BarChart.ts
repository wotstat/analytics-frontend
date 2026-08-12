import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { HorizontalArea } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/areas/HorizontalArea'
import { VerticalArea } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/areas/VerticalArea'
import { Highlight } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/highlight/Highlight'
import { ZoomChartComponent } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/zoomChartComponent/ZoomChartComponent'
import { InteractionBounds } from '@/shared/uiKit/chart/universalChart/interaction/core/InteractionGeometry'
import { Selection } from '@/shared/uiKit/chart/universalChart/interaction/core/Selection'
import { Bar, BarDataset, BarStrategy } from '@/shared/uiKit/chart/universalChart/plot/bar/Bar'
import { BarGapPolicy, BarGroupHit, BarHitArea, BarItemHit, BarItemSelection } from '@/shared/uiKit/chart/universalChart/plot/bar/BarInteractionSource'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { EventEmitter } from '@/shared/uiKit/chart/universalChart/utils/EventEmitter'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import { buildChartScaffold, clipAndMask, resetChartView } from './chartScaffold'
import { ComponentToggle } from './ComponentToggle'
import { HitProbe } from './HitProbe'

export type BarStrategyKind = 'grouped' | 'stacked'

export type BarPresetName = 'mixed' | 'edges' | 'positive' | 'negative'

export type BarChartConfig = {
  preset: BarPresetName
  gaps: BarGapPolicy
  hitArea: BarHitArea
  padding: number
  innerPadding: number
  radius: number
  innerRadius: number
  itemHighlight: boolean
  groupHighlight: boolean
  datasetHighlight: boolean
  // Отдельная подсветка от containsGroup(), а не от related('group'): единственный способ увидеть
  // глазами, что группа подсвечивается и там, где ни один item не найден (vertical у stacked)
  groupContainsHighlight: boolean
  // item vs group geometry на одном и том же item selection, плюс дедуп/несколько областей сразу
  itemArea: boolean
  groupArea: boolean
  datasetAreas: boolean
  itemHorizontalArea: boolean
  probeCategory: number
  cropped: boolean
}

// Число различимых по классу .hover-area rect в DOM: group читает N item hits одной категории —
// должен схлопнуться в одну область (одинаковые ranges дедуплицируются); dataset читает N item
// hits разных категорий — обязан дать несколько одновременно (разные ranges не объединяются неявно)
export type BarAreaCounts = {
  readonly item: number
  readonly group: number
  readonly dataset: number
  readonly itemHorizontal: number
}

// Живые числа layout текущего кадра: на глаз gap policy не проверяется, поэтому стенд показывает
// сами координаты зон, а не только выбранный item
export type BarZone = {
  readonly datasetIndex: number
  readonly value: number
  readonly rect: InteractionBounds
  readonly slotRect: InteractionBounds
  readonly groupRect: InteractionBounds
  // Есть ли непустой d: culled и нулевые bars остаются в layout, но в DOM у них пустой путь
  readonly drawn: boolean
}

export type BarZones = {
  readonly categoryIndex: number
  readonly cell: { readonly minX: number, readonly maxX: number }
  readonly items: readonly BarZone[]
}

export type ZoneJunction = {
  readonly from: number
  readonly to: number
  readonly gapStart: number
  readonly gapEnd: number
  readonly gapMid: number
  readonly boundary: number
  readonly nextBoundary: number
}

export type BarClassCounts = {
  readonly item: number
  readonly group: number
  readonly dataset: number
  readonly bars: number
  // Классы подсветки не должны оседать на родительском <g class="dataset">: targets — сами path
  readonly datasetGroups: number
}

const groupedPresets: BarPresetName[] = ['mixed', 'edges']
const stackedPresets: BarPresetName[] = ['positive', 'negative', 'mixed', 'edges']

const presetLabels: Record<BarPresetName, string> = {
  mixed: 'смешанные знаки',
  edges: 'нули, NaN, ±Infinity, пропуск',
  positive: 'только положительные',
  negative: 'только отрицательные',
}

export function barPresets(strategy: BarStrategyKind) {
  const names = strategy === 'grouped' ? groupedPresets : stackedPresets
  return names.map(value => ({ value, label: presetLabels[value] }))
}

// Пятая категория короче на один датасет: пропущенный индекс обязан не создавать item
function presetDatasets(strategy: BarStrategyKind, preset: BarPresetName): BarDataset[] {
  if (preset === 'edges') return [
    { classes: 's0', values: [40, 0, 25, NaN, 30] },
    { classes: 's1', values: [0, 45, Infinity, 20] },
    { classes: 's2', values: [strategy === 'grouped' ? -30 : 20, -Infinity, 0, 35, -15] },
  ]

  if (preset === 'positive') return [
    { classes: 's0', values: [30, 50, 20, 40, 35] },
    { classes: 's1', values: [25, 15, 45, 20, 30] },
    { classes: 's2', values: [15, 25, 10, 30, 20] },
  ]

  if (preset === 'negative') return [
    { classes: 's0', values: [-30, -50, -20, -40, -35] },
    { classes: 's1', values: [-25, -15, -45, -20, -30] },
    { classes: 's2', values: [-15, -25, -10, -30, -20] },
  ]

  return [
    { classes: 's0', values: [30, -20, 40, -35, 25] },
    { classes: 's1', values: [-25, 35, -15, 20, -30] },
    { classes: 's2', values: [20, 15, -30, 25, 10] },
  ]
}

export function defaultBarConfig(strategy: BarStrategyKind): BarChartConfig {
  return {
    preset: strategy === 'grouped' ? 'mixed' : 'positive',
    gaps: 'miss',
    hitArea: 'geometry',
    padding: 0.3,
    innerPadding: strategy === 'grouped' ? 6 : 4,
    radius: strategy === 'grouped' ? 4 : 6,
    innerRadius: 2,
    itemHighlight: true,
    groupHighlight: false,
    datasetHighlight: false,
    groupContainsHighlight: false,
    itemArea: false,
    groupArea: false,
    datasetAreas: false,
    itemHorizontalArea: false,
    probeCategory: 0,
    cropped: false,
  }
}

// Соседние зоны в режиме 'nearest' обязаны встречаться ровно в середине inner gap: boundary — стык
// слотов, gapMid — середина промежутка между отрисованными прямоугольниками. Нули из расчёта исключены:
// у них вырожденный rect на baseline, и собственной зоны они не имеют
export function zoneJunctions(items: readonly BarZone[], axis: 'x' | 'y'): ZoneJunction[] {
  const min = (zone: BarZone, rect: 'rect' | 'slotRect') => axis === 'x' ? zone[rect].minX : zone[rect].minY
  const max = (zone: BarZone, rect: 'rect' | 'slotRect') => axis === 'x' ? zone[rect].maxX : zone[rect].maxY

  const sorted = items.filter(item => item.value !== 0).sort((a, b) => min(a, 'rect') - min(b, 'rect'))

  const junctions: ZoneJunction[] = []
  for (let index = 0; index < sorted.length - 1; index++) {
    const current = sorted[index]
    const next = sorted[index + 1]

    junctions.push({
      from: current.datasetIndex,
      to: next.datasetIndex,
      gapStart: max(current, 'rect'),
      gapEnd: min(next, 'rect'),
      gapMid: (max(current, 'rect') + min(next, 'rect')) / 2,
      boundary: max(current, 'slotRect'),
      nextBoundary: min(next, 'slotRect'),
    })
  }

  return junctions
}

type Init = {
  strategy: BarStrategyKind
  config?: Partial<BarChartConfig>
}

// Один Bar, три selections от одного contains() — сам item, его группа и его датасет.
// Подсветки читают те же selections, что и таблицы, поэтому расхождение видно сразу
export class BarChart extends UniversalChart {

  readonly controller: InteractionController
  readonly strategy: BarStrategyKind

  readonly onItem = new EventEmitter<readonly BarItemHit[]>()
  readonly onGroup = new EventEmitter<readonly BarItemHit[]>()
  readonly onDataset = new EventEmitter<readonly BarItemHit[]>()
  // 0..1 хит, но эмитим как массив — тот же контракт, что и у onItem/onGroup/onDataset
  readonly onGroupContains = new EventEmitter<readonly BarGroupHit[]>()
  readonly onZones = new EventEmitter<BarZones>()

  private readonly bar: Bar
  private readonly itemHighlight: Highlight<BarItemHit>
  private readonly groupHighlight: Highlight<BarItemHit>
  private readonly datasetHighlight: Highlight<BarItemHit>
  private readonly groupContainsHighlight: Highlight<BarGroupHit>
  private readonly itemProbe: HitProbe<BarItemHit>
  private readonly groupProbe: HitProbe<BarItemHit>
  private readonly datasetProbe: HitProbe<BarItemHit>
  private readonly groupContainsProbe: HitProbe<BarGroupHit>
  // itemArea/groupArea читают один и тот же itemSelection — разница только в geometry-опции
  private readonly itemArea: VerticalArea<BarItemHit>
  private readonly groupArea: VerticalArea<BarItemHit>
  private readonly datasetAreas: VerticalArea<BarItemHit>
  private readonly itemHorizontalArea: HorizontalArea<BarItemHit>
  private readonly toggles: ComponentToggle

  private config: BarChartConfig
  private datasets: BarDataset[] = []
  private itemSelection: BarItemSelection
  private groupContainsSelection: Selection<BarGroupHit>
  private zonesSignature = ''

  // Данные, стратегия и selections пересобираются только при реальном изменении своих ключей: иначе
  // каждый чекбокс дёргал бы setDatasets и updateOptions, сбрасывая applied-классы подсветок
  private appliedKeys = { data: '', strategy: '', selection: '', bounds: '' }

  constructor(init: Init) {
    super({ layoutVariant: 'vertical', renderManager: globalChartRenderManagerSteps4 })

    this.strategy = init.strategy
    this.config = { ...defaultBarConfig(init.strategy), ...init.config }

    const { clip } = clipAndMask()

    this.bar = new Bar({ strategy: this.barStrategy() })
    const plotRoot = new PlotGroup().addPlot(this.bar)

    this.itemSelection = this.bar.interaction.contains({ gaps: this.config.gaps, hitArea: this.config.hitArea })
    this.groupContainsSelection = this.bar.interaction.containsGroup({ hitArea: this.config.hitArea })

    this.itemHighlight = new Highlight({ selection: this.itemSelection, class: 'bar-item-highlighted' })
    this.groupHighlight = new Highlight({ selection: this.itemSelection.related('group'), class: 'bar-group-highlighted' })
    this.datasetHighlight = new Highlight({ selection: this.itemSelection.related('dataset'), class: 'bar-dataset-highlighted' })
    // targets у group hit — все bar path категории: подсвечивает группу целиком даже когда
    // ни один item не найден, например у stacked hitArea: 'vertical' выше/ниже сегментов
    this.groupContainsHighlight = new Highlight({ selection: this.groupContainsSelection, class: 'bar-group-contains-highlighted' })

    // item — default geometry (сам bar), group — geometryFor('group'): один и тот же item selection,
    // разный выбор геометрии — related() здесь не участвует вовсе
    this.itemArea = new VerticalArea({ selection: this.itemSelection, classes: 'bar-item-area' })
    this.groupArea = new VerticalArea({ selection: this.itemSelection, geometry: 'group', classes: 'bar-group-area' })
    // related('dataset') отдаёт по item на каждую категорию датасета — разные groupRect, поэтому
    // несколько областей одновременно, а не дедуп в одну
    this.datasetAreas = new VerticalArea({ selection: this.itemSelection.related('dataset'), geometry: 'group', classes: 'bar-dataset-area' })
    this.itemHorizontalArea = new HorizontalArea({ selection: this.itemSelection, classes: 'bar-item-h-area' })

    this.itemProbe = new HitProbe(this.itemSelection, hits => this.onItem.emit(hits))
    this.groupProbe = new HitProbe(this.itemSelection.related('group'), hits => this.onGroup.emit(hits))
    this.datasetProbe = new HitProbe(this.itemSelection.related('dataset'), hits => this.onDataset.emit(hits))
    this.groupContainsProbe = new HitProbe(this.groupContainsSelection, hits => this.onGroupContains.emit(hits))

    this.controller = new InteractionController('hover')
    this.toggles = new ComponentToggle(this.controller)
    this.controller.addComponent(new ZoomChartComponent({ chart: this, zoom: true, panDirection: 'horizontal' }))
    this.controller.addComponent(this.itemProbe)
    this.controller.addComponent(this.groupProbe)
    this.controller.addComponent(this.datasetProbe)
    this.controller.addComponent(this.groupContainsProbe)

    buildChartScaffold({ chart: this, plotRoot, controller: this.controller, clip })

    this.onAfterRender.on(() => this.publishZones())
    this.applyConfig()
  }

  setConfig(config: Partial<BarChartConfig>) {
    this.config = { ...this.config, ...config }
    this.applyConfig()
    return this
  }

  resetView() {
    return resetChartView(this)
  }

  // Повторный setDatasets поверх активного ховера: с прежним setAttribute('class') он стирал бы классы
  // Highlight, и diff подсветки разъехался бы с DOM
  refreshDatasets() {
    this.datasets = presetDatasets(this.strategy, this.config.preset)
    this.bar.setDatasets(this.datasets)
    return this
  }

  // Сырые значения категории: строка без layout-записи и есть доказательство, что пропуск,
  // NaN и ±Infinity item не создают
  rawValues(categoryIndex: number): (number | undefined)[] {
    return this.datasets.map(dataset => dataset.values[categoryIndex])
  }

  // Точный target set: классы обязаны стоять на каждом path датасета, а не на родительском <g class="dataset">
  classCounts(): BarClassCounts {
    return {
      item: this.svg.querySelectorAll('path.bar.bar-item-highlighted').length,
      group: this.svg.querySelectorAll('path.bar.bar-group-highlighted').length,
      dataset: this.svg.querySelectorAll('path.bar.bar-dataset-highlighted').length,
      bars: this.svg.querySelectorAll('path.bar').length,
      datasetGroups: this.svg.querySelectorAll('g.dataset.bar-item-highlighted, g.dataset.bar-group-highlighted, g.dataset.bar-dataset-highlighted').length,
    }
  }

  // Число реально отрисованных <rect>: group — дедуп N item hits одной категории в одну область,
  // dataset — N item hits разных категорий, каждая со своим range
  areaCounts(): BarAreaCounts {
    return {
      item: this.svg.querySelectorAll('rect.bar-item-area').length,
      group: this.svg.querySelectorAll('rect.bar-group-area').length,
      dataset: this.svg.querySelectorAll('rect.bar-dataset-area').length,
      itemHorizontal: this.svg.querySelectorAll('rect.bar-item-h-area').length,
    }
  }

  // Класс-атрибут конкретного bar целиком: единственный способ увидеть, что item и dataset классы
  // лежат на одном элементе одновременно
  barClasses(datasetIndex: number, categoryIndex: number): string {
    const bar = this.svg.querySelector(`path.bar[data-dataset-index="${datasetIndex}"][data-index="${categoryIndex}"]`)
    return bar?.getAttribute('class') ?? ''
  }

  private barStrategy(): BarStrategy {
    const base = { padding: this.config.padding, radius: this.config.radius, innerPadding: this.config.innerPadding }
    return this.strategy === 'grouped'
      ? { type: 'grouped', ...base }
      : { type: 'stacked', ...base, innerRadius: this.config.innerRadius }
  }

  private publishZones() {
    const space = this.space
    const categoryIndex = this.config.probeCategory

    const zones: BarZones = {
      categoryIndex,
      cell: { minX: space.chartToLayoutX(categoryIndex), maxX: space.chartToLayoutX(categoryIndex + 1) },
      items: this.bar.getCategoryLayout(categoryIndex, space).map(item => ({
        datasetIndex: item.datasetIndex,
        value: item.value,
        rect: item.rect,
        slotRect: item.slotRect,
        groupRect: item.groupRect,
        drawn: (item.target.getAttribute('d') ?? '') !== '',
      })),
    }

    const signature = JSON.stringify(zones)
    if (signature === this.zonesSignature) return

    this.zonesSignature = signature
    this.onZones.emit(zones)
  }

  private applyConfig() {
    const { preset, gaps, hitArea, padding, innerPadding, radius, innerRadius, cropped } = this.config
    const strategyKey = `${padding}:${innerPadding}:${radius}:${innerRadius}`
    const boundsKey = String(cropped)
    const selectionKey = `${gaps}:${hitArea}`

    if (strategyKey !== this.appliedKeys.strategy) {
      this.appliedKeys.strategy = strategyKey
      this.bar.setStrategy(this.barStrategy())
    }

    if (preset !== this.appliedKeys.data) {
      this.appliedKeys.data = preset
      this.refreshDatasets()
    }

    if (selectionKey !== this.appliedKeys.selection) {
      this.appliedKeys.selection = selectionKey

      // Новая gap policy/hitArea — новый узел графа: selections immutable
      this.itemSelection = this.bar.interaction.contains({ gaps, hitArea })
      this.groupContainsSelection = this.bar.interaction.containsGroup({ hitArea })
      const group = this.itemSelection.related('group')
      const dataset = this.itemSelection.related('dataset')

      this.itemHighlight.updateOptions({ selection: this.itemSelection, class: 'bar-item-highlighted' })
      this.groupHighlight.updateOptions({ selection: group, class: 'bar-group-highlighted' })
      this.datasetHighlight.updateOptions({ selection: dataset, class: 'bar-dataset-highlighted' })
      this.groupContainsHighlight.updateOptions({ selection: this.groupContainsSelection, class: 'bar-group-contains-highlighted' })

      this.itemProbe.setSelection(this.itemSelection)
      this.groupProbe.setSelection(group)
      this.datasetProbe.setSelection(dataset)
      this.groupContainsProbe.setSelection(this.groupContainsSelection)

      this.itemArea.updateOptions({ selection: this.itemSelection, classes: 'bar-item-area' })
      this.groupArea.updateOptions({ selection: this.itemSelection, geometry: 'group', classes: 'bar-group-area' })
      this.datasetAreas.updateOptions({ selection: dataset, geometry: 'group', classes: 'bar-dataset-area' })
      this.itemHorizontalArea.updateOptions({ selection: this.itemSelection, classes: 'bar-item-h-area' })
    }

    // Обрезанная область оставляет часть категорий за render bounds: related('dataset') обязан
    // отвечать и по ним, хотя renderImpl их пропустил
    if (boundsKey !== this.appliedKeys.bounds) {
      this.appliedKeys.bounds = boundsKey
      if (cropped) this.setRenderBounds({ minX: 1, maxX: 3, minY: null, maxY: null })
      else this.setRenderBounds({ minX: null, maxX: null, minY: null, maxY: null })
    }

    this.toggles.set(this.itemHighlight, this.config.itemHighlight)
    this.toggles.set(this.groupHighlight, this.config.groupHighlight)
    this.toggles.set(this.datasetHighlight, this.config.datasetHighlight)
    this.toggles.set(this.groupContainsHighlight, this.config.groupContainsHighlight)
    this.toggles.set(this.itemArea, this.config.itemArea)
    this.toggles.set(this.groupArea, this.config.groupArea)
    this.toggles.set(this.datasetAreas, this.config.datasetAreas)
    this.toggles.set(this.itemHorizontalArea, this.config.itemHorizontalArea)

    this.zonesSignature = ''
    this.scheduleRender()
  }
}
