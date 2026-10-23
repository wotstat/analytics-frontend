import { onScopeDispose, shallowRef, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { createConcurrencyGroup, createQueryCache, error, loading, query, success, type CachePolicy, type Status } from '@/db'
import type { MetricDateField } from '../vehicleMetricSelector/utils/metricTypes'
import type { VehicleStatistics } from '../shared/types'
import { availableSlots, type Slot } from '../vehicleMetricSelector/vehicleMetrics/vehicleMetrics'
import { VEHICLE_STATISTICS_QUERY_OPTIONS, type VehicleStatisticsQueries } from '../shared/vehicleStatisticsQuery'
import type { MetricQuery } from '../shared/metricData/utils/types'

type ColumnValues = Pick<VehicleStatistics, 'rowKey'> & Partial<Record<MetricDateField, string>> & Partial<Record<Slot, number | null>>

export function useVehicleTableStatistics(
  queries: MaybeRefOrGetter<VehicleStatisticsQueries>,
  slots: MaybeRefOrGetter<readonly Slot[]>,
  onlyActual: MaybeRefOrGetter<boolean>,
  retry: MaybeRefOrGetter<number>,
) {
  const result = shallowRef<{
    status: Status
    data: VehicleStatistics[]
    progress: { completed: number, total: number }
  }>({ status: loading, data: [], progress: { completed: 0, total: 0 } })
  const cache = createQueryCache<unknown[]>()
  const requests = new Map<string, { controller: AbortController, promise: Promise<unknown[]> }>()
  const concurrency = createConcurrencyGroup(1)

  function load<T>(sql: string, policy: CachePolicy = VEHICLE_STATISTICS_QUERY_OPTIONS.cache): Promise<T[]> {
    const cached = cache.get(sql)
    if (cached) return Promise.resolve(cached as T[])

    result.value = { ...result.value, status: loading, data: [] }
    const current = requests.get(sql)
    if (current) return current.promise as Promise<T[]>

    const controller = new AbortController()
    const { signal } = controller
    const promise = query<T>(sql, {
      ...VEHICLE_STATISTICS_QUERY_OPTIONS,
      cache: policy,
      allowCache: false,
      abortSignal: signal,
      concurrency,
    }).then(({ data, cacheExpiresAt }) => {
      signal.throwIfAborted()
      cache.set(sql, data, cacheExpiresAt)
      return data
    }).finally(() => {
      if (requests.get(sql)?.controller === controller) requests.delete(sql)
    })
    requests.set(sql, { controller, promise })
    return promise
  }

  const stop = watch([
    () => toValue(queries),
    () => [...new Set(toValue(slots)
      .map(slot => availableSlots[slot].data)
      .filter(data => data.column)
      .map(data => data.key))].sort().join(','),
    () => toValue(onlyActual),
    () => toValue(retry),
  ], async ([plan, , actualOnly], [previousPlan], onCleanup) => {
    let cancelled = false
    onCleanup(() => { cancelled = true })

    // Новая группировка не должна отрисовать строки прежней выборки,
    // даже если все ответы уже в кеше: их сборка ниже всё равно асинхронная.
    if (plan !== previousPlan) {
      result.value = { status: loading, data: [], progress: { completed: 0, total: 0 } }
    }

    const selected = [...new Map(toValue(slots).map(slot => {
      const data = availableSlots[slot].data
      return [data.key, data] as const
    })).values()].filter(data => data.column)
    const bases = actualOnly ? [plan.actual] : [plan.actual, plan.inactive]
    const planned = new Set<string>()
    const completed = new Set<string>()
    const firstPendingBase = bases.find(base => !cache.has(base))
    let pendingMetrics = firstPendingBase === undefined ? 0 : selected.length

    function updateProgress() {
      if (cancelled) return
      // Заранее учитываем один набор выбранных метрик, без запаса для неактуальной части.
      const total = planned.size + pendingMetrics
      result.value = { ...result.value, progress: { completed: completed.size, total } }
    }

    function planRequests(sqls: Iterable<string>) {
      for (const sql of sqls) {
        if (!cache.has(sql)) planned.add(sql)
      }
    }

    function completeRequest(sql: string) {
      if (planned.has(sql)) completed.add(sql)
      updateProgress()
    }

    // Смена столбцов сохраняет нужные запросы в полёте. Убираем только те,
    // которые больше не нужны, включая очередь ещё не запущенных запросов.
    const wanted = new Set(bases)
    for (const base of bases) {
      const rows = cache.get(base) as VehicleStatistics[] | undefined
      if (!rows) continue
      for (const data of selected) {
        const request = plan.column(data, rows)
        if (request) wanted.add(request.sql)
      }
    }
    for (const [sql, request] of requests) {
      if (wanted.has(sql)) continue
      request.controller.abort()
      requests.delete(sql)
    }
    planRequests(wanted)
    updateProgress()

    async function loadColumns(rows: VehicleStatistics[], queries: MetricQuery[]) {
      const columns = await Promise.all(queries.map(async ({ sql, cache }) => {
        const values = await load<ColumnValues>(sql, cache)
        completeRequest(sql)
        return values
      }))
      if (cancelled) return []

      // Не изменяем строки базового ответа в кеше при добавлении колонок.
      const merged = rows.map(row => ({ ...row }))
      const byKey = new Map(merged.map(row => [row.rowKey, row]))
      for (const values of columns) {
        for (const value of values) {
          const row = byKey.get(value.rowKey)
          if (row) Object.assign(row, value)
        }
      }
      return merged
    }

    try {
      const parts: { rows: VehicleStatistics[], queries: MetricQuery[] }[] = []
      // Заменяем предварительные пакеты точными SQL; пустые части не требуют метрик.
      for (const base of bases) {
        const rows = await load<VehicleStatistics>(base)
        if (cancelled) return

        // Каждая группа загружается один раз, независимо от числа выбранных вариантов.
        const queries = new Map<string, MetricQuery>()
        for (const data of selected) {
          const request = plan.column(data, rows)
          if (request) queries.set(request.sql, request)
        }
        parts.push({ rows, queries: [...queries.values()] })
        if (base === firstPendingBase) pendingMetrics = 0
        planRequests(queries.keys())
        completeRequest(base)
      }

      const data: VehicleStatistics[] = []
      for (const { rows, queries } of parts) {
        const values = await loadColumns(rows, queries)
        if (cancelled) return
        data.push(...values)
      }

      result.value = { ...result.value, status: success, data }
    } catch (reason) {
      if (cancelled) return
      console.error(reason)
      result.value = {
        ...result.value,
        status: { status: error, reason: reason instanceof Error ? reason.message : String(reason) },
        data: [],
      }
    }
  }, { immediate: true })

  onScopeDispose(() => {
    stop()
    for (const request of requests.values()) request.controller.abort()
    requests.clear()
  })

  return result
}
