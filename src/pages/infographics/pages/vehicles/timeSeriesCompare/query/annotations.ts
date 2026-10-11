import { setOfParam } from '@/shared/uiKit/queryStorage/params'
import { historyEvents } from '@/shared/game/domain/historyEvents'
import type { HistoryAnnotationState } from '../../timeSeries/annotations/settings/useHistoryAnnotationSettings'

const visibilityKeys = ['versions', 'patches', 'micropatches', 'wotstat-outages'] as const
const eventIds = historyEvents.map(event => event.id)

export const comparisonAnnotationsParam = setOfParam([...visibilityKeys, ...eventIds], [], {
  key: 'vehicles.compare.annotations',
  history: 'replace',
  debounce: 150,
})

export function comparisonAnnotationState(keys: ReadonlySet<string>): HistoryAnnotationState {
  return {
    showVersions: keys.has('versions'),
    showPatches: keys.has('patches'),
    showMicropatches: keys.has('micropatches'),
    showWotstatOutages: keys.has('wotstat-outages'),
    enabledEvents: eventIds.filter(id => keys.has(id)),
  }
}

export function comparisonAnnotationKeys(state: HistoryAnnotationState): Set<string> {
  const visibility = [state.showVersions, state.showPatches, state.showMicropatches, state.showWotstatOutages]
  return new Set([
    ...visibilityKeys.filter((_, index) => visibility[index]),
    ...eventIds.filter(id => state.enabledEvents.includes(id)),
  ])
}
