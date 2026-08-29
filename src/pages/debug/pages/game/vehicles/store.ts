import { computed } from 'vue'
import { CACHE_SETTINGS, queryAsync } from '@/db'
import { GameVendor, regionToGame } from '@/shared/game/wot'
import { Nation } from '@/shared/game/vehicles/nations/nations'
import { VehicleType } from '@/shared/game/vehicles/vehicle/utils'
import { selectTagVehiclesLocalization } from '@/shared/i18n/i18n'

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
    tanks as (select tag, type, level, nation, region, count from LatestBattleVehicleInfo final where updated > now() - interval 1 month),
    locals as (${selectTagVehiclesLocalization}),
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
select tag, type, level, nation, region, count, short, name, nameRu, nameEn, nameZhCn
from tanks
left any join locals using tag
left any join localeSamples using tag
order by count desc
`

export const vehicleListQuery = queryAsync<VehicleRow>(listQuery, { settings: CACHE_SETTINGS })

export type VehicleRowWithGame = VehicleRow & { game: GameVendor }

export const vehicleList = computed<VehicleRowWithGame[]>(() =>
  vehicleListQuery.value.data.map(row => ({ ...row, game: regionToGame(row.region) }))
)

export const vehiclesWithoutLocalization = computed(() =>
  vehicleList.value.filter(v => !v.name)
)
