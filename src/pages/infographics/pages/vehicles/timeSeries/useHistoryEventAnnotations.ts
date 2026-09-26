import { computed, type ComputedRef, type Ref } from 'vue'
import { getHistoryEventRegions, historyEvents } from '@/shared/game/historyEvents'
import type { VehicleRegion } from '../filters/types'
import type { HistoryEventAnnotation } from './historyAnnotations'
import { DAY } from './timeLabels'

export function useHistoryEventAnnotations(enabledEvents: Ref<string[]>, regions: ComputedRef<readonly VehicleRegion[]>) {
  return computed<HistoryEventAnnotation[]>(() => historyEvents.flatMap(event => {
    if (!enabledEvents.value.includes(event.id)) return []
    const matchingRegions = getHistoryEventRegions(event, regions.value)
    if (matchingRegions?.length === 0) return []

    const label = matchingRegions && regions.value.length !== 1
      ? `[${matchingRegions.join(', ')}] ${event.label}` : event.label

    return [{
      id: event.id,
      timestamp: Date.parse(event.start) / 1000,
      endTimestamp: event.end === undefined ? undefined
        : Date.parse(event.end) / 1000 + (/^\d{4}-\d{2}-\d{2}$/.test(event.end) ? DAY : 0),
      label,
      kind: 'event',
      color: event.color,
    }]
  }))
}
