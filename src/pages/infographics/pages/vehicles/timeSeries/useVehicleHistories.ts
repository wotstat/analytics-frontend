import { onScopeDispose, reactive, shallowReactive, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { createConcurrencyGroup, error, loading, query, success, type Status } from '@/db'
import type { VehicleFilters } from '../filters/types'
import type { VehicleSelection } from '../shared/vehicleGrouping'
import type { VehicleHistoryPeriod } from '../shared/types'
import { VEHICLE_STATISTICS_QUERY_OPTIONS } from '../shared/vehicleStatisticsQuery'
import type { Slot } from '../vehicleMetricSelector/vehicleMetrics'
import type { HistoryStep } from './period/historyStep'
import type { VehicleHistorySplit } from './split/historySplit'
import { vehicleHistoryQueries, type VehicleHistoryQueries } from './vehicleHistoryQuery'

type HistorySource = { tag: string, filters: VehicleFilters, selection: VehicleSelection, split?: VehicleHistorySplit | null }
type HistoryValues = Pick<VehicleHistoryPeriod, 'periodStart' | 'splitKey'> & Partial<Record<Slot, number | null>>
type HistoryState = { status: Status, data: VehicleHistoryPeriod[] }
type HistoryPlan = { key: string, parts: VehicleHistoryQueries }

const rowKey = (row: HistoryValues) => JSON.stringify([row.periodStart, row.splitKey ?? null])

export function useVehicleHistories(sources: MaybeRefOrGetter<readonly HistorySource[]>, options: {
  beforeDay: MaybeRefOrGetter<string>
  step: MaybeRefOrGetter<HistoryStep>
  slot: MaybeRefOrGetter<Slot>
}) {
  const states = shallowReactive(new Map<string, HistoryState>())
  const retries = reactive(new Map<string, number>())
  const plans = new Map<string, HistoryPlan>()
  const cache = new Map<string, HistoryValues[]>()
  const requests = new Map<string, { controller: AbortController, promise: Promise<HistoryValues[]> }>()
  const concurrency = createConcurrencyGroup(5)

  function load(sql: string, cacheTtl: number) {
    const cached = cache.get(sql)
    if (cached) return Promise.resolve(cached)
    const pending = requests.get(sql)
    if (pending) return pending.promise

    const controller = new AbortController()
    const promise = query<HistoryValues>(sql, {
      allowCache: true,
      format: 'JSONCompact',
      settings: { ...VEHICLE_STATISTICS_QUERY_OPTIONS.settings, query_cache_ttl: cacheTtl },
      abortSignal: controller.signal,
      concurrency,
    }).then(({ data }) => {
      controller.signal.throwIfAborted()
      cache.set(sql, data)
      return data
    }).finally(() => {
      if (requests.get(sql)?.controller === controller) requests.delete(sql)
    })
    requests.set(sql, { controller, promise })
    return promise
  }

  function cachedHistory(parts: VehicleHistoryQueries): VehicleHistoryPeriod[] | null {
    const rows: VehicleHistoryPeriod[] = []
    for (const part of parts) {
      const base = cache.get(part.base)
      if (!base) return null
      if (!base.length) continue
      const metrics = part.metric ? cache.get(part.metric) : []
      if (!metrics) return null
      const byKey = new Map(metrics.map(row => [rowKey(row), row]))
      for (const row of base) {
        rows.push({ ...row, ...byKey.get(rowKey(row)), battles: row.battles ?? 0, playerCount: row.playerCount ?? 0 })
      }
    }
    return rows
  }

  async function loadHistory(tag: string, plan: HistoryPlan) {
    const current = () => plans.get(tag) === plan
    try {
      // Бои и игроки независимы от метрики. Сначала загружаем их для всех частей;
      // смена метрики переиспользует даже ещё выполняющиеся базовые запросы.
      for (const part of plan.parts) {
        await load(part.base, part.cacheTtl)
        if (!current()) return
      }
      for (const part of plan.parts) {
        if (part.metric && cache.get(part.base)!.length) await load(part.metric, part.cacheTtl)
        if (!current()) return
      }
      states.set(tag, { status: success, data: cachedHistory(plan.parts)! })
    } catch (reason) {
      if (!current()) return
      console.error(reason)
      states.set(tag, {
        status: { status: error, reason: reason instanceof Error ? reason.message : String(reason) },
        data: [],
      })
    }
  }

  const stop = watch(() => toValue(sources).map(source => {
    const parts = vehicleHistoryQueries(source.filters, source.selection, toValue(options.beforeDay),
      toValue(options.step), source.split ?? null, toValue(options.slot))
    return { tag: source.tag, parts, key: JSON.stringify([parts, retries.get(source.tag) ?? 0]) }
  }), histories => {
    const tags = new Set(histories.map(history => history.tag))
    for (const tag of plans.keys()) {
      if (tags.has(tag)) continue
      plans.delete(tag)
      states.delete(tag)
      retries.delete(tag)
    }

    // Один SQL может быть нужен нескольким источникам. Отменяем его только
    // после удаления всех потребителей, включая ожидающие задачи очереди.
    const wanted = new Set(histories.flatMap(history => history.parts.flatMap(part =>
      part.metric ? [part.base, part.metric] : [part.base])))
    for (const [sql, request] of requests) {
      if (wanted.has(sql)) continue
      request.controller.abort()
      requests.delete(sql)
    }

    for (const { tag, key, parts } of histories) {
      if (plans.get(tag)?.key === key) continue
      const plan = { key, parts }
      plans.set(tag, plan)
      const cached = cachedHistory(parts)
      if (cached) states.set(tag, { status: success, data: cached })
      else {
        states.set(tag, { status: loading, data: [] })
        void loadHistory(tag, plan)
      }
    }
  }, { immediate: true })

  function retry(tag: string) {
    if (plans.has(tag)) retries.set(tag, (retries.get(tag) ?? 0) + 1)
  }

  onScopeDispose(() => {
    stop()
    plans.clear()
    for (const request of requests.values()) request.controller.abort()
    requests.clear()
  })

  return { states, retry }
}
