import { onScopeDispose, reactive, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { error, loading, query, success, type Status } from '@/db'
import type { VehicleHistoryPeriod } from '../shared/types'
import type { Slot } from '../shared/vehicleMetrics'
import { vehicleHistoryQuery } from '../shared/vehicleStatisticsQuery'
import type { HistoryStep } from '../timeSeries/historyStep'
import { createComparisonHistoryQueue } from './comparisonHistoryQueue'
import type { ComparisonSource } from './types'

type HistorySource = Pick<ComparisonSource, 'tag' | 'selection' | 'filters'>
type HistoryState = { status: Status, data: VehicleHistoryPeriod[] }

export function useComparisonHistories(sources: MaybeRefOrGetter<readonly HistorySource[]>, options: {
  beforeDay: MaybeRefOrGetter<string>
  step: MaybeRefOrGetter<HistoryStep>
  slot: MaybeRefOrGetter<Slot>
}) {
  const states = reactive(new Map<string, HistoryState>())
  const retries = reactive(new Map<string, number>())
  const requests = new Map<string, { sql: string, controller: AbortController }>()
  const queue = createComparisonHistoryQueue()

  const stop = watch(() => toValue(sources).map(source => ({
    tag: source.tag,
    sql: `${vehicleHistoryQuery(source.filters, source.selection, toValue(options.beforeDay),
      toValue(options.step), null, [toValue(options.slot)])}\n-- retry ${retries.get(source.tag) ?? 0}`,
  })), histories => {
    const tags = new Set(histories.map(history => history.tag))
    for (const [tag, request] of requests) {
      if (tags.has(tag)) continue
      request.controller.abort()
      requests.delete(tag)
      states.delete(tag)
      retries.delete(tag)
    }

    for (const { tag, sql } of histories) {
      const previous = requests.get(tag)
      if (previous?.sql === sql) continue

      previous?.controller.abort()
      const controller = new AbortController()
      requests.set(tag, { sql, controller })
      states.set(tag, { status: loading, data: [] })
      void load(tag, sql, controller.signal)
    }
  }, { immediate: true })

  async function load(tag: string, sql: string, signal: AbortSignal) {
    try {
      const { data } = await queue.run(() => query<VehicleHistoryPeriod>(sql, {
        settings: { use_query_cache: 1, query_cache_ttl: 24 * 60 * 60 },
        abortSignal: signal,
      }), signal)
      if (!signal.aborted) states.set(tag, { status: success, data })
    } catch (reason) {
      if (signal.aborted) return
      console.error(reason)
      states.set(tag, {
        status: { status: error, reason: reason instanceof Error ? reason.message : String(reason) },
        data: [],
      })
    }
  }

  function retry(tag: string) {
    if (requests.has(tag)) retries.set(tag, (retries.get(tag) ?? 0) + 1)
  }

  onScopeDispose(() => {
    stop()
    for (const request of requests.values()) request.controller.abort()
    requests.clear()
  })

  return { states, retry }
}
