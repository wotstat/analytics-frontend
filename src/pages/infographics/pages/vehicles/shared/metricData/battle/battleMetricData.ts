import type { MetricData } from '../utils/types'
import { battleColumnQuery } from './tableQueries'
import { battleHistoryQueries } from './historyQueries'
import { sampleExpressions, type StatisticExpressions } from './expressions'

export function battleMetricData(key: string, expressions: StatisticExpressions): MetricData {
  const sampleOnly = Object.keys(expressions).every(metric => metric in sampleExpressions)
  const history: MetricData['history'] = context => battleHistoryQueries(context, expressions, sampleOnly)
  if (sampleOnly) return { key, history }

  return {
    key, history,
    column: context => {
      const sql = battleColumnQuery(context, expressions)
      if (!sql) return null
      return { sql, cache: { ttl: 7 * 24 * 60 * 60 } }
    },
  }
}
