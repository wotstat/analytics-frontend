import { ChartClip } from '@/shared/uiKit/chart/universalChart/defs/ChartClip'
import { ChartMask } from '@/shared/uiKit/chart/universalChart/defs/ChartMask'
import { InteractionController } from '@/shared/uiKit/chart/universalChart/interaction/composable/InteractionController'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import { steppedAxes } from './steppedAxes'

export type ChartScaffoldOptions = {
  chart: UniversalChart
  plotRoot: PlotGroup
  controller: InteractionController
  clip: ChartClip
  mask?: ChartMask
}

export type ClipAndMask = {
  clip: ChartClip
  mask: ChartMask
  maskRoot: Element
}

// Клип с инсетом ±1px (иначе hairline stroke ровно на границе обрезается) и маска центра —
// одинаковая пара в чартах, где маркеры маскируются под layout
export function clipAndMask(): ClipAndMask {
  const clip = new ChartClip('center', { top: -1, bottom: -1 })
  const mask = new ChartMask('center')
  return { clip, mask, maskRoot: mask.root }
}

// Обвязка, общая для демо-чартов стенда: клип/маска на plotRoot, оси, порядок addPlot/addSlot/addDefs
// и minLayoutSize. Контроллер добавляется последним — во время его render() геометрия плотов уже
// соответствует кадру
export function buildChartScaffold(options: ChartScaffoldOptions): void {
  const { chart, plotRoot, controller, clip, mask } = options

  plotRoot.clipBy(clip)
  if (mask) plotRoot.maskBy(mask)

  const axes = steppedAxes()

  chart
    .addPlot(axes.ticksY, 'ticks')
    .addPlot(axes.ticksX, 'ticks')
    .addPlot(plotRoot, 'plot')
    .addSlot('bottom', axes.labelsX, 'labels')
    .addSlot('left', axes.labelsY, 'labels')
    .addPlot(controller)
    .addDefs(clip, ...(mask ? [mask] : []), ...axes.clips)

  chart.setMinLayoutSize({ right: 5, top: 5 })
}

// Одинаково у всех демо-чартов стенда: сброс к auto-fit по обеим осям
export function resetChartView<T extends UniversalChart>(chart: T): T {
  chart.setRenderBounds({ minX: null, maxX: null, minY: null, maxY: null })
  return chart
}

// Базовая форма MarkerOverlayOptions для демо-чартов с маркерами: caller дополняет selection
// и, если нужно, classesForHit
export function baseMarkerOptions(maskRoot: Element) {
  return {
    classes: 'markers',
    size: 4,
    maskSize: 7,
    targetMasks: [maskRoot],
  }
}
