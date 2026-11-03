import { computed, type Ref } from 'vue'
import { setOfParam } from '@/shared/uiKit/queryStorage/params'
import { queryRegions, type QueryRegion } from './regions'

export const regionQueryParam = setOfParam(queryRegions, ['RU'], {
  label: 'region', key: 'global.regions', priority: 160,
})

export function firstQueryRegion(values?: Iterable<QueryRegion>): QueryRegion {
  return values?.[Symbol.iterator]().next().value ?? 'RU'
}

export function useSingleRegion(selection: Ref<Set<QueryRegion>>) {
  return computed({
    get: () => firstQueryRegion(selection.value),
    set: (region: QueryRegion) => {
      if (region !== firstQueryRegion(selection.value)) selection.value = new Set([region])
    },
  })
}
