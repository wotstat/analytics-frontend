import { ref, shallowRef } from 'vue'
import { LONG_CACHE, query } from '@/db'
import type { ObservedBattleMode } from './catalog'

const rows = shallowRef<ObservedBattleMode[]>([])
const loading = ref(false)
const failed = ref(false)
let loaded = false

// Общий для экземпляров селектора запрос; query также кеширует результат на время вкладки.
export function useObservedBattleModes() {
  async function load() {
    if (loaded || loading.value) return
    loading.value = true
    failed.value = false
    try {
      const result = await query<ObservedBattleMode>(`
        select if(region in ('RU', 'RPT'), 'mt', 'wot') as game, battleMode, battleGameplay, max(dateTime) as lastBattle
        from Event_OnBattleStart
        where region in ('RU', 'RPT', 'EU', 'NA', 'ASIA', 'CN')
        group by game, battleMode, battleGameplay
      `, { cache: LONG_CACHE, settings: { max_execution_time: 30, max_rows_to_read: '1000000000', max_result_rows: '10000' } })
      rows.value = result.data
      loaded = true
    } catch {
      failed.value = true
    } finally {
      loading.value = false
    }
  }
  return { rows, loading, failed, load }
}
