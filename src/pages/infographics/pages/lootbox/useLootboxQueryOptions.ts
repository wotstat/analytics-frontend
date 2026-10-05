import { createConcurrencyGroup, type QueryOptions } from '@/db'
import { getQueryStatParamsCache, type StatParams } from '@/shared/query/useQueryStatParams'
import { computed, type Ref } from 'vue'

// Общий лимит для статистики и списка контейнеров, в том числе при пересоздании страницы.
const concurrency = createConcurrencyGroup(5)

export function useLootboxQueryOptions(params: Ref<StatParams>): QueryOptions {
  return {
    concurrency,
    cache: computed(() => getQueryStatParamsCache(params.value) ?? { ttl: 0 }),
    proxyCache: true,
  }
}
