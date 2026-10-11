import type { VehicleSelection } from '../shared/vehicleGrouping'
import type { VehicleFilters } from '../filters/types'
import type { VehicleStatistics } from '../shared/types'

export type ComparisonCandidate = {
  vehicle: VehicleStatistics
  selection: VehicleSelection
}

export type ComparisonFilters = VehicleFilters

export type ComparisonSource = {
  tag: string
  rowKey: string
  name: string
  color: string
  selection: VehicleSelection | null
  enabled: boolean
  resolution?: 'loading' | 'error' | 'missing'
  filters: ComparisonFilters
  sampleNumber: number
}
