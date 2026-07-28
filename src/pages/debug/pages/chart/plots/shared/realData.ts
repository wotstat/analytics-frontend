import { effectScope, ref } from 'vue'
import { useRealDailySeries } from '@/pages/debug/shared/fixtures/realSeries'

const enabled = ref(false)
let shared: ReturnType<typeof useRealDailySeries> | null = null


export function useSharedRealSeries() {
  if (!shared) shared = effectScope(true).run(() => useRealDailySeries(enabled))!
  return shared
}

export function enableRealSeries() {
  enabled.value = true
}
