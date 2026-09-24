import type { Options, TickSource } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import type { HistoryAnnotation } from './gameVersionAnnotations'

const kindPriority = { version: 3, patch: 2, micropatch: 1 }

export function annotationLabelOptions(annotations: readonly HistoryAnnotation[]): Options {
  const byTimestamp = new Map<number, HistoryAnnotation>()

  for (const annotation of annotations) {
    const previous = byTimestamp.get(annotation.timestamp)
    if (!previous || kindPriority[annotation.kind] > kindPriority[previous.kind]) {
      byTimestamp.set(annotation.timestamp, annotation)
    }
  }

  const values = [...byTimestamp.keys()].sort((a, b) => a - b)
  const ticks: TickSource[] = (['version', 'patch', 'micropatch'] as const).map(kind => ({
    source: { values: values.filter(value => byTimestamp.get(value)?.kind === kind) },
    classes: kind,
  }))

  return {
    values: values.length ? [{ source: { values }, ticks }] : [],
    labelForValue: value => byTimestamp.get(value)?.label ?? '',
    keyForValue: value => `${value}`,
    classesForValue: value => byTimestamp.get(value)?.kind ?? '',
    strategy: 'classic-flow',
    onlyFitted: false,
    padding: 8,
    labelOffset: 13,
    slotSize: values.length ? 28 : 0,
  }
}
