import { ref } from 'vue'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { ChartClip } from '@/shared/uiKit/chart/universalChart/defs/ChartClip'
import { ChartMask } from '@/shared/uiKit/chart/universalChart/defs/ChartMask'
import { AutoLabels } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { steppedOverrides } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/steppedGenerator'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { TicksByLabels } from '@/shared/uiKit/chart/universalChart/ticks/TicksByLabels'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { InteractionComponent } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { InteractionDirection } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/BaseInteractionController'
import { ChartTooltip, TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { CallbackComponent } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/callback/CallbackComponent'
import { ZoomChartComponent } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/zoomChartComponent/ZoomChartComponent'
import { BoundsSynchronizer } from '@/shared/uiKit/chart/universalChart/interaction/composable/sync/BoundsSynchronizer'
import type { ChartSeries } from '@/pages/debug/shared/fixtures/types'
import { GatedHoverSync } from './GatedHoverSync'
import { ObservableInteractionController } from './ObservableInteractionController'
import {
  RebuildableHorizontalLine, RebuildableNearestMarker, RebuildableVerticalLine
} from './rebuildableComponents'

// Позиции у компонентов разные: линии умеют 'cursor', маркер и тултип — 'nearest-data-point'.
export type LinePosition = 'cursor' | 'data-point-x' | 'data-point-y' | 'data-point'
export type PointPosition = 'data-point-x' | 'data-point-y' | 'data-point' | 'nearest-data-point'

export type HoverConfig = {
  verticalLine: boolean
  horizontalLine: boolean
  marker: boolean
  tooltip: boolean
  linePosition: LinePosition
  pointPosition: PointPosition
  lineOffset: number
  activateDistance: number | null
  outOfDistanceVisibility: boolean
  tooltipPivot: 'avg' | 'nearest' | 'cursor'
  markerSize: number
}

export type ZoomConfig = {
  zoom?: boolean
  panDirection?: InteractionDirection
  autoFitFollow?: boolean | number
  deceleration?: { mousePan?: number, touchPan?: number, touchZoom?: number }
  boundsSync?: BoundsSynchronizer
  limits?: {
    minX?: number
    minY?: number
    maxX?: number
    maxY?: number
    minDeltaX?: number
    minDeltaY?: number
    maxDeltaX?: number
    maxDeltaY?: number
    elastic?: boolean
  }
}

export function defaultHover(): HoverConfig {
  return {
    verticalLine: true,
    horizontalLine: false,
    marker: true,
    tooltip: true,
    linePosition: 'data-point-x',
    pointPosition: 'data-point-x',
    lineOffset: 0,
    activateDistance: null,
    outOfDistanceVisibility: false,
    tooltipPivot: 'avg',
    markerSize: 4,
  }
}

export function defaultZoom(): ZoomConfig {
  return { zoom: true, panDirection: 'horizontal', autoFitFollow: true }
}

const STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 25000, 50000, 100000]

function formatValue(value: number) {
  if (Math.abs(value) >= 10000) return `${Math.round(value / 1000)}k`
  return `${Math.round(value)}`
}

type Init = {
  seriesCount?: number
  hoverSync?: GatedHoverSync
  hover?: Partial<HoverConfig>
  zoom?: ZoomConfig
}

// Минимальная подложка: линии, две оси с подписями и настраиваемый InteractionController.
// Тема страницы — интерактив, поэтому всё остальное сведено к необходимому.
export class DemoChart extends UniversalChart {

  readonly tooltipCtx = ref<TooltipCtx | null>(null)
  readonly callback = new CallbackComponent()
  readonly controller: ObservableInteractionController
  readonly zoomComponent: ZoomChartComponent

  private readonly lines: AutoLine[] = []
  private readonly maskMain: ChartMask
  private readonly hoverSync: GatedHoverSync | null
  private hoverComponents: InteractionComponent[] = []
  private hover: HoverConfig

  constructor(init: Init = {}) {
    super({ layoutVariant: 'vertical', renderManager: globalChartRenderManagerSteps4 })

    this.hover = { ...defaultHover(), ...init.hover }
    this.hoverSync = init.hoverSync ?? null

    const clipMain = new ChartClip('center', { top: -1, bottom: -1 })
    const clipLeft = new ChartClip('left')
    const clipBottom = new ChartClip('bottom')
    this.maskMain = new ChartMask('center', { top: -1, bottom: -1 })

    const labelsX = new AutoLabels('horizontal', {
      values: steppedOverrides({ step: STEPS }),
      labelForValue: formatValue,
      padding: 10,
      labelOffset: 5,
      strategy: 'classic-flow',
    }).clipBy(clipBottom)

    const labelsY = new AutoLabels('vertical', {
      values: steppedOverrides({ step: STEPS }),
      labelForValue: formatValue,
      padding: { clip: 10, flow: 5 },
      labelOffset: 5,
      onlyFitted: true,
      strategy: 'classic-flow',
    }).clipBy(clipLeft)

    const plotRoot = new PlotGroup()
    for (let i = 0; i < (init.seriesCount ?? 1); i++) {
      const line = new AutoLine({ classes: ['main-line', `s${i}`], smoothingMethod: 'monotone' })
      this.lines.push(line)
      plotRoot.addPlot(line)
    }
    plotRoot.maskBy(this.maskMain).clipBy(clipMain)

    this.zoomComponent = new ZoomChartComponent({ chart: this, ...(init.zoom ?? defaultZoom()) })
    this.controller = new ObservableInteractionController('hover')
    this.controller.addComponent(this.zoomComponent)

    this
      .addPlot(new TicksByLabels(labelsY, { start: 0 }), 'ticks')
      .addPlot(new TicksByLabels(labelsX, { start: 0 }), 'ticks')
      .addPlot(plotRoot, 'plot')
      .addSlot('bottom', labelsX, 'labels')
      .addSlot('left', labelsY, 'labels')
      .addPlot(this.controller)
      .addDefs(clipMain, clipLeft, clipBottom, this.maskMain)

    this.setMinLayoutSize({ right: 5, top: 5 })
    this.applyHover()
  }

  setSeries(series: ChartSeries[]) {
    for (let i = 0; i < this.lines.length; i++) this.lines[i].setPoints(series[i] ?? [])
    this.controller.setDataSources(...series.slice(0, this.lines.length))
    return this
  }

  setHover(hover: Partial<HoverConfig>) {
    this.hover = { ...this.hover, ...hover }
    this.applyHover()
    return this
  }

  setZoom(zoom: ZoomConfig) {
    this.zoomComponent.updateOptions({ chart: this, ...zoom })
    this.scheduleRender()
    return this
  }

  // Отпускает все оси обратно в авто-подгонку по данным.
  resetView() {
    this.setRenderBounds({ minX: null, maxX: null, minY: null, maxY: null })
    return this
  }

  // Опции компонентов задаются в конструкторе, поэтому переключение любого тумблера —
  // это пересборка набора. Порядок фиксирован: зум уже добавлен, дальше консьюмеры
  // hover-sync, потом сам хаб (его onBeforeLayout обязан идти после зума), потом коллбеки.
  private applyHover() {
    for (const component of this.hoverComponents) this.controller.removeComponent(component)
    this.hoverComponents = []

    const hover = this.hover
    const sync = this.hoverSync ?? undefined
    const activateDistance = hover.activateDistance ?? undefined

    if (hover.verticalLine) this.add(new RebuildableVerticalLine({
      position: hover.linePosition,
      offset: { start: hover.lineOffset, end: hover.lineOffset },
      activateDistance,
      outOfDistanceVisibility: hover.outOfDistanceVisibility,
      hoverSync: sync,
    }))

    if (hover.horizontalLine) this.add(new RebuildableHorizontalLine({
      position: hover.linePosition,
      offset: { start: hover.lineOffset, end: hover.lineOffset },
      activateDistance,
      outOfDistanceVisibility: hover.outOfDistanceVisibility,
      hoverSync: sync,
    }))

    if (hover.marker) this.add(new RebuildableNearestMarker({
      classes: 'markers',
      markerClasses: 'hover-marker',
      classesForDataSource: ['m0', 'm1', 'm2'],
      size: hover.markerSize,
      maskSize: hover.markerSize + 2,
      targetMasks: [this.maskMain.root],
      position: hover.pointPosition,
      activateDistance,
      hoverSync: sync,
    }))

    if (hover.tooltip) this.add(new ChartTooltip({
      position: hover.pointPosition,
      tooltipPivot: hover.tooltipPivot,
      activateDistance,
      onHide: () => this.tooltipCtx.value = null,
      onPositionChange: ctx => this.tooltipCtx.value = ctx,
      hoverSync: sync,
    }))
    else this.tooltipCtx.value = null

    if (this.hoverSync) this.add(this.hoverSync.hub)
    this.add(this.callback)

    this.scheduleRender()
  }

  private add(component: InteractionComponent) {
    this.hoverComponents.push(component)
    this.controller.addComponent(component)
  }
}
