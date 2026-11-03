import { computed, ref, shallowRef, watch, type Ref } from 'vue'
import { error, loading, query, success, type Status } from '@/db'
import { vehiclesByRegion, vehiclesByTag } from '@/shared/game/domain/vehicles/catalog'
import type { VehicleRegion } from '../../vehicles/filters/types'
import type { VehicleStatisticsRow } from '../../vehicles/shared/types'
import { VEHICLE_STATISTICS_QUERY_OPTIONS } from '../../vehicles/shared/vehicleStatisticsQuery'
import { quote } from '../../vehicles/shared/utils/sql'
import { achievements, type AchievementKind } from '../utils/achievements'

type SnapshotRow = Pick<VehicleStatisticsRow, 'rowKey' | 'tankTag' | 'region' | 'day'> & Partial<VehicleStatisticsRow>

export function useAchievementStatistics(kind: AchievementKind, region: Ref<VehicleRegion>) {
  const retry = ref(0)
  const result = shallowRef<{ status: Status, data: SnapshotRow[] }>({ status: loading, data: [] })
  const definition = achievements[kind]

  watch([region, retry], async ([region], _, onCleanup) => {
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    result.value = { status: loading, data: [] }

    try {
      const { data } = await query<SnapshotRow>(`
        select tag as rowKey, tag as tankTag, region, toDate(updatedAt, 'UTC') as day,
          ${definition.slots.map(slot => `${slot.split('_')[1]} as ${slot}`).join(',\n          ')}
        from ${definition.latestTable} final
        where region = ${quote(region)} and tag != ''
        order by tag
        limit 50001
      `, { ...VEHICLE_STATISTICS_QUERY_OPTIONS, abortSignal: controller.signal })
      if (controller.signal.aborted) return
      if (data.length > 50000) throw new Error('Слишком много строк планок техники')

      result.value = { status: success, data }
    } catch (reason) {
      if (controller.signal.aborted) return
      console.error(reason)
      result.value = {
        status: { status: error, reason: reason instanceof Error ? reason.message : String(reason) }, data: [],
      }
    }
  }, { immediate: true })

  const statistics = computed<{ status: Status, data: VehicleStatisticsRow[] }>(() => {
    const rows = result.value.data
    const latestDay = rows.reduce((latest, row) => row.day > latest ? row.day : latest, '')
    const actualDay = new Date(`${latestDay || '1970-01-01'}T00:00:00Z`)
    actualDay.setUTCDate(actualDay.getUTCDate() - 2)
    const actualFrom = actualDay.toISOString().slice(0, 10)
    const catalog = vehiclesByRegion.value.get(region.value)

    return {
      status: result.value.status,
      data: rows.map<VehicleStatisticsRow>(row => {
        const vehicle = catalog?.get(row.tankTag!) ?? vehiclesByTag.value.get(row.tankTag!)
        return {
          ...row,
          tankLevel: vehicle?.level ?? null,
          tankType: vehicle?.type ?? null,
          isActual: row.day >= actualFrom,
        }
      }),
    }
  })

  return { statistics, retry: () => retry.value++ }
}
