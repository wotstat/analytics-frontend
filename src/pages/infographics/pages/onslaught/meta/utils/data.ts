import { query } from '@/db'
import type { OnslaughtMetaPeriod } from './params'
import { onslaughtQueryOptions } from './seasons'

export type OnslaughtOverview = { players: number, battles: number }
export type LeaderboardSnapshot = {
  day: string
  recalculation: string
  players: number
  legends: number
  threshold: number
  entries: LeaderboardPlayer[]
}
export type LeaderboardPlayer = { name: string, position: number, rating: number, battles: number, elite: number, division: number | null }
export type PersonalStatistics = {
  updatedAt: number
  rating: number | null
  eliteRating: number | null
  battles: number
  results: number
  wins: number
  damage: number | null
}

function sqlString(value: string) {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
}

function queryOptions(signal: AbortSignal) {
  return { ...onslaughtQueryOptions, abortSignal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]) }
}

export async function loadOnslaughtOverview(params: OnslaughtMetaPeriod, signal: AbortSignal) {
  const { data } = await query<OnslaughtOverview>(`
    SELECT uniqMerge(players) AS players, sum(battles) AS battles
    FROM Comp7ArenasStatistics
    WHERE region = ${sqlString(params.region)} AND day >= '${params.startDate}' AND day < '${params.endDate}'
    LIMIT 1
  `, queryOptions(signal))
  return data[0] ?? null
}

export async function loadLeaderboardSnapshot(params: OnslaughtMetaPeriod, signal: AbortSignal) {
  const playerFilter = params.nickname ? `lower(name) = lower(${sqlString(params.nickname)})` : 'lastRank <= 5'
  type SnapshotRow = Omit<LeaderboardSnapshot, 'day' | 'entries'> & {
    snapshotDay: string
    entries: [name: string, position: number, rating: number, battles: number, elite: number][]
  }

  const { data } = await query<SnapshotRow>(`
    SELECT toString(day) AS snapshotDay, toString(lastRecalculationTime, 'UTC') AS recalculation,
      uniqExact(bdid) AS players, uniqExactIf(bdid, lastElite) AS legends, minIf(lastRating, lastElite) AS threshold,
      arraySort(item -> item.2, groupArrayIf(${params.nickname ? 1 : 5})(
        (name, lastRank, lastRating, lastBattlesCount, lastElite), ${playerFilter}
      )) AS entries
    FROM Comp7LeaderboardDailyByRank FINAL
    WHERE region = ${sqlString(params.region)}
      AND day BETWEEN '${params.startDate}' AND toDate('${params.endDate}') + INTERVAL 5 DAY
      AND lastRecalculationTime BETWEEN '${params.startDate}' AND toDate('${params.endDate}') + INTERVAL 5 DAY
      AND NOT startsWith(name, 'MT_COMP_QA_')
    GROUP BY day, lastRecalculationTime
    ORDER BY lastRecalculationTime DESC, day DESC
    LIMIT 1
  `, queryOptions(signal))

  const snapshot = data[0]
  if (!snapshot) return null

  let playerDivision: number | null = null
  if (params.nickname && snapshot.entries.length) {
    const [name, position] = snapshot.entries[0]
    const { data } = await query<{ division: number }>(`
      SELECT division FROM Comp7LeaderboardByRank FINAL
      WHERE region = ${sqlString(params.region)}
        AND recalculationTime = toDateTime(${sqlString(snapshot.recalculation)}, 'UTC')
        AND rank = ${position} AND name = ${sqlString(name)}
      LIMIT 1
    `, queryOptions(signal))
    playerDivision = data[0]?.division ?? null
  }

  const { snapshotDay, entries, ...summary } = snapshot
  return {
    ...summary,
    day: snapshotDay,
    entries: entries.map(([name, position, rating, battles, elite]) => ({ name, position, rating, battles, elite, division: playerDivision })),
  }
}

export async function loadPersonalStatistics(params: OnslaughtMetaPeriod, signal: AbortSignal): Promise<PersonalStatistics | null> {
  const where = `region = ${sqlString(params.region)} AND playerName = ${sqlString(params.nickname)}
    AND dateTime >= '${params.startDate}' AND dateTime < '${params.endDate}'`

  const [rating, starts, results] = await Promise.all([
    query<{ currentRating: number, eliteRating: number, updatedAt: number }>(`
      SELECT argMax(rating, dateTime) AS currentRating, argMax(eliteRating, dateTime) AS eliteRating,
        toUnixTimestamp(max(dateTime)) AS updatedAt
      FROM Event_OnComp7Info
      WHERE ${where} AND season = ${sqlString(params.season ?? '')}
      GROUP BY playerName
      LIMIT 1
    `, queryOptions(signal)),

    query<{ battles: number, updatedAt: number | null }>(`
      SELECT count() AS battles, toUnixTimestamp(maxOrNull(dateTime)) AS updatedAt FROM Event_OnBattleStart
      WHERE battleMode = 'COMP7' AND ${where}
      LIMIT 1
    `, queryOptions(signal)),

    query<{ results: number, wins: number, damage: number | null, updatedAt: number | null }>(`
      SELECT count() AS results, countIf(result = 'win') AS wins, avgOrNull(personal.damageDealt) AS damage,
        toUnixTimestamp(maxOrNull(dateTime)) AS updatedAt
      FROM Event_OnBattleResult
      WHERE battleMode = 'COMP7' AND ${where}
      LIMIT 1
    `, queryOptions(signal)),
  ])

  const current = rating.data[0]
  const battles = starts.data[0]?.battles ?? 0
  const result = results.data[0]
  if (!current && !battles && !result?.results) return null

  return {
    updatedAt: Math.max(current?.updatedAt ?? 0, starts.data[0]?.updatedAt ?? 0, result?.updatedAt ?? 0),
    rating: current?.currentRating ?? null,
    eliteRating: current?.eliteRating || null,
    battles: Math.max(battles, result?.results ?? 0),
    results: result?.results ?? 0,
    wins: result?.wins ?? 0,
    damage: result?.damage ?? null,
  }
}
