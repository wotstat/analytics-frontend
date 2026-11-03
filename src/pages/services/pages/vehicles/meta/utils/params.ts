import type { QueryParams, QueryValues } from '@/shared/uiKit/queryStorage/queryStorageTypes'
import { decode, paramEnabled } from '@/shared/uiKit/queryStorage/utils/queryParamUtils'
import { vehicleQueryParams } from '../../filters/useVehicleQueryStorage'
import type { VehicleFilters } from '../../filters/types'
import { comparisonSettingsParams } from '../../timeSeriesCompare/query/settings'
import { deserializeComparison } from '../../timeSeriesCompare/query/codec/codec'
import type { SavedComparisonSource } from '../../timeSeriesCompare/query/state'

function readParams<P extends QueryParams>(definitions: P, url: URL): QueryValues<P> {
  const query = Object.fromEntries(url.searchParams)
  return Object.fromEntries(Object.entries(definitions).map(([key, definition]) => {
    const raw = paramEnabled(definition, query) ? query[definition.label ?? key] : undefined
    return [key, decode(definition, raw, query)]
  })) as QueryValues<P>
}

export function readVehiclesMetaParams(url: URL) {
  const table = readParams(vehicleQueryParams, url)
  const settings = readParams(comparisonSettingsParams, url)
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
