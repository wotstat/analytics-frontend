// Реальные данные из ClickHouse в той же форме, что и синтетика.
// Запрос стартует только когда `enabled` стал true.

import { LONG_CACHE_SETTINGS, queryComputed, success, type Status } from '@/db'
import { computed, type Ref } from 'vue'
import type { ChartSeries, TableRow } from './types'

type DailyRow = { day: string, battles: number, damage: number }

// Дневной ряд за 90 дней. `x` — индекс дня, а не таймстемп: подписи строятся по `labels`.
export function useRealDailySeries(enabled: Ref<boolean>) {
  const result = queryComputed<DailyRow>(() => `
    select toDate(dateTime) as day,
           count() as battles,
           round(avg(personal.damageDealt)) as damage
    from Event_OnBattleResult
    where dateTime > now() - interval 90 day
    group by day
    order by day
  `, { enabled })

  const rows = computed(() => result.value.status === success ? result.value.data : [])

  const battles = computed<ChartSeries>(() => rows.value.map((row, x) => ({ x, y: Number(row.battles) })))
  const damage = computed<ChartSeries>(() => rows.value.map((row, x) => ({ x, y: Number(row.damage) })))
  const labels = computed(() => rows.value.map(row => row.day))

  return {
    battles,
    damage,
    labels,
    status: computed<Status>(() => result.value.status),
  }
}

type PlayerRow = { name: string, battles: number, damage: number, winrate: number }

/** Топ игроков за неделю — строки для таблиц. */
export function useRealTableRows(enabled: Ref<boolean>, limit = 500) {
  const result = queryComputed<PlayerRow>(() => `
    select playerName as name,
           count() as battles,
           round(avg(personal.damageDealt)) as damage,
           round(100 * countIf(result = 'win') / count(), 2) as winrate
    from Event_OnBattleResult
    where dateTime > now() - interval 7 day
    group by name
    order by battles desc
    limit ${limit}
  `, { enabled })

  const rows = computed<TableRow[]>(() => {
    if (result.value.status !== success) return []

    return result.value.data.map((row, id) => ({
      id,
      name: row.name,
      battles: Number(row.battles),
      damage: Number(row.damage),
      winrate: Number(row.winrate),
    }))
  })

  return {
    rows,
    status: computed<Status>(() => result.value.status),
  }
}
