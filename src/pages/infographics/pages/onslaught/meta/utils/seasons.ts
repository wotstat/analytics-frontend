import type { MetaContextDefinition } from '@/meta/context/utils/types'

export type OnslaughtSeason = { region: string, season: string, start: string }

export const onslaughtQueryOptions = {
  cache: { ttl: 15 * 60 },
  proxyCache: true,
  settings: {
    use_query_cache: 0,
    max_execution_time: 8,
    max_rows_to_read: '100000000',
  },
} as const

export const onslaughtSeasons = {
  id: 'onslaught-seasons',
  initialWaitMs: 3_000,
  refreshIntervalMs: 60 * 60 * 1000,
  load: async ({ query, signal }): Promise<readonly OnslaughtSeason[]> => {
    const { data } = await query<OnslaughtSeason>(`
      SELECT region, season, toString(min(dateTime), 'UTC') AS start
      FROM Event_OnComp7Info
      WHERE region IN ('RU', 'EU', 'NA', 'ASIA', 'CN', 'CT')
      GROUP BY region, season
      ORDER BY start DESC, season DESC
      LIMIT 1000
    `, {
      ...onslaughtQueryOptions,
      cache: { ttl: 3600 },
      abortSignal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]),
    })
    return data
  },
} satisfies MetaContextDefinition
