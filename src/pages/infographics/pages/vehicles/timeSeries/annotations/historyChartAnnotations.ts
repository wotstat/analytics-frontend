import type { TimeSeriesAnnotation } from '@/shared/ui/chart/timeSeries/annotations/timeSeriesAnnotations'
import { serverOutages } from '@/shared/wotstat/serverOutages'
import type { HistoryAnnotation, VersionHistoryAnnotation } from './historyAnnotations'

const kindPriority = { version: 3, patch: 2, micropatch: 1 }

export function historyChartAnnotations(annotations: readonly HistoryAnnotation[], showOutages: boolean): TimeSeriesAnnotation[] {
  const byTimestamp = new Map<number, VersionHistoryAnnotation>()
  for (const annotation of annotations) {
    if (annotation.kind === 'event') continue
    const previous = byTimestamp.get(annotation.timestamp)
    if (!previous || kindPriority[annotation.kind] > kindPriority[previous.kind]) {
      byTimestamp.set(annotation.timestamp, annotation)
    }
  }

  const events = annotations.filter(annotation => annotation.kind === 'event')
  return [
    ...(showOutages ? serverOutages.intervals.map((outage, index) => ({
      id: `outage-${index}`,
      timestamp: Date.parse(outage.start) / 1000,
      endTimestamp: Date.parse(outage.end) / 1000,
      classes: 'annotation-outage',
      areaPadding: -1,
    })) : []),
    ...events.map((event, index) => ({
      id: event.id,
      timestamp: event.timestamp,
      endTimestamp: event.endTimestamp,
      label: event.label,
      classes: ['history-event', `annotation-${event.id}`],
      priority: 4 + events.length - index,
    })),
    ...[...byTimestamp.values()].map(annotation => ({
      id: `version-${annotation.timestamp}`,
      timestamp: annotation.timestamp,
      label: annotation.label,
      classes: `annotation-${annotation.kind}`,
      priority: kindPriority[annotation.kind],
    })),
  ]
}
