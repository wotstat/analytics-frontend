import './devPolyfill'
import { CLICKHOUSE_WEB_PROXY_URL } from '@/shared/external/externalUrl'
import { useLocalStorage } from '@vueuse/core'
import { computed, getCurrentScope, onScopeDispose, ref, shallowRef, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'
import { createDatabase, type QueryOptions as ClientQueryOptions } from './client'
import type { CachePolicy } from './cache'

export { createConcurrencyGroup, type ConcurrencyGroup } from './concurrency'
export { SUPER_SHORT_CACHE, SHORT_CACHE, DEFAULT_CACHE, MEDIUM_CACHE, LONG_CACHE, DAY_CACHE, MONTH_CACHE, DAILY_CACHE, MONTHLY_CACHE, IMMUTABLE_CACHE, createQueryCache, type CachePolicy } from './cache'
export type { QueryResponse } from './client'

export const totalRequests = useLocalStorage('totalRequests', 0)
export const totalElapsed = useLocalStorage('totalElapsed', 0)
export const totalRowsRead = useLocalStorage('totalRowsRead', 0)
export const totalBytesRead = useLocalStorage('totalBytesRead', 0)

const database = createDatabase({
  url: new URL('/api/db/', CLICKHOUSE_WEB_PROXY_URL).href,
  username: 'public',
}, response => {
  totalElapsed.value += response.statistics?.elapsed ?? 0
  totalRowsRead.value += response.statistics?.rows_read ?? 0
  totalBytesRead.value += response.statistics?.bytes_read ?? 0
  totalRequests.value++
})

export const clickhouse = database.clickhouse

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

export type QueryOptions = Omit<ClientQueryOptions, 'cache'> & {
  cache?: MaybeRefOrGetter<CachePolicy | undefined>
}
export type ReactiveQueryOptions = QueryOptions & { enabled?: Ref<boolean> }

export async function query<T>(sql: string, options: QueryOptions = {}) {
  return database.query<T>(sql, { ...options, cache: toValue(options.cache) })
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
      const cached = database.getCached<T>(q, { ...options, cache: toValue(options.cache) })
      if (cached) {
        result.value = { data: cached.data, status: success }
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
