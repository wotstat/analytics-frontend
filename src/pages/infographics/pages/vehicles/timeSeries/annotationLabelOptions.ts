import type { Options } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import type { HistoryAnnotation, VersionHistoryAnnotation } from './historyAnnotations'

const kindPriority = { version: 3, patch: 2, micropatch: 1 }

export function annotationLabelOptions(annotations: readonly HistoryAnnotation[]): Options {
  const byTimestamp = new Map<number, VersionHistoryAnnotation>()

  for (const annotation of annotations) {
    if (annotation.kind === 'event') continue
    const previous = byTimestamp.get(annotation.timestamp)
    if (!previous || kindPriority[annotation.kind] > kindPriority[previous.kind]) {
      byTimestamp.set(annotation.timestamp, annotation)
    }
  }

  const values = [...byTimestamp.keys()].sort((a, b) => a - b)
  const versionPriorities = (['version', 'patch', 'micropatch'] as const).map(kind => {
    const source = { values: values.filter(value => byTimestamp.get(value)?.kind === kind) }
    return { source, classes: kind, ticks: { source, classes: kind } }
  })
  const eventPriorities = annotations.filter(annotation => annotation.kind === 'event').map((event, index) => ({
    source: { values: [event.endTimestamp === undefined ? event.timestamp : (event.timestamp + event.endTimestamp) / 2] },
    labelForValue: () => event.label,
    keyForValue: () => event.id,
    classes: `history-event-${index}`,
    ticks: {
      source: { values: event.endTimestamp === undefined ? [event.timestamp] : [event.timestamp, event.endTimestamp] },
      classes: `history-event-${index}`,
    },
  }))
  const priorities = [...eventPriorities, ...versionPriorities]
  const hasLabels = values.length > 0 || eventPriorities.length > 0

  return {
    values: hasLabels ? [{ priorities, maxLabelSize: 240 }] : [],
    labelForValue: value => byTimestamp.get(value)?.label ?? '',
    keyForValue: value => `${value}`,
    strategy: 'classic-flow',
    onlyFitted: false,
    padding: 8,
    labelOffset: 6,
    slotSize: hasLabels ? 21 : 0,
  }
}
