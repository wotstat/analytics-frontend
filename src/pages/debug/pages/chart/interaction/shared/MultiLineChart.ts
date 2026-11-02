import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { ChartTooltip, ChartTooltipOptions, TooltipCtx, TooltipPivot } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { InteractionPresentation, type Spring } from '@/shared/uiKit/chart/universalChart/interaction/composable/presentation/InteractionPresentation'
import { createInteractionBinding } from '@/shared/uiKit/chart/universalChart/interaction/core/InteractionBinding'
import type { LineOptions } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/lines/BaseLine'
import { VerticalLine } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/lines/VerticalLine'
import { MarkerOverlay, MarkerOverlayInput, MarkerOverlayOptions } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/markerOverlay/MarkerOverlay'
import { ZoomChartComponent } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/zoomChartComponent/ZoomChartComponent'
import { CursorHit, cursorSelection } from '@/shared/uiKit/chart/universalChart/interaction/core/CursorSelection'
import { Selection } from '@/shared/uiKit/chart/universalChart/interaction/core/Selection'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { AutoLineInteraction, LinePointHit } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLineInteractionSource'
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
  tooltipPivot: Extract<TooltipPivot<ComposedHit>, string>
  presentation: false | {
    motion?: Spring | { points?: Spring, cursor?: Spring, anchor?: Spring }
    followLine?: boolean
  }
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
    presentation: false,
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

// Три совместимые линии объединяются до запроса через AutoLineInteraction.union(),
// и все overlay считают по одной композиции selections
export class MultiLineChart extends UniversalChart {

  readonly controller: InteractionController
  readonly onTooltip = new EventEmitter<TooltipCtx<ComposedHit> | null>()
  readonly onTooltipEvent = new EventEmitter<'show' | 'hide'>()
  readonly onSnapshot = new EventEmitter<CompositionSnapshot<ComposedHit>>()

  private readonly lines: AutoLine<LinePoint>[] = []
  private readonly interaction: AutoLineInteraction<LinePoint>
  private readonly cursor = cursorSelection()
  private readonly maskRoot: Element

  private readonly verticalLine: VerticalLine
  private readonly marker: MarkerOverlay<ComposedHit>
  private readonly tooltip: ChartTooltip<ComposedHit>
  private readonly probe: CompositionProbe<ComposedHit>
  private readonly toggles: ComponentToggle

  private config: CompositionConfig
  private presentation: InteractionPresentation | null = null

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

    this.interaction = AutoLineInteraction.union(
      this.lines[0].interaction,
      this.lines[1].interaction,
      this.lines[2].interaction
    )

    const initial = this.buildSelections()
    this.verticalLine = new VerticalLine({ selection: initial.composed })
    this.marker = new MarkerOverlay(this.markerOptions({ selection: initial.composed }))
    this.tooltip = new ChartTooltip(this.tooltipOptions({ selection: initial.composed }))
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

    let points: Selection<MultiLineHit> = this.interaction.nearestByAxis('horizontal', options)

    // Тот же bucket второй раз: дубликаты обязаны сохранить позицию из левой и содержимое из правой
    const right = this.config.duplicateUnion ? this.lines[1].interaction.nearestByAxis('horizontal', options) : null
    if (right) points = points.union(right)

    if (this.config.maxDistance !== null) points = points.within({ maxDistance: this.config.maxDistance })

    let composed: Selection<ComposedHit> = points
    if (this.config.cursorUnion) composed = composed.union(this.cursor)
    if (this.config.cursorFallback) composed = composed.orElse(this.cursor)

    return { points, composed, right }
  }

  private markerOptions(input: MarkerOverlayInput<ComposedHit>): MarkerOverlayOptions<ComposedHit> {
    return {
      ...baseMarkerOptions(this.maskRoot),
      ...input,
      classesForHit: hit => this.classesForHit(hit),
    }
  }

  private tooltipOptions(input: Pick<ChartTooltipOptions<ComposedHit>, 'selection' | 'binding' | 'cursorBinding'>): ChartTooltipOptions<ComposedHit> {
    return {
      ...input,
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
    const { points, composed, right } = this.buildSelections()

    const series = presetSeries(this.config.preset)
    for (let i = 0; i < this.lines.length; i++) this.lines[i].setPoints(series[i] ?? [])

    if (this.presentation) this.controller.removeComponent(this.presentation)
    this.presentation = null
    let lineInput: LineOptions = { selection: composed }
    let markerInput: MarkerOverlayInput<ComposedHit> = { selection: composed }
    let tooltipInput: Pick<ChartTooltipOptions<ComposedHit>, 'selection' | 'binding' | 'cursorBinding'> = { selection: composed }
    if (this.config.presentation) {
      const { followLine, motion = {} } = this.config.presentation
      const profiles = 'response' in motion ? { points: motion, cursor: motion, anchor: motion } : motion
      const presentation = new InteractionPresentation({ motion: profiles.points })
      this.presentation = presentation
      if (followLine) {
        const x = presentation.animate(points.axis('horizontal'))
        const projected = presentation.project(points, x, this.interaction.alongAxis('horizontal', {
          maxAxisDistance: this.config.maxAxisDistance ?? undefined,
        }))
        const cursorHits = composed.filter((hit): hit is CursorHit => hit.kind === 'cursor')
        const cursors = presentation.animate(cursorHits.anchors(), profiles.cursor)
        markerInput = { binding: presentation.merge<ComposedHit>(projected, cursors) }
        const cursorX = presentation.animate(cursorHits.coordinates('horizontal'), profiles.cursor)
        lineInput = { binding: createInteractionBinding(frame => {
          const value = x.read(frame)
          const coordinates = cursorX.read(frame)
          return value === null ? coordinates : [{ key: 'points', value }, ...coordinates]
        }) }
      } else {
        markerInput = { binding: presentation.animate(composed.anchors()) }
        lineInput = { binding: presentation.animate(composed.coordinates('horizontal')) }
      }

      const cursorBinding = presentation.animate(composed.cursor(), profiles.cursor)
      tooltipInput = {
        selection: composed,
        cursorBinding,
        binding: this.config.tooltipPivot === 'cursor' ? cursorBinding : presentation.animate(
          composed.pivot(this.config.tooltipPivot), profiles.anchor ?? profiles.points
        ),
      }

      this.controller.addComponent(presentation)
    }

    this.verticalLine.updateOptions(lineInput)
    this.marker.updateOptions(this.markerOptions(markerInput))
    this.tooltip.updateOptions(this.tooltipOptions(tooltipInput))
    this.probe.setSelections(composed, right)

    this.toggles.set(this.verticalLine, this.config.verticalLine)
    this.toggles.set(this.marker, this.config.marker)
    this.toggles.set(this.tooltip, this.config.tooltip)

    this.scheduleRender()
  }
}
