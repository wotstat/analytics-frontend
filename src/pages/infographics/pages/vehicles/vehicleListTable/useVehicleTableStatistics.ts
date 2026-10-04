import { onScopeDispose, shallowRef, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { createConcurrencyGroup, error, loading, query, success, type Status } from '@/db'
import type { VehicleStatistics } from '../shared/types'
import { metricQuerySlots, type Slot } from '../vehicleMetricSelector/vehicleMetrics'
import { VEHICLE_STATISTICS_QUERY_OPTIONS, type VehicleStatisticsQueries } from '../shared/vehicleStatisticsQuery'

type ColumnSlot = Exclude<Slot, 'battles' | 'playerCount'>
type ColumnValues = { rowKey: string } & Partial<Record<ColumnSlot, number | null>>

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
  const cache = new Map<string, unknown[]>()
  const requests = new Map<string, { controller: AbortController, promise: Promise<unknown[]> }>()
  const concurrency = createConcurrencyGroup(1)

  function load<T>(sql: string): Promise<T[]> {
    const cached = cache.get(sql)
    if (cached) return Promise.resolve(cached as T[])

    result.value = { ...result.value, status: loading, data: [] }
    const current = requests.get(sql)
    if (current) return current.promise as Promise<T[]>

    const controller = new AbortController()
    const { signal } = controller
    const promise = query<T>(sql, {
      ...VEHICLE_STATISTICS_QUERY_OPTIONS,
      allowCache: false,
      abortSignal: signal,
      concurrency,
    }).then(({ data }) => {
      signal.throwIfAborted()
      cache.set(sql, data)
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
      .filter(slot => slot !== 'battles' && slot !== 'playerCount')
      .map(slot => metricQuerySlots(slot)[0]))].sort().join(','),
    () => toValue(onlyActual),
    () => toValue(retry),
  ], async ([plan, slotKeys, actualOnly], [previousPlan], onCleanup) => {
    let cancelled = false
    onCleanup(() => { cancelled = true })

    // Новая группировка не должна отрисовать строки прежней выборки,
    // даже если все ответы уже в кеше: их сборка ниже всё равно асинхронная.
    if (plan !== previousPlan) {
      result.value = { status: loading, data: [], progress: { completed: 0, total: 0 } }
    }

    const selected = slotKeys ? slotKeys.split(',') as ColumnSlot[] : []
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
      for (const slot of selected) {
        const sql = plan.column(slot, rows)
        if (sql) wanted.add(sql)
      }
    }
    for (const [sql, request] of requests) {
      if (wanted.has(sql)) continue
      request.controller.abort()
      requests.delete(sql)
    }
    planRequests(wanted)
    updateProgress()

    async function loadColumns(rows: VehicleStatistics[], sqls: string[]) {
      const columns = await Promise.all(sqls.map(async sql => {
        const values = await load<ColumnValues>(sql)
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
      const parts: { rows: VehicleStatistics[], sqls: string[] }[] = []
      // Заменяем предварительные пакеты точными SQL; пустые части не требуют метрик.
      for (const base of bases) {
        const rows = await load<VehicleStatistics>(base)
        if (cancelled) return

        // Разные агрегации одной метрики дают один и тот же SQL.
        const sqls = new Set<string>()
        for (const slot of selected) {
          const sql = plan.column(slot, rows)
          if (!sql) continue
          sqls.add(sql)
        }
        parts.push({ rows, sqls: [...sqls] })
        if (base === firstPendingBase) pendingMetrics = 0
        planRequests(sqls)
        completeRequest(base)
      }

      const data: VehicleStatistics[] = []
      for (const { rows, sqls } of parts) {
        const values = await loadColumns(rows, sqls)
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
