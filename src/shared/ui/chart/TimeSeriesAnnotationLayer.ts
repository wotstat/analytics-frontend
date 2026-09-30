import { ChartClip } from '@/shared/uiKit/chart/universalChart/defs/ChartClip'
import { AutoLabels } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { RectangleArea } from '@/shared/uiKit/chart/universalChart/plot/area/RectangleArea'
import { TicksByLabels } from '@/shared/uiKit/chart/universalChart/ticks/TicksByLabels'
import type { UniversalChart } from '@/shared/uiKit/chart/universalChart/UniversalChart'
import { PlotGroup } from '@/shared/uiKit/chart/universalChart/utils/PlotGroup'
import { classNames } from '@/shared/uiKit/chart/universalChart/utils/utils'
import { timeSeriesAnnotationLabels, type TimeSeriesAnnotation } from './timeSeriesAnnotations'

export class TimeSeriesAnnotationLayer {
  private readonly areas = new PlotGroup(['time-series-annotation-areas'])
  private areaPlots: RectangleArea[] = []
  private readonly clip = new ChartClip('center', { top: -4, bottom: -4 })
  private readonly clipTop = new ChartClip('top')
  private readonly labels = new AutoLabels('horizontal', {
    ...timeSeriesAnnotationLabels([]), classes: 'time-series-annotations',
  }, 'top').clipBy(this.clipTop)
  private readonly ticks = new TicksByLabels(this.labels, { classes: 'time-series-annotation-ticks', start: 0 })

  constructor(private readonly chart: UniversalChart) {
    this.areas.clipBy(this.clip)
    chart
      .addPlot(this.areas, [], { placement: 'back' })
      .addPlot(this.ticks, 'annotations')
      .addSlot('top', this.labels, 'annotations')
      .addDefs(this.clip, this.clipTop)
  }

  setAnnotations(annotations: readonly TimeSeriesAnnotation[]) {
    for (const area of this.areaPlots) this.areas.removePlot(area)
    this.areaPlots = []

    // Порядок фоновых областей задаёт потребитель; приоритет касается только подписей.
    for (const annotation of annotations) {
      if (annotation.endTimestamp === undefined) continue
      const area = new RectangleArea(classNames('time-series-annotation-area', annotation.classes), {
        layoutLimited: true,
        padding: { left: annotation.areaPadding ?? 0, right: annotation.areaPadding ?? 0 },
      })
      area.setPoints(
        { x: annotation.timestamp, y: -Infinity },
        { x: annotation.endTimestamp, y: Infinity },
      )
      this.areas.addPlot(area)
      this.areaPlots.push(area)
    }
    this.labels.updateOptions(timeSeriesAnnotationLabels(annotations))
  }

  dispose() {
    this.chart
      .removePlot(this.areas)
      .removePlot(this.ticks)
      .removeSlot(this.labels)
      .removeDefs(this.clip, this.clipTop)
  }
}
