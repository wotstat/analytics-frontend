import { IconType } from '@/shared/game/efficiencyIcon/utils'
import { GameVendor } from '@/shared/game/wot'
import { Component, computed, h, Ref } from 'vue'
import PrestigeTooltip from './tooltips/PrestigeTooltip.vue'
import WinrateTooltip from './tooltips/WinrateTooltip.vue'
import BattlesTooltip from './tooltips/BattlesTooltip.vue'
import AssistTooltip from './tooltips/AssistTooltip.vue'
import DamageTooltip from './tooltips/DamageTooltip.vue'
import RatingTooltip from './tooltips/RatingTooltip.vue'
import TopRatingTooltip from './tooltips/TopRatingTooltip.vue'


export type TopDayRating = {
  type: 'top-rating',
  rating: number,
  eliteRating: number,
  dayIndex: number,
  season?: string,
  tooltipComponent?: Component
}

export type RatingDelta = {
  type: 'rating-delta',
  rating: number,
  eliteRating: number,
  delta: number,
  season?: string,
  tooltipComponent?: Component
}

export type Simple = {
  type: 'simple',
  value: number | string,
  text: string,
  icon: IconType
  tooltipComponent?: Component
}

export type Winrate = {
  type: 'winrate',
  value: number,
  text: string,
  tooltipComponent?: Component
}

export type StatItem = TopDayRating | Simple | Winrate | RatingDelta



export type StatisticRes = {
  day: string,
  firstRating: [rating: number, eliteRating: number],
  minRating: [rating: number, eliteRating: number],
  maxRating: [rating: number, eliteRating: number],
  lastRating: number,
  lastEliteRating: number,
  lastLeaderboardPosition: number | null,
  totalBattles: number,
  totalResults: number,
  qualificationBattles: number,
  wins: number,
  qualificationWins: number,
  squadBattles: number,
  prestigePoints: number,
  prestigePointsLose: number,
  prestigePointsWin: number,
  prestigePointsMax: number,
  damage: number,
  maxDamage: number,
  assist: number,
  radioAssist: number,
  trackAssist: number,
  stunAssist: number,
  piercing: number,
  shots: number,
  hits: number,
  ratingDelta: number,
  ratingDeltaWin: number,
  ratingDeltaLose: number,
  maxQualBattleIndex: number
}

type Day = {
  dayIndex: number,
  timeline: 'played' | 'future' | 'past' | 'active',
  rating: number,
  stat: StatisticRes | undefined
}

function findLastIndexOrDefault<T, N>(array: T[], predicate: (item: T) => boolean, defaultValue: N): number | N {
  const index = array.findLastIndex(predicate)
  return index !== -1 ? index : defaultValue
}

export function useMainStat(days: Ref<Day[]>,
  game: Ref<GameVendor | null>,
  season: Ref<string | null>,
  dayIndex: Ref<number | null>) {
  return computed<StatItem[]>(() => {
    const data = days.value
    const preferredGame = game.value
    const selectedDayIndex = dayIndex.value

    if (!data || !preferredGame) return []
    if (data.every(d => d.stat == null || d.stat.totalBattles === 0)) return []

    const result: StatItem[] = []

    if (selectedDayIndex == null) {
      const stats = data.map(d => d.stat).filter(s => s !== undefined)

      const maxRating = Math.max(...data.map(d => d.stat?.maxRating[0] ?? 0))
      const maxDayIndex = findLastIndexOrDefault(data, d => d.stat?.maxRating[0] == maxRating && d.timeline == 'played', null) ||
        findLastIndexOrDefault(data, d => d.stat != null && d.stat.totalBattles !== 0, -1)

      const maxStat = data[maxDayIndex].stat!

      function sum<T>(array: T[], value: (item: T) => number) {
        return array.reduce((sum, d) => sum + value(d), 0)
      }

      const totalResults = sum(stats, d => d.totalResults)
      function avg(value: number, options: { round?: boolean } = {}) {
        if (totalResults === 0) return 0
        const avgValue = value / totalResults
        return (options.round ?? true) ? Math.round(avgValue) : avgValue
      }

      function avgSum<T>(array: T[], value: (item: T) => number, options: { round?: boolean } = {}) {
        const total = sum(array, value)
        return avg(total, options)
      }

      const totalBattles = sum(stats, d => d.totalBattles)
      const totalWins = sum(stats, d => d.wins)
      const totalQualificationBattles = sum(stats, d => d.qualificationBattles)
      const totalQualificationWins = sum(stats, d => d.qualificationWins)

      const nonQualWins = totalWins - totalQualificationWins
      const nonQualLose = totalBattles - totalQualificationBattles - totalWins + totalQualificationWins

      const ratingWin = nonQualWins == 0 ? 0 : sum(stats, d => d.ratingDeltaWin) / nonQualWins
      const ratingLose = nonQualLose == 0 ? 0 : sum(stats, d => d.ratingDeltaLose) / nonQualLose

      result.push({
        type: 'top-rating',
        rating: maxStat.maxRating[0],
        eliteRating: maxStat.maxRating[1],
        dayIndex: maxDayIndex,
        season: season.value ?? undefined,
        tooltipComponent: h(TopRatingTooltip, {
          last: [maxStat.lastRating, maxStat.lastEliteRating],
          totalIncome: sum(stats, d => d.ratingDeltaWin) + sum(stats, d => d.ratingDeltaLose),
          ratingWin,
          ratingLose,
          leaderboardPosition: maxStat.lastLeaderboardPosition,
          season: season.value ?? undefined,
          game: preferredGame
        })
      })

      const squadBattles = sum(stats, d => d.squadBattles)
      result.push({
        type: 'simple', value: totalBattles, text: 'Всего боёв', icon: 'battles', tooltipComponent: h(BattlesTooltip, {
          solo: totalResults - squadBattles,
          squad: squadBattles
        })
      })

      const winrate = totalResults > 0 ? totalWins / totalResults : 0
      result.push({
        type: 'winrate', value: winrate, text: 'Процент побед',
        tooltipComponent: h(WinrateTooltip, {
          lose: totalResults - totalWins,
          win: totalWins,
          unknown: totalBattles - totalResults
        })
      })

      result.push({
        type: 'simple', value: avgSum(stats, d => d.damage), text: 'Урон', icon: 'dmg', tooltipComponent: h(DamageTooltip, {
          shots: avgSum(stats, d => d.shots, { round: false }),
          hits: avgSum(stats, d => d.hits, { round: false }),
          piercing: avgSum(stats, d => d.piercing, { round: false }),
          maxDamage: Math.max(...stats.map(d => d.maxDamage), 0)
        })
      })

      result.push({
        type: 'simple', value: avgSum(stats, d => d.assist), text: 'Сoдействие', icon: 'assist', tooltipComponent: h(AssistTooltip, {
          radio: avgSum(stats, d => d.radioAssist),
          track: avgSum(stats, d => d.trackAssist),
          stun: avgSum(stats, d => d.stunAssist)
        })
      })

      result.push({
        type: 'simple', value: avgSum(stats, d => d.prestigePoints), text: 'Очки престижа', icon: 'prestige-points',
        tooltipComponent: h(PrestigeTooltip, {
          lose: avgSum(stats, d => d.prestigePointsLose),
          win: avgSum(stats, d => d.prestigePointsWin),
          max: Math.max(...stats.map(d => d.prestigePointsMax), 0),
          ratingWin,
          ratingLose,
        })
      })
    } else {

      const day = data.find(d => d.dayIndex === selectedDayIndex)?.stat
      if (!day) return []

      const totalBattles = day.totalBattles
      const totalResults = day.totalResults
      function avg(value: number, options: { round?: boolean } = {}) {
        if (totalResults === 0) return 0
        const avgValue = value / totalResults
        return (options.round ?? true) ? Math.round(avgValue) : avgValue
      }

      const nonQualWins = day.wins - day.qualificationWins
      const nonQualLose = day.totalBattles - day.qualificationBattles - day.wins + day.qualificationWins

      const ratingWin = nonQualWins == 0 ? 0 : day.ratingDeltaWin / nonQualWins
      const ratingLose = nonQualLose == 0 ? 0 : day.ratingDeltaLose / nonQualLose

      result.push({
        type: 'rating-delta',
        rating: day.lastRating,
        eliteRating: day.lastEliteRating,
        delta: day.ratingDelta,
        tooltipComponent: h(RatingTooltip, {
          min: day.minRating,
          max: day.maxRating,
          current: day.lastRating,
          ratingWin,
          ratingLose,
          leaderboardPosition: day.lastLeaderboardPosition,
          season: season.value ?? undefined,
          game: preferredGame
        })
      })

      result.push({
        type: 'simple', value: totalBattles, text: 'Всего боёв', icon: 'battles', tooltipComponent: h(BattlesTooltip, {
          solo: totalResults - day.squadBattles,
          squad: day.squadBattles
        })
      })

      const winrate = totalResults > 0 ? day.wins / totalResults : 0
      result.push({
        type: 'winrate', value: winrate, text: 'Процент побед',
        tooltipComponent: h(WinrateTooltip, {
          lose: totalResults - day.wins,
          win: day.wins,
          unknown: totalBattles - totalResults
        })
      })

      result.push({
        type: 'simple', value: avg(day.damage), text: 'Урон', icon: 'dmg', tooltipComponent: h(DamageTooltip, {
          shots: avg(day.shots, { round: false }),
          hits: avg(day.hits, { round: false }),
          piercing: avg(day.piercing, { round: false }),
          maxDamage: day.maxDamage ?? 0
        })
      })

      result.push({
        type: 'simple', value: avg(day.assist), text: 'Содействие', icon: 'assist', tooltipComponent: h(AssistTooltip, {
          radio: avg(day.radioAssist),
          track: avg(day.trackAssist),
          stun: avg(day.stunAssist)
        })
      })

      result.push({
        type: 'simple', value: avg(day.prestigePoints), text: 'Очки престижа', icon: 'prestige-points',
        tooltipComponent: h(PrestigeTooltip, {
          lose: avg(day.prestigePointsLose),
          win: avg(day.prestigePointsWin),
          max: day.prestigePointsMax,
          ratingWin,
          ratingLose,
        })
      })

    }


    return result
  })
}