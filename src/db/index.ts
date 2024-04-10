
import { createClient } from "@clickhouse/client-web";
import { computedAsync, useLocalStorage } from "@vueuse/core";
import { Ref, computed, ref, shallowRef, watch, watchEffect } from "vue";

export const clickhouse = createClient({
  host: import.meta.env.VITE_CLICKHOUSE_HOST,
  username: import.meta.env.VITE_CLICKHOUSE_USER,
  database: import.meta.env.VITE_CLICKHOUSE_DATABASE,
  clickhouse_settings: {
    max_temporary_columns: '1000',
  }
});

export interface IClickhouseResponse<T> {
  data: T[];
  rows: number;
  meta: {
    name: string;
    type: string;
  }[];
  statistics: {
    elapsed: number;
    rows_read: number;
    bytes_read: number;
  };
}

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
export async function query<T>(query: string, { allowCache = true } = {}) {

  if (activeQueries.has(query)) return activeQueries.get(query) as Promise<IClickhouseResponse<T>>;

  const current = new Promise<IClickhouseResponse<T>>(async (resolve, reject) => {
    try {
      // await new Promise(resolve => setTimeout(resolve, 10000));

      const result = await clickhouse.query({ query });
      const response = await result.json<IClickhouseResponse<T>>();

      totalElapsed.value += response.statistics.elapsed
      totalRowsRead.value += response.statistics.rows_read
      totalBytesRead.value += response.statistics.bytes_read
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

export function queryComputed<T>(queryString: () => string | null) {
  const result = shallowRef<{ status: Status, data: T[] }>({ status: loading, data: [] });

  watch(queryString, async (q) => {
    if (!q) return;

    try {
      result.value = { data: [], status: loading };
      const { data } = await query<T>(q);
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

export function queryAsync<T>(queryString: string, enabled: Ref<boolean> = ref(true)) {
  const result = shallowRef<{ status: Status, data: T[] }>({ status: loading, data: [] });

  const stop = watch(enabled, async (value) => {
    if (!value) return;

    setTimeout(() => stop(), 0);

    try {
      const { data } = await query<T>(queryString);
      result.value = { data, status: success };
    } catch (reason) {
      console.error(reason);
      result.value = { data: [], status: { status: error, reason: (reason as any).message as string } };
    }
  }, { immediate: true })

  return result
}

export function queryAsyncFirst<T>(queryString: string, defaultValue: T, enabled: Ref<boolean> = ref(true)) {
  const result = queryAsync<T>(queryString, enabled);

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