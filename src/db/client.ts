import { createClient, type ClickHouseSettings, type ResponseJSON } from '@clickhouse/client-web'
import type { ConcurrencyGroup } from './concurrency'
import { cacheClickHouseSettings, createQueryCache, resolveCachePolicy, responseCacheExpiresAt, type CachePolicy } from './cache'
import { proxyCacheFetch, sortedEntries } from './proxyCache'

export type DatabaseConfig = {
  url: string
  username: string
  password?: string
  request_timeout?: number
}

export type QueryOptions = {
  cache?: CachePolicy
  proxyCache?: boolean
  allowCache?: boolean
  format?: 'JSON' | 'JSONCompact'
  settings?: ClickHouseSettings
  abortSignal?: AbortSignal
  concurrency?: ConcurrencyGroup
  priority?: number
}

export type QueryResponse<T> = ResponseJSON<T> & { cacheExpiresAt: number }
export type Query = <T>(sql: string, options?: QueryOptions) => Promise<QueryResponse<T>>

type ActiveQuery = {
  promise: Promise<QueryResponse<unknown>>
  abortSignal?: AbortSignal
  concurrency?: ConcurrencyGroup
  priority: number
}

export function createDatabase(config: DatabaseConfig, onResponse?: (response: ResponseJSON<unknown>) => void) {
  const url = new URL(config.url)
  const clickhouse = createClient({
    ...config,
    url: url.origin,
    pathname: url.pathname,
    database: 'WOT',
    request_timeout: config.request_timeout ?? 120_000,
    fetch: proxyCacheFetch,
    // В браузере Fetch keepalive ограничивает тела запросов; в Bun управляет переиспользованием соединений.
    keep_alive: { enabled: typeof window === 'undefined' },
    clickhouse_settings: {
      max_temporary_columns: '1000',
      add_http_cors_header: 1,
    },
    compression: { response: true },
  })

  const activeQueries = new Map<string, Set<ActiveQuery>>()
  const cachedResults = createQueryCache<QueryResponse<unknown>>()
  function queryCacheKey(sql: string, options: QueryOptions) {
    const settings = sortedEntries(Object.entries(options.settings ?? {})
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]))
    return JSON.stringify([sql, options.format ?? 'JSON', settings, resolveCachePolicy(options.cache)?.key ?? null])
  }

  async function query<T>(query: string, options: QueryOptions = {}): Promise<QueryResponse<T>> {
    const {
      allowCache = true,
      format = 'JSON',
      settings = {}, abortSignal,
      concurrency,
      priority = 0,
      cache,
      proxyCache = false
    } = options

    if (proxyCache && !cache) throw new Error('proxyCache requires a cache policy')
    abortSignal?.throwIfAborted()
    const cacheKey = queryCacheKey(query, options)
    const cached = allowCache ? cachedResults.get(cacheKey) : undefined
    if (cached) return cached as QueryResponse<T>

    if (allowCache) {
      const active = [...activeQueries.get(cacheKey) ?? []].find(request =>
        request.abortSignal === abortSignal && request.concurrency === concurrency && request.priority === priority)
      if (active) return active.promise as Promise<QueryResponse<T>>
    }

    async function execute() {
      abortSignal?.throwIfAborted()
      const policy = resolveCachePolicy(cache)
      const executionKey = queryCacheKey(query, options)
      const cacheHeaders = proxyCache && policy && policy.ttl > 0 ? policy.headers : undefined
      const result = await clickhouse.query({
        query, format, abort_signal: abortSignal,
        clickhouse_settings: {
          output_format_json_quote_64bit_integers: 0,
          ...cacheClickHouseSettings(policy, settings),
          ...(cacheHeaders ? { wait_end_of_query: 1, send_progress_in_http_headers: 0 } : {}),
        },
        http_headers: cacheHeaders,
      })
      const cacheExpiresAt = responseCacheExpiresAt(policy, result.response_headers)
      const response: ResponseJSON<T> = format === 'JSONCompact'
        ? await result.json<unknown[]>().then(response => {
          const columns = response.meta
          if (!columns) throw new Error('JSONCompact response is missing column metadata')
          const decode = (row: unknown[]) => Object.fromEntries(columns.map((column, index) => [column.name, row[index]])) as T
          return {
            ...response,
            data: response.data.map(decode),
            totals: response.totals === undefined ? undefined : decode(response.totals),
            extremes: response.extremes === undefined ? undefined
              : Object.fromEntries(Object.entries(response.extremes).map(([key, row]) => [key, decode(row)])),
          }
        })
        : await result.json<T>()

      onResponse?.(response)

      abortSignal?.throwIfAborted()
      const value = { ...response, cacheExpiresAt }
      if (allowCache) cachedResults.set(executionKey, value, cacheExpiresAt)
      return value
    }

    const current = concurrency ? concurrency.run(execute, abortSignal, priority) : execute()
    if (!allowCache) return current

    const requests = activeQueries.get(cacheKey) ?? new Set<ActiveQuery>()
    const request: ActiveQuery = { promise: current, abortSignal, concurrency, priority }
    requests.add(request)
    activeQueries.set(cacheKey, requests)
    try {
      return await current
    } finally {
      requests.delete(request)
      if (!requests.size) activeQueries.delete(cacheKey)
    }
  }

  return {
    clickhouse,
    query,
    getCached: <T>(sql: string, options: QueryOptions = {}) => options.allowCache === false
      ? undefined
      : cachedResults.get(queryCacheKey(sql, options)) as QueryResponse<T> | undefined,
  }
}
