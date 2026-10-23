import type { MetricColumnContext, MetricTableContext } from '../utils/types'
import { quote } from '../../utils/sql'
import { vehicleDailyStatisticsTable, vehicleSelectionWhere, vehicleStatisticsWhere } from './filters'
import { sampleExpressions, selectExpressions, type StatisticExpressions } from './expressions'

function tableLayout({ filters, grouping, selection }: MetricTableContext) {
  const isTank = grouping === 'tanks'
  const daily = vehicleDailyStatisticsTable(filters, selection, isTank)
  const table = daily ?? 'PlayerBattleResults'

  const withLevel = grouping === 'levels' || grouping === 'classesByLevel'
  const withType = grouping === 'classes' || grouping === 'classesByLevel'
  const dimensions = isTank ? ['stats.tankTag'] : [
    ...(withLevel ? ['stats.tankLevel'] : []),
    ...(withType ? ['stats.tankType'] : []),
  ]
  const groupBy = dimensions.join(', ')
  const keys = isTank ? ['tankTag'] : [
    ...(withLevel ? ['tankLevel'] : []),
    ...(withType ? ['tankType'] : []),
  ]
  const selectionFilter = vehicleSelectionWhere(isTank ? undefined : selection)
  const rowKey = isTank ? 'stats.tankTag' : `concat(${quote(`${grouping}:`)}, ${dimensions.map(column => `toString(${column})`).join(", ':', ")})`

  return { isTank, daily, table, withLevel, withType, groupBy, keys, selectionFilter, rowKey }
}

export function battleRowQueries(context: MetricTableContext) {
  const { filters, days, beforeDay } = context
  const { isTank, daily, table, withLevel, withType, groupBy, keys, selectionFilter, rowKey } = tableLayout(context)
  const latestTable = daily ? table : 'PlayerBattleLatestDays'
  const latestDate = daily ? 'day' : 'lastDay'
  const where = vehicleStatisticsWhere(filters, beforeDay) + selectionFilter
  const latestWhere = vehicleStatisticsWhere(filters, beforeDay, latestDate) + selectionFilter

  const selectPeriod = (conditions: string, isActual: boolean) => `
    select
      ${rowKey} as rowKey,
      ${isTank ? 'stats.tankTag' : 'NULL'} as tankTag,
      ${isTank || withLevel ? 'any(stats.tankLevel)' : 'NULL'} as tankLevel,
      ${isTank || withType ? 'any(stats.tankType)' : 'NULL'} as tankType,
      min(stats.region) as region,
      max(stats.day) as day,
      toBool(${isActual ? 1 : 0}) as isActual,
      ${selectExpressions(sampleExpressions, daily !== null).join(',\n      ')}
    from ${table} as stats
    prewhere ${where}
      and ${conditions}
    group by ${groupBy}
  `

  // Опорный день — самый частый среди последних дат в пределах двух дней от максимума.
  // Более свежие группы тоже актуальны; период каждой группы заканчивается её последним днём.
  // Оба запроса используют одинаковый срез, но читают непересекающиеся группы.
  const latest = `
    with
      latest as (
        select ${groupBy}, max(stats.${latestDate}) as latestDay
        from ${latestTable} as stats
        prewhere ${latestWhere}
        group by ${groupBy}
      ),
      (select max(latestDay) from latest) as latestDataDay,
      (
        select latestDay from latest
        where latestDay >= latestDataDay - toIntervalDay(2)
        group by latestDay
        order by count() desc, latestDay desc
        limit 1
      ) as actualDay
  `

  return {
    actual: `${latest},
      actual as (
        select ${keys.join(', ')}, latestDay
        from latest
        where latestDay >= actualDay
      )
      ${selectPeriod(`stats.day >= actualDay - toIntervalDay(${days - 1})
      and stats.day <= latestDataDay
      and (${groupBy}, stats.day) in (
        select ${keys.join(', ')},
          arrayJoin(arrayMap(offset -> latestDay - toIntervalDay(offset), range(${days}))) as day
        from actual
      )`, true)}
      order by battles desc, rowKey
    `,
    inactive: `${latest},
      inactive as (
        select ${keys.join(', ')}, latestDay
        from latest
        where latestDay < actualDay
      )
      ${selectPeriod(`stats.day >= (select min(latestDay) from inactive) - toIntervalDay(${days - 1})
      and stats.day <= (select max(latestDay) from inactive)
      and (${groupBy}, stats.day) in (
        select ${keys.join(', ')},
          arrayJoin(arrayMap(offset -> latestDay - toIntervalDay(offset), range(${days}))) as day
        from inactive
      )`, false)}
      order by battles desc, rowKey
    `,
  }
}

export function battleColumnQuery(context: MetricColumnContext, expressions: StatisticExpressions) {
  const { filters, days, rows } = context
  if (!rows.length) return null
  const { daily, table, groupBy, selectionFilter, rowKey } = tableLayout(context)

  // Даты уже получены базовым запросом. Порядок строк не меняет SQL и кеш.
  const groups = [...rows].sort((a, b) => a.rowKey < b.rowKey ? -1 : a.rowKey > b.rowKey ? 1 : 0)
  const dates = [...new Set(rows.map(row => row.day))].sort()
  const isActual = rows.every(row => row.isActual)
  const metrics = selectExpressions(expressions, daily !== null).join(',\n          ')
  let periodFilter = ''

  if (isActual) {
    // Обычно у всех актуальных групп один день. Перечисляем только исключения
    // с более свежей датой, сохраняя индивидуальные окна и правило актуальности.
    const overrides = dates.slice(1).map(day => {
      const keys = groups.filter(row => row.day === day).map(row => quote(row.rowKey)).join(', ')
      return `${rowKey} in (${keys}), toDate(${quote(day)})`
    })
    if (overrides.length) {
      const lastDay = `multiIf(${overrides.join(', ')}, firstDay)`
      periodFilter = `\n          and stats.day >= ${lastDay} - toIntervalDay(${days - 1})
      and stats.day <= ${lastDay}`
    }
  } else {
    const latest = groups.map(row => `(${quote(row.rowKey)}, ${quote(row.day)})`).join(', ')
    periodFilter = `\n          and (${rowKey}, stats.day) in (
        select latest.1,
          arrayJoin(arrayMap(offset -> toDate(latest.2) - toIntervalDay(offset), range(${days}))) as day
        from (select arrayJoin([${latest}]) as latest)
      )`
  }

  return `
    with toDate(${quote(dates[0])}) as firstDay
    select
      ${rowKey} as rowKey,
      ${metrics}
    from ${table} as stats
    prewhere ${vehicleStatisticsWhere(filters, null) + selectionFilter}
      and stats.day >= firstDay - toIntervalDay(${days - 1})
      and stats.day <= ${dates.length === 1 ? 'firstDay' : `toDate(${quote(dates[dates.length - 1])})`}${periodFilter}
    group by ${groupBy}${isActual ? '\n        having max(stats.day) >= firstDay' : ''}
    order by rowKey
  `
}
