import { SKILL_TAGS } from '@/shared/game/comp7/utils'
import type { RankDistributionItem } from '../rankDistribution/types'

export const COMP7_BATTLE_PLAYERS = 14

export type GlobalStatisticsFilters = {
  region: string
  startDate: string
  endDate: string
  days: string[]
  ranks: RankDistributionItem[]
  wholeRanks: RankDistributionItem['rank'][]
}

function stringList(values: readonly string[]) {
  return `'${values.join("', '")}'`
}

function buildDayCondition(filters: GlobalStatisticsFilters) {
  if (filters.days.length > 0) return `day IN (${stringList(filters.days)})`

  return `day >= '${filters.startDate}' AND day < '${filters.endDate}'`
}

function buildRankCondition(filters: GlobalStatisticsFilters, prefix = '') {
  const wholeRanks = new Set(filters.wholeRanks)
  const rankConditions = filters.wholeRanks.map(rank => `${prefix}rank = '${rank}'`)
  const itemConditions = filters.ranks.filter(item => !wholeRanks.has(item.rank)).map(item => {
    if (item.ratingInterval) {
      const [from, to] = item.ratingInterval
      return `${prefix}leaderboardRating BETWEEN ${from} AND ${to}`
    }

    return `(${prefix}rank = '${item.rank}' AND ${prefix}division = '${item.name}')`
  })

  return [...rankConditions, ...itemConditions].join(' OR ')
}

function buildWhere(filters: GlobalStatisticsFilters, rankCondition: string) {
  return [
    `region = '${filters.region}'`,
    buildDayCondition(filters),
    rankCondition ? `(${rankCondition})` : null,
  ].filter(Boolean).join('\n      AND ')
}

export function buildGlobalVehicleStatisticsQuery(filters: GlobalStatisticsFilters, groupBySkill: boolean) {
  const validSkillCondition = `comp7SkillTag IN (${stringList(SKILL_TAGS)})`
  const rankCondition = buildRankCondition(filters)
  const skillFilter = groupBySkill ? `\n      AND ${validSkillCondition}` : ''
  const skillGroup = groupBySkill ? ', comp7SkillTag' : ''

  return `
    WITH aggregated AS (
      SELECT
        tankTag,
        any(tankType) AS tankType,
        any(tankLevel) AS tankLevel,
        sumMapIf([comp7SkillTag], [toUInt64(battles)], ${validSkillCondition}) AS skillBattleCounts,
        uniqMerge(players) AS players,
        sum(battles) AS battleCount,
        sum(wins) AS winCount,
        sum(damageDealt) AS totalDamage,
        sum(assistRadio) + sum(assistTrack) + sum(assistStun) AS totalAssist,
        sum(prestigePoints) AS totalPrestigePoints,
        sum(kills) AS totalKills
      FROM Comp7VehiclesStatistics
      WHERE ${buildWhere(filters, rankCondition)}${skillFilter}
      GROUP BY tankTag${skillGroup}
    )
    SELECT
      tankTag,
      tankType,
      tankLevel,
      arrayReverseSort(
        skill -> skill.2,
        arrayZip(
          skillBattleCounts.1,
          arrayMap(value -> value / arraySum(skillBattleCounts.2), skillBattleCounts.2)
        )
      ) AS skills,
      skills[1].1 AS skillTag,
      skills[1].2 AS skillShare,
      players,
      battleCount AS battles,
      if(battleCount = 0, 0, winCount / battleCount) AS winrate,
      if(battleCount = 0, 0, totalDamage / battleCount) AS damage,
      if(battleCount = 0, 0, totalAssist / battleCount) AS assist,
      if(battleCount = 0, 0, totalPrestigePoints / battleCount) AS prestigePoints,
      if(battleCount = 0, 0, totalKills / battleCount) AS kills
    FROM aggregated
    ORDER BY battles DESC, tankTag, skillTag
    LIMIT 1000
  `
}

export function buildGlobalArenaStatisticsQuery(filters: GlobalStatisticsFilters) {
  const ranks = buildRankCondition(filters, 'playerRank.')
  const rankCondition = ranks ? `arrayExists(playerRank -> (${ranks}), playersRanks)` : ''

  return `
    WITH aggregated AS (
      SELECT
        arenaTag,
        uniqMerge(players) AS players,
        sum(battles) AS battleCount,
        sumMapMerge(winsByTeam) AS winsByTeamMap,
        sumMapMerge(lossesByTeam) AS lossesByTeamMap,
        sumMapMerge(drawsByTeam) AS drawsByTeamMap,
        sumMapMerge(battlesByFinishReason) AS finishReasonMap,
        sum(duration) AS totalDuration,
        sum(damageDealt) AS totalDamage,
        sum(assistRadio) + sum(assistTrack) + sum(assistStun) AS totalAssist,
        sum(kills) AS totalKills
      FROM Comp7ArenasStatistics
      WHERE ${buildWhere(filters, rankCondition)}
      GROUP BY arenaTag
    ), prepared AS (
      SELECT
        *,
        mapFromArrays(winsByTeamMap.1, winsByTeamMap.2)['1'] AS defenseWins,
        mapFromArrays(lossesByTeamMap.1, lossesByTeamMap.2)['1'] AS defenseLosses,
        mapFromArrays(drawsByTeamMap.1, drawsByTeamMap.2)['1'] AS defenseDraws,
        mapFromArrays(finishReasonMap.1, finishReasonMap.2)['base'] AS baseFinishes,
        mapFromArrays(finishReasonMap.1, finishReasonMap.2)['extermination'] AS exterminationFinishes,
        mapFromArrays(finishReasonMap.1, finishReasonMap.2)['timeout'] AS timeoutFinishes
      FROM aggregated
    )
    SELECT
      arenaTag,
      players,
      battleCount AS battles,
      if(defenseWins + defenseLosses + defenseDraws = 0, 0,
        defenseWins / (defenseWins + defenseLosses + defenseDraws)) AS defenseWinrate,
      if(baseFinishes + exterminationFinishes + timeoutFinishes = 0, 0,
        baseFinishes / (baseFinishes + exterminationFinishes + timeoutFinishes)) AS baseCaptureRate,
      if(battleCount = 0, 0, totalDuration / battleCount) AS duration,
      if(battleCount = 0, 0, totalDamage / (battleCount * ${COMP7_BATTLE_PLAYERS})) AS damage,
      if(battleCount = 0, 0, totalAssist / (battleCount * ${COMP7_BATTLE_PLAYERS})) AS assist,
      if(battleCount = 0, 0, totalKills / (battleCount * ${COMP7_BATTLE_PLAYERS})) AS kills
    FROM prepared
    ORDER BY battles DESC, arenaTag
    LIMIT 1000
  `
}
