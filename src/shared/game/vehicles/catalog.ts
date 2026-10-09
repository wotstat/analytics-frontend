import { computed } from 'vue'
import { DAILY_CACHE, queryAsync, type Status } from '@/db'
import { LOCALE, localizationRegionsSql, localizationRegionPrioritySql } from '@/shared/i18n/localization'
import type { Nation } from './nations/nations'
import type { VehicleType } from './types'

export type CatalogVehicle = {
  region: string
  tag: string
  id: string | undefined
  nation: Nation
  type: VehicleType | 'unknown'
  level: number
  role: string
  name: string
  short: string
}

export type SelectableVehicle = CatalogVehicle & { type: VehicleType }

// Один каталог для локализации, селекторов и разрешения ID. Архивные танки,
// отсутствующие в текущем клиенте, дополняются из статистики боёв.
const catalogQuery = `
with
  vehicles as (
    select region, tag, argMax(tuple(type, level, nation, role), priority) as info
    from (
      select region, tag,
        transform(type, ['heavyTank', 'mediumTank', 'lightTank', 'AT-SPG'], ['HT', 'MT', 'LT', 'AT']) as type,
        level, nation, role, 1 as priority
      from VehiclesLatest
      union all
      select region, tag, type, level, nation, role, 0 as priority
      from LatestBattleVehicleInfo final
    )
    group by region, tag
  ),
  locales as (
    select tag,
      argMax(name, ${localizationRegionPrioritySql}) as name,
      argMax(shortName, ${localizationRegionPrioritySql}) as short
    from VehiclesLocalizationDictionary
    where region in (${localizationRegionsSql}) and locale = '${LOCALE}'
    group by tag
  )
select region, tag, info.1 as type, info.2 as level, info.3 as nation, info.4 as role, name, short
from vehicles
left any join locales using tag
order by ${localizationRegionPrioritySql} desc, region, tag
`

const catalogResult = queryAsync<Omit<CatalogVehicle, 'id'>>(catalogQuery, {
  cache: DAILY_CACHE, proxyCache: true, format: 'JSONCompact',
})

export const vehicleCatalog = computed<{ status: Status, data: CatalogVehicle[] }>(() => ({
  status: catalogResult.value.status,
  data: catalogResult.value.data.map(vehicle => ({ ...vehicle, id: vehicleTagId(vehicle.tag) })),
}))

// G02_A20 → G2: ведущий ноль в полном теге не является частью числового ID.
function vehicleTagId(tag: string): string | undefined {
  const match = /^[^:]+:([A-Za-z]+)(\d+)_/.exec(tag)
  return match ? `${match[1]}${Number(match[2])}` : undefined
}

export const selectableVehicles = computed(() => vehicleCatalog.value.data.filter((vehicle): vehicle is SelectableVehicle =>
  vehicle.type !== 'unknown' && vehicle.level >= 1 && vehicle.level <= 11))

// SQL располагает строки по приоритету локализации, поэтому первый регион предпочтительный.
export const vehiclesByTag = computed(() => {
  const map = new Map<string, CatalogVehicle>()
  for (const vehicle of vehicleCatalog.value.data) if (!map.has(vehicle.tag)) map.set(vehicle.tag, vehicle)
  return map
})

export const vehiclesByRegion = computed(() => {
  const map = new Map<string, Map<string, CatalogVehicle>>()
  for (const vehicle of vehicleCatalog.value.data) {
    let region = map.get(vehicle.region)
    if (!region) map.set(vehicle.region, region = new Map())
    region.set(vehicle.tag, vehicle)
  }
  return map
})
