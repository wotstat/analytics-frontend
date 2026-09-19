import type { VehicleSelection } from '../vehicleGrouping'
import type { VehicleFilters } from '../filters/types'
import type { LocalVehicleFilters } from '../vehicleListTable/localFilters'
import { historySeriesColor, historySeriesColors } from '../timeSeries/seriesColors'

export type ComparisonFilters = VehicleFilters & Pick<LocalVehicleFilters, 'minBattles' | 'minPlayers'>

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
  return JSON.stringify(Object.entries(filters).sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => [key, filterKey(value)]))
}

export function differentComparisonFilters(saved: ComparisonFilters, current: ComparisonFilters) {
  return (Object.keys(saved) as (keyof ComparisonFilters)[])
    .filter(key => filterKey(saved[key]) !== filterKey(current[key]))
}

export function snapshotComparisonFilters(filters: VehicleFilters, thresholds: Pick<LocalVehicleFilters, 'minBattles' | 'minPlayers'>): ComparisonFilters {
  return {
    ...filters,
    regions: [...filters.regions],
    battleModes: [...filters.battleModes],
    arenas: [...filters.arenas],
    minBattles: thresholds.minBattles,
    minPlayers: thresholds.minPlayers,
  }
}

export function nextComparisonColor(sources: ComparisonSource[]) {
  return historySeriesColors.find(color => !sources.some(source => source.color === color)) ?? historySeriesColor(sources.length)
}
