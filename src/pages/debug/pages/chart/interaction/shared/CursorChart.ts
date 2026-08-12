import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { ChartClip } from '@/shared/uiKit/chart/universalChart/defs/ChartClip'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { InteractionDirection } from '@/shared/uiKit/chart/universalChart/interaction/baseInteractionController/BaseInteractionController'
import { CallbackComponent } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/callback/CallbackComponent'
import { ZoomChartComponent } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/zoomChartComponent/ZoomChartComponent'
import { VerticalLine } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/lines/VerticalLine'
import { HorizontalLine } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/lines/HorizontalLine'
import { cursorSelection } from '@/shared/uiKit/chart/universalChart/interaction/core/CursorSelection'
import type { ChartSeries } from '@/pages/debug/shared/fixtures/types'
import { buildChartScaffold, resetChartView } from './chartScaffold'
import { ComponentToggle } from './ComponentToggle'

export type CursorConfig = {
  verticalLine: boolean
  horizontalLine: boolean
  offset: number
  accent: boolean
}

export type ZoomConfig = {
  zoom?: boolean
  panDirection?: InteractionDirection
  autoFitFollow?: boolean | number
  limits?: {
    minX?: number
    maxX?: number
    minDeltaX?: number
    maxDeltaX?: number
    elastic?: boolean
  }
}

export function defaultCursor(): CursorConfig {
  return { verticalLine: true, horizontalLine: false, offset: 0, accent: false }
}

type Init = {
  seriesCount?: number
  cursor?: Partial<CursorConfig>
  zoom?: ZoomConfig
}

// Линии для контекста, две оси и InteractionController с курсорными overlay.
// Данных у selections ещё нет — обе линии следуют за курсором через cursorSelection()
export class CursorChart extends UniversalChart {

  readonly callback = new CallbackComponent()
  readonly controller: InteractionController
  readonly zoomComponent: ZoomChartComponent

  private readonly lines: AutoLine[] = []
  private readonly cursor = cursorSelection()

  // Компоненты живут столько же, сколько чарт: тумблеры их подключают и отключают,
  // всё остальное меняется через updateOptions
  private readonly verticalLine = new VerticalLine({ selection: this.cursor })
  private readonly horizontalLine = new HorizontalLine({ selection: this.cursor })
  private readonly toggles: ComponentToggle

  private config: CursorConfig

  constructor(init: Init = {}) {
    super({ layoutVariant: 'vertical', renderManager: globalChartRenderManagerSteps4 })

    this.config = { ...defaultCursor(), ...init.cursor }

    // Инсет ±1px как у остальных демо-чартов: иначе hairline stroke ровно на границе layout обрезается
    const clipMain = new ChartClip('center', { top: -1, bottom: -1 })
    const plotRoot = new PlotGroup()
    for (let i = 0; i < (init.seriesCount ?? 1); i++) {
      const line = new AutoLine({ classes: ['main-line', `s${i}`], smoothingMethod: 'monotone' })
      this.lines.push(line)
      plotRoot.addPlot(line)
    }

    this.zoomComponent = new ZoomChartComponent({ chart: this, ...(init.zoom ?? { zoom: true, panDirection: 'horizontal', autoFitFollow: true }) })
    this.controller = new InteractionController('hover')
    this.toggles = new ComponentToggle(this.controller)

    this.controller.addComponent(this.zoomComponent)
    this.controller.addComponent(this.callback)

    buildChartScaffold({ chart: this, plotRoot, controller: this.controller, clip: clipMain })

    this.applyCursor()
  }

  setSeries(series: ChartSeries[]) {
    for (let i = 0; i < this.lines.length; i++) this.lines[i].setPoints(series[i] ?? [])
    return this
  }

  setCursor(cursor: Partial<CursorConfig>) {
    this.config = { ...this.config, ...cursor }
    this.applyCursor()
    return this
  }

  setZoom(zoom: ZoomConfig) {
    this.zoomComponent.updateOptions({ chart: this, ...zoom })
    this.scheduleRender()
    return this
  }

  resetView() {
    return resetChartView(this)
  }

  private applyCursor() {
    const options = {
      selection: this.cursor,
      classes: this.config.accent ? 'accent' : [],
      offset: this.config.offset,
    }

    this.verticalLine.updateOptions(options)
    this.horizontalLine.updateOptions(options)

    this.toggles.set(this.verticalLine, this.config.verticalLine)
    this.toggles.set(this.horizontalLine, this.config.horizontalLine)

    this.scheduleRender()
  }
}
