
import { createClient } from "@clickhouse/client-web";

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