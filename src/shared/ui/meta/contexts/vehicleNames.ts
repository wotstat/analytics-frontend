import type { MetaContextDefinition } from '@/meta/context/utils/types'

type VehicleNames = Readonly<Record<string, string | undefined>>

export const vehicleNames = {
  id: 'vehicle-names',
  initialWaitMs: 3_000,
  refreshIntervalMs: 60 * 60 * 1000,
  load: async ({ query, signal }): Promise<VehicleNames> => {
    const { data } = await query<{ tag: string, name: string }>(`
      SELECT tag, name
      FROM WOT.VehiclesLocalizationDictionary
      WHERE region = 'RU' AND locale = 'RU'
      LIMIT 10001
    `, {
      abortSignal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
      cache: { ttl: 3600 },
      proxyCache: true,
      settings: {
        max_execution_time: 5,
        query_cache_nondeterministic_function_handling: 'save',
      },
    })

    return Object.freeze(Object.fromEntries(data.map(({ tag, name }) => [tag, name])))
  },
} satisfies MetaContextDefinition
