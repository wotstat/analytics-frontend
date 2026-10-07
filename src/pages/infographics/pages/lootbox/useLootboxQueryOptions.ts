import { createConcurrencyGroup, type ReactiveQueryOptions } from '@/db'
import { getQueryStatParamsCache, type StatParams } from '@/shared/query/useQueryStatParams'
import { computed, onActivated, onDeactivated, ref, type Ref } from 'vue'

// Общий лимит для статистики и списка контейнеров.
const concurrency = createConcurrencyGroup(5)

export function useLootboxQueryOptions(params: Ref<StatParams>): ReactiveQueryOptions {
  const enabled = ref(true)
  onActivated(() => { enabled.value = true })
  onDeactivated(() => { enabled.value = false })

  return {
    enabled,
    concurrency,
    cache: computed(() => getQueryStatParamsCache(params.value) ?? { ttl: 0 }),
    proxyCache: true,
  }
}
