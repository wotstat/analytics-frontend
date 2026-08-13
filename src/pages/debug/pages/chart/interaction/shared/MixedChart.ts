import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { HorizontalArea } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/areas/HorizontalArea'
import { VerticalArea } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/areas/VerticalArea'
import { ChartTooltip, TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { Highlight } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/highlight/Highlight'
import { HorizontalLine } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/lines/HorizontalLine'
import { VerticalLine } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/lines/VerticalLine'
import { MarkerOverlay } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/markerOverlay/MarkerOverlay'
import { PolygonArea } from '@/shared/uiKit/chart/universalChart/plot/area/PolygonArea'
import { PolygonHit } from '@/shared/uiKit/chart/universalChart/plot/area/PolygonAreaInteractionSource'
import { Bar, BarDataset } from '@/shared/uiKit/chart/universalChart/plot/bar/Bar'
import { BarItemHit } from '@/shared/uiKit/chart/universalChart/plot/bar/BarInteractionSource'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { LinePointHit, LineStrokeHit } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLineInteractionSource'
import { AutoMarkerDatum, AutoMarkers } from '@/shared/uiKit/chart/universalChart/plot/markers/autoMarkers/AutoMarkers'
import { AutoMarkerHit } from '@/shared/uiKit/chart/universalChart/plot/markers/autoMarkers/AutoMarkersInteractionSource'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { EventEmitter } from '@/shared/uiKit/chart/universalChart/utils/EventEmitter'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import type { Point } from '@/shared/uiKit/chart/universalChart/utils/Point'
import { baseMarkerOptions, buildChartScaffold, clipAndMask, resetChartView } from './chartScaffold'

export type MixedLinePoint = { readonly x: number, readonly y: number, readonly label: string }
export type MixedScatterPoint = AutoMarkerDatum & { readonly label: string }

export type MixedLineHit = LinePointHit<MixedLinePoint>
export type MixedLineStrokeHit = LineStrokeHit<MixedLinePoint>
export type MixedBarHit = BarItemHit
export type MixedScatterHit = AutoMarkerHit<MixedScatterPoint>
export type MixedPolygonHit = PolygonHit
export type MixedHit = MixedLineHit | MixedBarHit | MixedScatterHit | MixedPolygonHit

const CATEGORY_COUNT = 6

function barDatasets(variant: 'a' | 'b'): BarDataset[] {
  if (variant === 'b') return [
    { classes: 's0', values: [22, 14, 32, 9, 27, 16] },
    { classes: 's1', values: [10, 26, 12, 30, 14, 24] },
  ]

  return [
    { classes: 's0', values: [12, 28, 18, 35, 8, 22] },
    { classes: 's1', values: [20, 10, 30, 15, 25, 18] },
  ]
}

// x = i + 0.5 — центр каждой bar-группы: наведение около бара естественно попадает и в ближайший X линий
function linePoint(series: string, i: number, y: number): MixedLinePoint {
  return { x: i + 0.5, y, label: `${series}${i}` }
}

// lineB[3] — намеренный null: демонстрирует «есть X-победитель, но у линии в нём разрыв»
function linePoints(variant: 'a' | 'b'): [MixedLinePoint[], (MixedLinePoint | null)[]] {
  const shift = variant === 'b' ? 20 : 0

  const a = Array.from({ length: CATEGORY_COUNT }, (_, i) => linePoint('A', i, shift + 60 + 25 * Math.sin(i * 0.9)))
  const b: (MixedLinePoint | null)[] = Array.from({ length: CATEGORY_COUNT }, (_, i) =>
    i === 3 ? null : linePoint('B', i, shift + 90 + 20 * Math.cos(i * 0.7)))

  return [a, b]
}

function scatterPoints(variant: 'a' | 'b'): MixedScatterPoint[] {
  const dy = variant === 'b' ? 15 : 0
  return [
    { x: 0.5, y: 130 + dy, size: 5, label: 'S1' },
    { x: 2.2, y: 148 + dy, size: 4, label: 'S2' },
    { x: 3.8, y: 122 + dy, size: 7, label: 'S3' },
    { x: 5.3, y: 140 + dy, size: 5, label: 'S4' },
  ]
}

function polygonPoints(variant: 'a' | 'b'): Point[] {
  const dx = variant === 'b' ? 1.2 : 0
  return [
    { x: 1.2 + dx, y: 160 },
    { x: 3.0 + dx, y: 165 },
    { x: 3.2 + dx, y: 195 },
    { x: 1.6 + dx, y: 205 },
    { x: 0.8 + dx, y: 185 },
  ]
}

// Приёмочный стенд: Bar, две линии, scatter и PolygonArea одновременно, все relevant
// highlights, вертикальные/горизонтальные линии и области, MarkerOverlay и ChartTooltip с isHighlighted().
// Это не изолированный тест одного механизма, а демонстрация того, что все они работают вместе
// на одном контроллере без взаимных допущений
export class MixedChart extends UniversalChart {

  readonly controller: InteractionController

  readonly lineHighlight: Highlight<MixedLineStrokeHit>
  readonly barItemHighlight: Highlight<MixedBarHit>
  readonly barDatasetHighlight: Highlight<MixedBarHit>
  readonly scatterHighlight: Highlight<MixedScatterHit>
  readonly polygonHighlight: Highlight<MixedPolygonHit>
  readonly tooltip: ChartTooltip<MixedHit>

  readonly onTooltip = new EventEmitter<TooltipCtx<MixedHit> | null>()

  private readonly lineA: AutoLine<MixedLinePoint>
  private readonly lineB: AutoLine<MixedLinePoint>
  private readonly bar: Bar
  private readonly scatter: AutoMarkers<MixedScatterPoint>
  private readonly polygon: PolygonArea

  private lineVariant: 'a' | 'b' = 'a'
  private barVariant: 'a' | 'b' = 'a'
  private scatterVariant: 'a' | 'b' = 'a'
  private polygonVariant: 'a' | 'b' = 'a'

  constructor() {
    super({ layoutVariant: 'vertical', renderManager: globalChartRenderManagerSteps4 })

    const { clip, mask, maskRoot } = clipAndMask()

    this.bar = new Bar({ strategy: { type: 'grouped', padding: 0.35, radius: 3, innerPadding: 3 } })
    this.polygon = new PolygonArea(['polygon-demo'])
    this.lineA = new AutoLine<MixedLinePoint>({ classes: ['main-line', 's0'], smoothingMethod: 'monotone' })
    this.lineB = new AutoLine<MixedLinePoint>({ classes: ['main-line', 's1'], smoothingMethod: 'monotone' })
    this.scatter = new AutoMarkers<MixedScatterPoint>({ classes: 'scatter-markers', targetMasks: [maskRoot] })

    const plotRoot = new PlotGroup()
      .addPlot(this.bar)
      .addPlot(this.polygon)
      .addPlot(this.lineA)
      .addPlot(this.lineB)
      .addPlot(this.scatter)

    this.bar.setDatasets(barDatasets(this.barVariant))
    const [pointsA, pointsB] = linePoints(this.lineVariant)
    this.lineA.setPoints(pointsA)
    this.lineB.setPoints(pointsB)
    this.scatter.setMarkers(scatterPoints(this.scatterVariant))
    this.polygon.setPoints(polygonPoints(this.polygonVariant))

    // Source union только между совместимыми line sources — до запроса
    const lines = this.lineA.interaction.union(this.lineB.interaction)
    const linePointsByX = lines.nearestByAxis('x')
    const lineNearStroke = lines.nearStroke({ maxDistance: 6 }).nearest()

    const barItem = this.bar.interaction.contains({ gaps: 'miss' })
    const barGroup = barItem.related('group')
    const barDataset = barItem.related('dataset')

    const scatterPoint = this.scatter.interaction.nearestPoint({ maxDistance: 8 })

    const hoveredPolygon = this.polygon.interaction.contains().topmost()

    // Heterogeneous union — после query, не source union
    const tooltipSelection = linePointsByX
      .union(barGroup)
      .union(scatterPoint)
      .union(hoveredPolygon)

    this.lineHighlight = new Highlight({ selection: lineNearStroke, class: 'line-highlighted' })
    this.barDatasetHighlight = new Highlight({ selection: barDataset, class: 'bar-dataset-highlighted' })
    this.barItemHighlight = new Highlight({ selection: barItem, class: 'bar-item-highlighted' })
    this.scatterHighlight = new Highlight({ selection: scatterPoint, class: 'scatter-highlighted' })
    this.polygonHighlight = new Highlight({ selection: hoveredPolygon, class: 'polygon-highlighted' })

    this.tooltip = new ChartTooltip<MixedHit>({
      selection: tooltipSelection,
      tooltipPivot: 'cursor',
      exposeHighlights: [this.lineHighlight, this.barDatasetHighlight, this.barItemHighlight, this.scatterHighlight, this.polygonHighlight],
      onPositionChange: ctx => this.onTooltip.emit(ctx),
      onHide: () => this.onTooltip.emit(null),
    })

    this.controller = new InteractionController()
    this.controller
      .addComponent(this.lineHighlight)
      .addComponent(this.barDatasetHighlight)
      .addComponent(this.barItemHighlight)
      .addComponent(this.scatterHighlight)
      .addComponent(this.polygonHighlight)

      .addComponent(new VerticalLine({ selection: linePointsByX }))
      .addComponent(new MarkerOverlay({
        ...baseMarkerOptions(maskRoot),
        selection: linePointsByX,
        classesForHit: hit => hit.sourceId === this.lineA.interaction.id ? 's0' : 's1',
      }))

      .addComponent(new VerticalArea({ selection: barItem, geometry: 'group', classes: 'bar-group-area' }))
      .addComponent(new VerticalArea({ selection: hoveredPolygon, classes: 'polygon-area' }))
      .addComponent(new HorizontalArea({ selection: hoveredPolygon, classes: 'polygon-area' }))

      .addComponent(new VerticalLine({ selection: scatterPoint, classes: 'scatter-guide' }))
      .addComponent(new HorizontalLine({ selection: scatterPoint, classes: 'scatter-guide' }))

      .addComponent(this.tooltip)

    buildChartScaffold({ chart: this, plotRoot, controller: this.controller, clip, mask })

    this.setRenderBounds({ minX: -0.4, maxX: 6.4, minY: -10, maxY: 215 })
  }

  resetView() {
    return resetChartView(this)
  }

  // Данные меняются без единого updateOptions(): selections читают plot state заново на каждом кадре
  changeBarData() {
    this.barVariant = this.barVariant === 'a' ? 'b' : 'a'
    this.bar.setDatasets(barDatasets(this.barVariant))
  }

  changeLineData() {
    this.lineVariant = this.lineVariant === 'a' ? 'b' : 'a'
    const [pointsA, pointsB] = linePoints(this.lineVariant)
    this.lineA.setPoints(pointsA)
    this.lineB.setPoints(pointsB)
  }

  changeScatterData() {
    this.scatterVariant = this.scatterVariant === 'a' ? 'b' : 'a'
    this.scatter.setMarkers(scatterPoints(this.scatterVariant))
  }

  changePolygonData() {
    this.polygonVariant = this.polygonVariant === 'a' ? 'b' : 'a'
    this.polygon.setPoints(polygonPoints(this.polygonVariant))
  }

  barClasses(datasetIndex: number, categoryIndex: number): string {
    const bar = this.svg.querySelector(`path.bar[data-dataset-index="${datasetIndex}"][data-index="${categoryIndex}"]`)
    return bar?.getAttribute('class') ?? ''
  }

  domCounts() {
    return {
      // Одна недекорированная line.hover-line — VerticalLine на linePointsByX; scatter guides помечены отдельно
      verticalLine: this.svg.querySelectorAll('line.hover-line:not(.scatter-guide)').length,
      lineMarker: this.svg.querySelectorAll('.hover-markers .hover-marker').length,
      lineHighlighted: this.svg.querySelectorAll('.line-highlighted').length,
      barGroupArea: this.svg.querySelectorAll('rect.bar-group-area').length,
      polygonArea: this.svg.querySelectorAll('rect.polygon-area').length,
      scatterGuide: this.svg.querySelectorAll('line.hover-line.scatter-guide').length,
    }
  }
}
