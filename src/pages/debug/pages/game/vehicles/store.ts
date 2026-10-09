import { computed } from 'vue'
import { DEFAULT_CACHE, mergeStatuses, queryAsync, type Status } from '@/db'
import { GameVendor, regionToGame } from '@/shared/game/wot'
import { Nation } from '@/shared/game/vehicles/nations/nations'
import { VehicleType } from '@/shared/game/vehicles/vehicle/utils'
import { vehicleCatalog, vehiclesByRegion } from '@/shared/game/vehicles/catalog'

export type VehicleRow = {
  tag: string
  type: VehicleType
  level: number
  nation: Nation
  region: string
  count: number
  short: string
  name: string
  nameRu: string
  nameEn: string
  nameZhCn: string
}

const listQuery = `
with
    tanks as (select tag, region, count from LatestBattleVehicleInfo final where updated > now() - interval 1 month),
    localeSamples as (
      select
        tag,
        anyIf(name, region = 'RU' and locale = 'RU') as nameRu,
        anyIf(name, region = 'EU' and locale = 'EN') as nameEn,
        anyIf(name, region = 'CN' and locale = 'ZH_CN') as nameZhCn
      from VehiclesLocalizationDictionary
      where (region, locale) in (('RU', 'RU'), ('EU', 'EN'), ('CN', 'ZH_CN'))
      group by tag
    )
select tag, region, count, nameRu, nameEn, nameZhCn
from tanks
left any join localeSamples using tag
order by count desc
`

const diagnostics = queryAsync<Pick<VehicleRow, 'tag' | 'region' | 'count' | 'nameRu' | 'nameEn' | 'nameZhCn'>>(listQuery, {
  cache: DEFAULT_CACHE, settings: { query_cache_nondeterministic_function_handling: 'save' },
})

export const vehicleListQuery = computed<{ status: Status, data: VehicleRow[] }>(() => ({
  status: mergeStatuses(vehicleCatalog.value.status, diagnostics.value.status),
  data: diagnostics.value.data.flatMap(row => {
    const vehicle = vehiclesByRegion.value.get(row.region)?.get(row.tag)
    return vehicle && vehicle.type !== 'unknown' ? [{ ...vehicle, type: vehicle.type, ...row }] : []
  }),
}))

export type VehicleRowWithGame = VehicleRow & { game: GameVendor }

export const vehicleList = computed<VehicleRowWithGame[]>(() =>
  vehicleListQuery.value.data.map(row => ({ ...row, game: regionToGame(row.region) }))
)

export const vehiclesWithoutLocalization = computed(() =>
  vehicleList.value.filter(v => !v.name)
)
