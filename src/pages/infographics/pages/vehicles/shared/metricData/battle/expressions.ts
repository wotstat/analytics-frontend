export type StatisticExpression = { sql: string, dailySql: string }
export type StatisticExpressions = Record<string, StatisticExpression>

export const sampleExpressions = {
  battles: { sql: 'count()', dailySql: 'sum(stats.battles)' },
  playerCount: { sql: 'uniqIf(stats.participantId, stats.participantId != 0)', dailySql: 'uniqIfMerge(stats.playersState)' },
} satisfies StatisticExpressions

export const selectExpressions = (expressions: StatisticExpressions, daily: boolean) =>
  Object.entries(expressions).map(([key, expression]) => `${expression[daily ? 'dailySql' : 'sql']} as ${key}`)
