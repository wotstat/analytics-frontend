import type { MetaContextDefinition } from '@/meta/context/utils/types'
import { LOCALE, localizationRegionsSql, localizationRegionPrioritySql } from '@/shared/i18n/localization'
import { arenaId, vehicleId } from '@/shared/game/encoding/utils/entityIds'
import { indexRegionalTags } from '@/shared/game/encoding/utils/regionalTagLookup'

type MetaVehicle = { region: string, tag: string, name: string }
type MetaArena = { region: string, tag: string, name: string }

export function createVehiclesMetaCatalog(vehicles: readonly MetaVehicle[], arenas: readonly MetaArena[]) {
  return {
    vehicleTags: indexRegionalTags(vehicles, vehicleId),
    arenaTags: indexRegionalTags(arenas, arenaId),
    vehicleNames: new Map(vehicles.map(vehicle => [vehicle.tag, vehicle.name])),
    arenaNames: new Map(arenas.map(arena => [arena.tag, arena.name])),
  }
}

export type VehiclesMetaCatalog = ReturnType<typeof createVehiclesMetaCatalog>

export const vehiclesMetaCatalog = {
  id: 'vehicles-meta-catalog',
  initialWaitMs: 3_000,
  refreshIntervalMs: 60 * 60 * 1000,
  load: async ({ query, signal }): Promise<VehiclesMetaCatalog> => {
    const options = {
      abortSignal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]),
      cache: { ttl: 3600 },
      proxyCache: true,
      settings: { use_query_cache: 0 },
    } as const

    const [vehicles, arenas] = await Promise.all([
      query<MetaVehicle>(`
        WITH locales AS (
          SELECT tag, argMax(name, ${localizationRegionPrioritySql}) AS name
          FROM WOT.VehiclesLocalizationDictionary
          WHERE region IN (${localizationRegionsSql}) AND locale = '${LOCALE}'
          GROUP BY tag
        )
        SELECT region, tag, name
        FROM (
          SELECT DISTINCT region, tag FROM (
            SELECT region, tag FROM WOT.VehiclesLatest
            UNION ALL
            SELECT region, tag FROM WOT.LatestBattleVehicleInfo
          )
        ) AS vehicles
        LEFT ANY JOIN locales USING tag
        ORDER BY region, tag
        LIMIT 50001
      `, options),

      query<MetaArena>(`
        WITH locales AS (
          SELECT tag, argMax(name, ${localizationRegionPrioritySql}) AS name
          FROM WOT.ArenasLocalizationDictionary
          WHERE region IN (${localizationRegionsSql}) AND locale = '${LOCALE}'
          GROUP BY tag
        )
        SELECT region, tag, name
        FROM (SELECT DISTINCT region, tag FROM WOT.Arenas) AS arenas
        LEFT ANY JOIN locales USING tag
        ORDER BY region, tag
        LIMIT 10001
      `, options),
    ])

    if (vehicles.data.length > 50000 || arenas.data.length > 10000) throw new Error('Каталог метаданных техники превышает лимит')
    return createVehiclesMetaCatalog(vehicles.data, arenas.data)
  },
} satisfies MetaContextDefinition
