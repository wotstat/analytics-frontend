import { globalChartRenderManagerSteps4 } from '@/shared/ui/chart/VueChartRenderManager'
import { movingAveragePoints } from '@/shared/ui/chart/timeSeries/utils/movingAverage'
import { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { AutoLine } from '@/shared/uiKit/chart/universalChart/plot/line/autoLine/AutoLine'
import { ChartClip } from '@/shared/uiKit/chart/universalChart/defs/ChartClip'
import { AutoLabels } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { labelCandidates } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/generators/labelCandidates'
import { TicksByLabels } from '@/shared/uiKit/chart/universalChart/ticks/TicksByLabels'
import type { Point } from '@/shared/uiKit/chart/universalChart/utils/Point'
import type { VehicleHistoryPeriod } from '../../../shared/types'
import { defaultVehicleStatisticsFromDay } from '../../../shared/vehicleStatisticsPeriod'
import type { Slot } from '../../../vehicleMetricSelector/vehicleMetrics/vehicleMetrics'
import { formatMetaSlotValue } from '../../utils/format'

type Series = { color: string, history: VehicleHistoryPeriod[] }
const DAY = 86_400_000

export class MetaHistoryChart extends UniversalChart {
  constructor(series: Series[], slot: Slot, until: number) {
    super({ layoutVariant: 'vertical', renderManager: globalChartRenderManagerSteps4, minLayoutSize: { top: 14, right: 12 } })

    const from = Date.parse(`${defaultVehicleStatisticsFromDay}T00:00:00Z`)
    const firstYear = new Date(from).getUTCFullYear()
    const years = Array.from({ length: new Date(until).getUTCFullYear() - firstYear + 1 }, (_, i) => Math.max(from, Date.UTC(firstYear + i, 0, 1)))

    const x = new AutoLabels('horizontal', {
      values: labelCandidates({ values: years }), labelForValue: value => String(new Date(value).getUTCFullYear()),
      strategy: 'classic-flow', labelOffset: 8, padding: 4,
    })
    const clip = new ChartClip('center')
    let min = Infinity
    let max = -Infinity

    for (const source of series) {
      const rawPoints: (Point | null)[] = []
      let previous = 0

      for (const row of source.history) {
        const x = new Date(`${row.periodStart}T00:00:00Z`).getTime()
        if (x < from || x > until) continue
        if (previous && x - previous > DAY) rawPoints.push(null)
        previous = x

        const value = row[slot]
        if (value == null || !Number.isFinite(value)) {
          rawPoints.push(null)
          continue
        }
        rawPoints.push({ x, y: value })
      }

      // Соединяем участки после сглаживания, не усредняя значения через пропуски.
      const points = movingAveragePoints(rawPoints, 3).filter((point): point is Point => point !== null)
      for (const point of points) {
        min = Math.min(min, point.y)
        max = Math.max(max, point.y)
      }

      const line = new AutoLine({ color: source.color, classes: 'meta-history-line', smoothing: 0 }).clipBy(clip)
      line.setPoints(points)
      this.addPlot(line, 'plot')
    }

    if (!Number.isFinite(min)) {
      min = 0
      max = 1
    }

    const range = Math.max(max - min, Math.abs(max) * 0.04, 1)
    const minY = Math.max(0, min - range * 0.05)
    const maxY = max + range * 0.1
    const rawStep = (maxY - minY) / 4
    const magnitude = 10 ** Math.floor(Math.log10(rawStep))
    const step = [1, 2, 2.5, 5, 10].find(value => value * magnitude >= rawStep)! * magnitude

    const y = new AutoLabels('vertical', {
      values: labelCandidates({ step }), labelForValue: value => formatMetaSlotValue(slot, value, step),
      from: minY, to: maxY, strategy: 'classic-flow', labelOffset: 14, padding: 8,
    })

    this.addDefs(clip)
      .addPlot(new TicksByLabels(y, { classes: 'meta-grid-y' }), 'ticks')
      .addPlot(new TicksByLabels(x, { classes: 'meta-grid-x' }), 'ticks')
      .addSlot('bottom', x, 'labels').addSlot('left', y, 'labels')
    this.setRenderBounds({ minX: from, maxX: until, minY, maxY })
  }
}
