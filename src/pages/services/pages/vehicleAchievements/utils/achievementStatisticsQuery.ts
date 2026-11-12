import type { VehicleRegion } from '../../vehicles/filters/types'
import { quote } from '../../vehicles/shared/utils/sql'
import { achievementDeltaPeriods, achievements, type AchievementDeltaPeriod, type AchievementKind } from './achievements'

const deltaIntervals: Record<AchievementDeltaPeriod, string> = {
  day: '1 day',
  week: '1 week',
  month: '1 month',
  quarter: '3 month',
  'half-year': '6 month',
  year: '1 year',
}

export function achievementStatisticsQuery(kind: AchievementKind, region: VehicleRegion) {
  const definition = achievements[kind]
  const metrics = definition.slots.map(slot => ({ slot, column: slot.split('_')[1] }))
  const columns = metrics.map(({ column }) => column).join(', ')
  const deltaColumns = achievementDeltaPeriods.flatMap(period => metrics.map(({ slot, column }) => `
          toInt32(latest.${column}) - argMaxIf(toNullable(history.${column}), history.dateTime,
            history.updatedAt = latest.updatedAt - interval ${deltaIntervals[period]}) as "${slot}_delta_${period}"`))

  return `
    with latest as (
      select tag, region, updatedAt, ${columns}
      from ${definition.latestTable} final
      where region = ${quote(region)} and tag != ''
    )
    select latest.tag as rowKey, latest.tag as tankTag, latest.region as region,
      toDate(latest.updatedAt, 'UTC') as day,
      ${metrics.map(({ slot, column }) => `latest.${column} as ${slot}`).join(',\n      ')},
      ${deltaColumns.join(',')}
    from latest
    left join (
      select tag, updatedAt, dateTime, ${columns}
      from ${definition.historyTable}
      where region = ${quote(region)} and tag != ''
        and updatedAt in (
          select arrayJoin([${achievementDeltaPeriods.map(period => `updatedAt - interval ${deltaIntervals[period]}`).join(', ')}])
          from latest
        )
    ) as history on latest.tag = history.tag
    group by latest.tag, latest.region, latest.updatedAt, ${metrics.map(({ column }) => `latest.${column}`).join(', ')}
    order by latest.tag
    limit 50001
  `
}
