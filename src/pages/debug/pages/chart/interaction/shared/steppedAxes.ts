import { ChartClip } from '@/shared/uiKit/chart/universalChart/defs/ChartClip'
import { AutoLabels } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { steppedOverrides } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/steppedGenerator'
import { TicksByLabels } from '@/shared/uiKit/chart/universalChart/ticks/TicksByLabels'

const STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 25000, 50000, 100000]

function formatValue(value: number) {
  if (Math.abs(value) >= 10000) return `${Math.round(value / 1000)}k`
  return `${Math.round(value)}`
}

// Одинаковая обвязка осей для демо-чартов стенда. Свой набор на каждый чарт: рендереры
// привязываются к конкретному чарту и делить их между экземплярами нельзя
export function steppedAxes() {
  const clipLeft = new ChartClip('left')
  const clipBottom = new ChartClip('bottom')

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

  return {
    labelsX,
    labelsY,
    ticksX: new TicksByLabels(labelsX),
    ticksY: new TicksByLabels(labelsY),
    clips: [clipLeft, clipBottom],
  }
}
