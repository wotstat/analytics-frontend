import type { VehicleSelection } from '../shared/vehicleGrouping'
import type { VehicleFilters } from '../filters/types'

export type ComparisonFilters = VehicleFilters

export type ComparisonSource = {
  tag: string
  rowKey: string
  name: string
  color: string
  selection: VehicleSelection
  filters: ComparisonFilters
  sampleNumber: number
}

function filterKey(value: ComparisonFilters[keyof ComparisonFilters]) {
  return JSON.stringify(Array.isArray(value) ? [...new Set(value)].sort() : value)
}

export function comparisonFiltersKey(filters: ComparisonFilters) {
  const entries = Object.entries(filters)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => [key, filterKey(value)])

  return JSON.stringify(entries)
}

export function differentComparisonFilters(saved: ComparisonFilters, current: ComparisonFilters) {
  return (Object.keys(saved) as (keyof ComparisonFilters)[])
    .filter(key => filterKey(saved[key]) !== filterKey(current[key]))
}

export function snapshotComparisonFilters(filters: VehicleFilters): ComparisonFilters {
  return {
    regions: [...filters.regions],
    battleModes: [...filters.battleModes],
    arenas: [...filters.arenas],
    team: filters.team,
    platoon: filters.platoon,
    result: filters.result,
    battleLevel: filters.battleLevel,
  }
}
