import { readQueryParams } from '@/shared/uiKit/queryStorage/utils/queryParamUtils'
import { vehicleQueryParams } from '../../filters/useVehicleQueryStorage'
import type { VehicleFilters } from '../../filters/types'
import { comparisonSettingsParams } from '../../comparison/query/settings'
import { deserializeComparison } from '../../comparison/query/codec/codec'
import type { SavedComparisonSource } from '../../comparison/query/state'

export function readVehiclesMetaParams(url: URL) {
  const table = readQueryParams(vehicleQueryParams, url)
  const settings = readQueryParams(comparisonSettingsParams, url)
  const filters: VehicleFilters = {
    regions: [...table.regions], battleModes: table.battleModes, arenas: [...table.arenas],
    platoon: table.platoon, result: table.result, battleLevel: table.battleLevel,
  }

  const raw = url.searchParams.get('compare')?.trim()
  let sources: SavedComparisonSource[] = []
  let invalidComparison = false

  if (raw) {
    try { sources = deserializeComparison(raw, filters) }
    catch { invalidComparison = true }
  }

  return { table, filters, settings, sources, invalidComparison }
}

export type VehiclesMetaParams = ReturnType<typeof readVehiclesMetaParams>
