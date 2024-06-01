
import { ResponseJSON, createClient, type ClickHouseSettings } from "@clickhouse/client-web";
import { computedAsync, useLocalStorage } from "@vueuse/core";
import { Ref, computed, ref, shallowRef, watch, watchEffect } from "vue";

export const clickhouse = createClient({
  url: import.meta.env.VITE_CLICKHOUSE_URL,
  username: import.meta.env.VITE_CLICKHOUSE_USER,
  database: import.meta.env.VITE_CLICKHOUSE_DATABASE,
  password: import.meta.env.VITE_CLICKHOUSE_PASSWORD,
  clickhouse_settings: {
    max_temporary_columns: '1000'
  }
});

export const CACHE_SETTINGS = { use_query_cache: 1 } as ClickHouseSettings
export const SHORT_CACHE_SETTINGS = { use_query_cache: 1, query_cache_ttl: 10 } as ClickHouseSettings
export const LONG_CACHE_SETTINGS = { use_query_cache: 1, query_cache_ttl: 600 } as ClickHouseSettings

export const totalRequests = useLocalStorage('totalRequests', 0)
export const totalElapsed = useLocalStorage('totalElapsed', 0)
export const totalRowsRead = useLocalStorage('totalRowsRead', 0)
export const totalBytesRead = useLocalStorage('totalBytesRead', 0)

export const loading = Symbol('loading');
export const success = Symbol('success');
export const error = Symbol('error');
export type Status = typeof loading | typeof success | {
  status: typeof error,
  reason: string
};

export function mergeStatuses(...statuses: Status[]): Status {
  if (statuses.some(s => isErrorStatus(s))) return statuses.find(s => isErrorStatus(s)) as { status: typeof error, reason: string };
  if (statuses.some(s => s === loading)) return loading;
  return success;
}

export function isErrorStatus(status: Status): status is { status: typeof error, reason: string } {
  return typeof status !== 'symbol' && status.status === error;
}

const activeQueries = new Map<string, Promise<unknown>>();
export async function query<T>(query: string, { allowCache = true, settings = {} as ClickHouseSettings } = {}) {

  if (activeQueries.has(query)) return activeQueries.get(query) as Promise<ResponseJSON<T>>;

  const current = new Promise<ResponseJSON<T>>(async (resolve, reject) => {
    try {
      // await new Promise(resolve => setTimeout(resolve, 10000));

      const result = await clickhouse.query({ query, format: 'JSON', clickhouse_settings: settings });
      const response = await result.json<T>()

      totalElapsed.value += response.statistics?.elapsed ?? 0
      totalRowsRead.value += response.statistics?.rows_read ?? 0
      totalBytesRead.value += response.statistics?.bytes_read ?? 0
      totalRequests.value++

      resolve(response);
    } catch (error) {
      return reject(error);
    }
  })

  if (allowCache)
    activeQueries.set(query, current);

  return current;
}

export function queryComputed<T>(queryString: () => string | null, { settings = {} as ClickHouseSettings, enabled = ref(true) } = {}) {
  const result = shallowRef<{ status: Status, data: T[] }>({ status: loading, data: [] });

  watch(() => [queryString(), enabled.value] as const, async ([q, enabled]) => {
    if (!q) return;
    if (!enabled) return;

    try {
      result.value = { data: [], status: loading };
      const { data } = await query<T>(q, { settings });
      result.value = { data, status: success };
    } catch (reason) {
      console.error(reason);
      result.value = { data: [], status: { status: error, reason: (reason as any).message as string } };
    }
  }, { immediate: true })

  return result
}

export function queryComputedFirst<T>(queryString: () => string | null, defaultValue: T) {
  const result = queryComputed<T>(queryString);

  return computed(() => ({
    status: result.value.status as Status,
    data: result.value.data[0] ?? defaultValue
  }))

}

export function queryAsync<T>(queryString: string, { enabled = ref(true), settings = {} as ClickHouseSettings } = {}) {
  const result = shallowRef<{ status: Status, data: T[] }>({ status: loading, data: [] });

  const stop = watch(enabled, async (value) => {
    if (!value) return;

    setTimeout(() => stop(), 0);

    try {
      const { data } = await query<T>(queryString, { settings });
      result.value = { data, status: success };
    } catch (reason) {
      console.error(reason);
      result.value = { data: [], status: { status: error, reason: (reason as any).message as string } };
    }
  }, { immediate: true })

  return result
}

export function queryAsyncFirst<T>(queryString: string, defaultValue: T, { enabled = ref(true), settings = {} as ClickHouseSettings } = {}) {
  const result = queryAsync<T>(queryString, { enabled, settings });

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