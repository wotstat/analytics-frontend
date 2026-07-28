import { computed } from 'vue'
import { CACHE_SETTINGS, queryAsync } from '@/db'
import { GameVendor, regionToGame } from '@/shared/game/wot'
import { Nation } from '@/shared/game/vehicles/nations/nations'
import { VehicleType } from '@/shared/game/vehicles/vehicle/utils'

export type VehicleRow = {
  tag: string
  type: VehicleType
  level: number
  nation: Nation
  region: string
  count: number
  short: string
  name: string
  nameEu: string
  nameCn: string
}

const listQuery = `
with
    tanks as (select tag, type, level, nation, region, count from LatestBattleVehicleInfo final where updated > now() - interval 1 month),
    locals as (select tag, shortRU as short, nameRU as name, nameEU as nameEu, nameCN as nameCn from VehiclesLocalization)
select tag, type, level, nation, region, count, short, name, nameEu, nameCn
from tanks
left any join locals using tag
order by count desc
`

export const vehicleListQuery = queryAsync<VehicleRow>(listQuery)

export type VehicleRowWithGame = VehicleRow & { game: GameVendor }

export const vehicleList = computed<VehicleRowWithGame[]>(() =>
  vehicleListQuery.value.data.map(row => ({ ...row, game: regionToGame(row.region) }))
)

export const vehiclesWithoutLocalization = computed(() =>
  vehicleList.value.filter(v => !v.name)
)
