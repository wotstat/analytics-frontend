import type { ComparisonFilters } from '../types'
import type { SavedComparisonFilters } from '../query/state'
import { uniqueSorted } from '@/shared/utils/collections'

function filterKey(value: unknown) {
  return JSON.stringify(Array.isArray(value) ? uniqueSorted(value) : value)
}

export function comparisonFiltersKey(filters: SavedComparisonFilters) {
  const entries = Object.entries(filters)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => [key, filterKey(value)])

  return JSON.stringify(entries)
}

export function differentComparisonFilters(current: ComparisonFilters, sources: readonly ComparisonFilters[]) {
  return (Object.keys(current) as (keyof ComparisonFilters)[])
    .filter(key => {
      const currentKey = filterKey(current[key])
      return sources.some(filters => filterKey(filters[key]) !== currentKey)
    })
}

export function snapshotComparisonFilters<T extends string | number>(filters: Omit<SavedComparisonFilters, 'arenas'> & { arenas: T[] }) {
  return {
    regions: [...filters.regions],
    battleModes: [...filters.battleModes],
    arenas: [...filters.arenas],
    platoon: filters.platoon,
    result: filters.result,
    battleLevel: filters.battleLevel,
  }
}
