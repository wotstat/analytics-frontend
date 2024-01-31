
import { createClient } from "@clickhouse/client-web";
import { computedAsync } from "@vueuse/core";
import { Ref, computed, ref, shallowRef, watch, watchEffect } from "vue";

export const clickhouse = createClient({
  host: import.meta.env.VITE_CLICKHOUSE_HOST as string,
  username: import.meta.env.VITE_CLICKHOUSE_USER as string,
  database: import.meta.env.VITE_CLICKHOUSE_DATABASE as string,
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