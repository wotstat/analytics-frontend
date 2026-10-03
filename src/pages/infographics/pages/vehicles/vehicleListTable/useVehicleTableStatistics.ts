import { shallowRef, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { error, loading, query, success, type Status } from '@/db'
import type { VehicleStatistics } from '../shared/types'
import { VEHICLE_STATISTICS_QUERY_OPTIONS } from '../shared/vehicleStatisticsQuery'

export function useVehicleTableStatistics(actualQuery: MaybeRefOrGetter<string>, inactiveQuery: MaybeRefOrGetter<string | null>) {
  const result = shallowRef<{ status: Status, data: VehicleStatistics[] }>({ status: loading, data: [] })
  // Храним только завершённые ответы: отменённый запрос нельзя переиспользовать
  // при быстром переключении фильтра туда и обратно.
  const cache = new Map<string, VehicleStatistics[]>()

  async function load(sql: string, signal: AbortSignal) {
    const cached = cache.get(sql)
    if (cached) return cached

    const { data } = await query<VehicleStatistics>(sql, {
      ...VEHICLE_STATISTICS_QUERY_OPTIONS,
      allowCache: false,
      abortSignal: signal,
    })
    if (!signal.aborted) cache.set(sql, data)
    return data
  }

  watch([() => toValue(actualQuery), () => toValue(inactiveQuery)], async ([actual, inactive], _, onCleanup) => {
    const controller = new AbortController()
    const { signal } = controller
    onCleanup(() => controller.abort())
    result.value = { status: loading, data: [] }

    try {
      const actualRows = await load(actual, signal)
      if (signal.aborted) return

      const inactiveRows = inactive === null ? [] : await load(inactive, signal)
      if (signal.aborted) return

      result.value = { status: success, data: [...actualRows, ...inactiveRows] }
    } catch (reason) {
      if (signal.aborted) return
      console.error(reason)
      result.value = {
        status: { status: error, reason: reason instanceof Error ? reason.message : String(reason) },
        data: [],
      }
    }
  }, { immediate: true })

  return result
}
