import type { Options } from '@/shared/uiKit/chart/universalChart/labels/autoLabels/AutoLabels'
import { classNames, type Classes } from '@/shared/uiKit/chart/universalChart/utils/utils'

// Без подписи интервал рисует только фоновую область. Больший priority важнее.
export type TimeSeriesAnnotation = {
  id: string
  timestamp: number
  endTimestamp?: number
  label?: string
  classes?: Classes
  priority?: number
  areaPadding?: number
}

function timeSeriesAnnotationGroups(annotations: readonly TimeSeriesAnnotation[]) {
  const groups = new Map<string, { priority: number, classes: string[], annotations: TimeSeriesAnnotation[] }>()
  for (const annotation of annotations) {
    const priority = annotation.priority ?? 0
    const classes = [...new Set(classNames(annotation.classes))].sort()
    const key = JSON.stringify([priority, classes])
    let group = groups.get(key)
    if (!group) {
      group = { priority, classes, annotations: [] }
      groups.set(key, group)
    }
    group.annotations.push(annotation)
  }

  return [...groups.values()].sort((a, b) => b.priority - a.priority)
}

export function timeSeriesAnnotationLabels(annotations: readonly TimeSeriesAnnotation[]): Options {
  const priorities = timeSeriesAnnotationGroups(annotations).flatMap(group => {
    const byTimestamp = new Map(group.annotations.filter(annotation => annotation.label !== undefined).map(annotation => [
      annotation.endTimestamp === undefined ? annotation.timestamp : (annotation.timestamp + annotation.endTimestamp) / 2,
      annotation,
    ]))
    if (!byTimestamp.size) return []

    return [{
      source: { values: [...byTimestamp.keys()].sort((a, b) => a - b) },
      labelForValue: (value: number) => byTimestamp.get(value)!.label!,
      keyForValue: (value: number) => byTimestamp.get(value)!.id,
      classes: group.classes,
      ticks: {
        source: { values: [...new Set(group.annotations.filter(annotation => annotation.label !== undefined).flatMap(annotation =>
          annotation.endTimestamp === undefined ? [annotation.timestamp] : [annotation.timestamp, annotation.endTimestamp]
        ))].sort((a, b) => a - b) },
        classes: group.classes,
      },
    }]
  })

  return {
    values: priorities.length ? [{ priorities, maxLabelSize: 240 }] : [],
    strategy: 'classic-flow',
    onlyFitted: false,
    padding: 8,
    labelOffset: 6,
    slotSize: priorities.length ? 21 : 0,
  }
}
