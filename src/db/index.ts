
import { CLICKHOUSE_WEB_PROXY_URL } from '@/shared/external/externalUrl'
import { ResponseJSON, createClient, type ClickHouseSettings } from '@clickhouse/client-web'
import { useLocalStorage } from '@vueuse/core'
import { computed, getCurrentScope, onScopeDispose, ref, shallowRef, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'
import type { ConcurrencyGroup } from './concurrency'
import { cacheClickHouseSettings, createQueryCache, resolveCachePolicy, responseCacheExpiresAt, type CachePolicy } from './cache'
import { proxyCacheFetch, sortedEntries } from './proxyCache'

export { createConcurrencyGroup, type ConcurrencyGroup } from './concurrency'
export { SUPER_SHORT_CACHE, SHORT_CACHE, DEFAULT_CACHE, MEDIUM_CACHE, LONG_CACHE, DAY_CACHE, DAILY_CACHE, MONTHLY_CACHE, createQueryCache, type CachePolicy } from './cache'

if (import.meta.env.MODE == 'development' && import.meta.env.VITE_MODE_DEV_LOCAL === 'true' && !window.crypto.randomUUID) {
  console.warn('crypto.randomUUID is not supported in this browser, using fallback implementation')

  // @ts-ignore
  window.crypto.randomUUID = () => {
    // Fallback implementation for browsers that do not support crypto.randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

}

export const clickhouse = createClient({
  url: CLICKHOUSE_WEB_PROXY_URL,
  pathname: '/api/db/',
  username: 'public',
  database: 'WOT',
  request_timeout: 120_000,
  fetch: proxyCacheFetch,
  keep_alive: { enabled: false },
  clickhouse_settings: {
    max_temporary_columns: '1000',
    add_http_cors_header: 1,
  },
  compression: {
    response: true
  }
})

export const totalRequests = useLocalStorage('totalRequests', 0)
export const totalElapsed = useLocalStorage('totalElapsed', 0)
export const totalRowsRead = useLocalStorage('totalRowsRead', 0)
export const totalBytesRead = useLocalStorage('totalBytesRead', 0)

export const loading = Symbol('loading')
export const success = Symbol('success')
export const error = Symbol('error')
export type Status = typeof loading | typeof success | {
  status: typeof error,
  reason: string
};

export function mergeStatuses(...statuses: Status[]): Status {
  if (statuses.some(s => isErrorStatus(s))) return statuses.find(s => isErrorStatus(s)) as { status: typeof error, reason: string }
  if (statuses.some(s => s === loading)) return loading
  return success
}

export function isErrorStatus(status: Status): status is { status: typeof error, reason: string } {
  return typeof status !== 'symbol' && status.status === error
}

export type QueryOptions = {
  cache?: MaybeRefOrGetter<CachePolicy | undefined>
  proxyCache?: boolean
  allowCache?: boolean
  format?: 'JSON' | 'JSONCompact'
  settings?: ClickHouseSettings
  abortSignal?: AbortSignal
  concurrency?: ConcurrencyGroup
}

export type ReactiveQueryOptions = QueryOptions & { enabled?: Ref<boolean> }
export type QueryResponse<T> = ResponseJSON<T> & { cacheExpiresAt: number }

type ActiveQuery = {
  promise: Promise<QueryResponse<unknown>>
  abortSignal?: AbortSignal
  concurrency?: ConcurrencyGroup
}

const activeQueries = new Map<string, Set<ActiveQuery>>()
const cachedResults = createQueryCache<QueryResponse<unknown>>()
function queryCacheKey(sql: string, options: QueryOptions) {
  const settings = sortedEntries(Object.entries(options.settings ?? {})
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => [key, String(value)]))
  return JSON.stringify([sql, options.format ?? 'JSON', settings, resolveCachePolicy(toValue(options.cache))?.key ?? null])
}

export async function query<T>(query: string, options: QueryOptions = {}): Promise<QueryResponse<T>> {
  const {
    allowCache = true,
    format = 'JSON',
    settings = {}, abortSignal,
    concurrency,
    cache,
    proxyCache = false
  } = options

  if (proxyCache && !toValue(cache)) throw new Error('proxyCache requires a cache policy')
  abortSignal?.throwIfAborted()
  const cacheKey = queryCacheKey(query, options)
  const cached = allowCache ? cachedResults.get(cacheKey) : undefined
  if (cached) return cached as QueryResponse<T>

  if (allowCache) {
    const active = [...activeQueries.get(cacheKey) ?? []].find(request =>
      request.abortSignal === abortSignal && request.concurrency === concurrency)
    if (active) return active.promise as Promise<QueryResponse<T>>
  }

  async function execute() {
    abortSignal?.throwIfAborted()
    const policy = resolveCachePolicy(toValue(cache))
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

    totalElapsed.value += response.statistics?.elapsed ?? 0
    totalRowsRead.value += response.statistics?.rows_read ?? 0
    totalBytesRead.value += response.statistics?.bytes_read ?? 0
    totalRequests.value++

    abortSignal?.throwIfAborted()
    const value = { ...response, cacheExpiresAt }
    if (allowCache) cachedResults.set(executionKey, value, cacheExpiresAt)
    return value
  }

  const current = concurrency ? concurrency.run(execute, abortSignal) : execute()
  if (!allowCache) return current

  const requests = activeQueries.get(cacheKey) ?? new Set<ActiveQuery>()
  const request: ActiveQuery = { promise: current, abortSignal, concurrency }
  requests.add(request)
  activeQueries.set(cacheKey, requests)
  try {
    return await current
  } finally {
    requests.delete(request)
    if (!requests.size) activeQueries.delete(cacheKey)
  }
}

export function queryComputed<T>(queryString: () => string | null, { enabled = ref(true), ...options }: ReactiveQueryOptions = {}) {
  const result = shallowRef<{ status: Status, data: T[] }>({ status: loading, data: [] })

  watch([queryString, enabled, () => toValue(options.cache)], async ([q, enabled], _, onCleanup) => {
    if (!q || !enabled) return

    const controller = new AbortController()
    onCleanup(() => controller.abort())
    const signal = options.abortSignal ? AbortSignal.any([options.abortSignal, controller.signal]) : controller.signal
    if (signal.aborted) return

    try {
      const cached = options.allowCache !== false ? cachedResults.get(queryCacheKey(q, options)) : undefined
      if (cached) {
        result.value = { data: (cached as QueryResponse<T>).data, status: success }
        return
      }

      result.value = { data: [], status: loading }
      const { data } = await query<T>(q, { ...options, abortSignal: signal })
      if (signal.aborted) return

      result.value = { data, status: success }
    } catch (reason) {
      if (signal.aborted) return

      console.error(reason)
      result.value = { data: [], status: { status: error, reason: (reason as any).message as string } }
    }
  }, { immediate: true })

  return result
}

export function queryComputedFirst<T>(queryString: () => string | null, defaultValue: T, options: ReactiveQueryOptions = {}) {
  const result = queryComputed<T>(queryString, options)

  return computed(() => ({
    status: result.value.status as Status,
    data: result.value.data[0] ?? defaultValue
  }))

}

export function queryAsync<T>(queryString: string, { enabled = ref(true), ...options }: ReactiveQueryOptions = {}) {
  const result = shallowRef<{ status: Status, data: T[] }>({ status: loading, data: [] })
  const controller = new AbortController()
  const signal = options.abortSignal ? AbortSignal.any([options.abortSignal, controller.signal]) : controller.signal
  if (getCurrentScope()) onScopeDispose(() => controller.abort())
  let started = false

  const stop = watch(enabled, async (value) => {
    if (!value || started) return
    started = true
    setTimeout(() => stop(), 0)

    try {
      const { data } = await query<T>(queryString, { ...options, abortSignal: signal })
      if (signal.aborted) return
      result.value = { data, status: success }
    } catch (reason) {
      if (signal.aborted) return
      console.error(reason)
      result.value = { data: [], status: { status: error, reason: (reason as any).message as string } }
    }
  }, { immediate: true })

  return result
}

export function queryAsyncFirst<T>(queryString: string, defaultValue: T, options: ReactiveQueryOptions = {}) {
  const result = queryAsync<T>(queryString, options)

  return computed(() => ({
    status: result.value.status as Status,
    data: result.value.data[0] ?? defaultValue
  }))
}

export function dateToDbIndex(date: Date) {
  return (date.getTime() * 1e10).toLocaleString('fullwide', { useGrouping: false })
}

export function dbIndexToDate(index: string) {
  const time = parseInt(index.slice(0, index.length - 10))
  return Math.floor(time / 1000)
}

export function dateToDbDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function semverCompareStartFrom(target: string, addWhere = true) {
  const parts = target.split('.').map(t => parseInt(t))
  const major = parts[0] ?? 0
  const minor = parts[1] ?? 0
  const patch = parts[2] ?? 0
  const revision = parts[3] ?? 0

  return (addWhere ? 'where ' : ' and ') + `modVersionComparable > ${major * 1e9 + minor * 1e6 + patch * 1e3 + revision}`
  // (modVersion_major > ${major} or
  // (modVersion_major = ${major} and modVersion_minor > ${minor}) or
  // (modVersion_major = ${major} and modVersion_minor = ${minor} and modVersion_patch > ${patch}) or
  // (modVersion_minor = ${major} and modVersion_minor = ${minor} and modVersion_patch = ${patch} and modVersion_revision >= ${revision}))`
}

export const RESTRICTED_COLUMNS = ['systemInfo.architectureBits', 'systemInfo.architectureLinkage', 'systemInfo.cpuCores', 'systemInfo.cpuFamily', 'systemInfo.cpuFreq', 'systemInfo.cpuName', 'systemInfo.cpuScore', 'systemInfo.cpuVendor', 'systemInfo.cpuVendorName', 'systemInfo.gameDriveName', 'systemInfo.gpuDriverVersion', 'systemInfo.gpuFamily', 'systemInfo.gpuMemory', 'systemInfo.gpuName', 'systemInfo.gpuScore', 'systemInfo.gpuVendor', 'systemInfo.gpuVendorName', 'systemInfo.isLaptop', 'systemInfo.machine', 'systemInfo.nativeResolution', 'systemInfo.platform', 'systemInfo.ramTotal', 'systemInfo.system', 'systemInfo.version', 'systemInfo.windowMode', 'systemInfo.windowResolution', 'systemInfo.workstationVendor']
