
import { createClient } from "@clickhouse/client-web";
import { computedAsync } from "@vueuse/core";
import { Ref, computed, ref, shallowRef, watch, watchEffect } from "vue";

export const clickhouse = createClient({
  host: import.meta.env.VITE_CLICKHOUSE_HOST,
  username: import.meta.env.VITE_CLICKHOUSE_USER,
  database: import.meta.env.VITE_CLICKHOUSE_DATABASE,
});

export interface IClickhouseResponse<T> {
  data: T[];
  meta: {
    rows: number;
    rows_before_limit_at_least: number;
    statistics: {
      elapsed: number;
      rows_read: number;
      bytes_read: number;
    };
  };
}

export async function query<T>(query: string) {
  const result = await clickhouse.query({ query });
  return await result.json<IClickhouseResponse<T>>();
}

export function queryAsync<T>(queryString: string, enabled: Ref<boolean> = ref(true)) {
  const result = shallowRef<T[]>([]);

  const stop = watch(enabled, async (value) => {
    if (!value) return;

    const { data } = await query<T>(queryString);
    result.value = data;
    stop();

  }, { immediate: true })

  return result
}

export function queryAsyncFirst<T>(queryString: string, defaultValue: T, enabled: Ref<boolean> = ref(true)) {
  const result = queryAsync<T>(queryString, enabled);

  return computed(() => result.value[0] ?? defaultValue)
}

export function dateToDbIndex(date: Date) {
  return (date.getTime() * 1e10).toLocaleString('fullwide', { useGrouping: false })
}

export function semverCompareStartFrom(target: string, addWhere = true) {
  const parts = target.split('.')
  const major = parts[0] ?? 0
  const minor = parts[1] ?? 0
  const patch = parts[2] ?? 0
  const revision = parts[3] ?? 0

  return addWhere ? 'where ' : ' and ' + `
  (modVersion_major > ${major} or
  (modVersion_major = ${major} and modVersion_minor > ${minor}) or
  (modVersion_major = ${major} and modVersion_minor = ${minor} and modVersion_patch > ${patch}) or
  (modVersion_minor = ${major} and modVersion_minor = ${minor} and modVersion_patch = ${patch} and modVersion_revision >= ${revision}))`
}