import type { VehicleSelection } from '../../shared/vehicleGrouping'
import type { CompactValue } from '@/shared/game/encoding/utils/types'
import type { VehicleCategory } from '@/shared/game/encoding/vehicleCategories'
import type { VehicleFilters } from '../../filters/types'

export type ComparisonTarget = { tank: CompactValue } | { category: VehicleCategory, selection: VehicleSelection }

export type SavedComparisonFilters = Omit<VehicleFilters, 'arenas'> & { arenas: CompactValue[] }

export type SavedComparisonSource = {
  target: ComparisonTarget
  filters: SavedComparisonFilters
  color: number | string
  enabled: boolean
}

export function unrestrictedComparisonFilters(): VehicleFilters {
  return { regions: [], battleModes: [], arenas: [], platoon: 'any', result: 'any', battleLevel: 'any' }
}
