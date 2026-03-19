import { IconType } from '@/shared/game/efficiencyIcon/utils'
import { GameVendor } from '@/shared/game/wot'
import { Component, computed, h, Ref } from 'vue'
import PrestigeTooltip from './tooltips/PrestigeTooltip.vue'
import WinrateTooltip from './tooltips/WinrateTooltip.vue'
import BattlesTooltip from './tooltips/BattlesTooltip.vue'

export type TopDayRating = {
  type: 'top-rating',
  rating: number,
  eliteRating: number,
  dayIndex: number,
  season?: string
}

export type RatingDelta = {
  type: 'rating-delta',
  rating: number,
  eliteRating: number,
  delta: number,
  season?: string
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

type Day = {
  dayIndex: number
  topRating: [number, number]
  timeline: 'played' | (string & {})
  totalBattles: number,
  totalResults: number,
  squadBattles: number,
  wins: number,
  damage: number,
  assist: number,
  prestigePoints: number,
  prestigePointsMax: number,
  prestigePointsWin: number,
  prestigePointsLose: number,
  ratingDelta: number,
  ratingDeltaWin: number,
  ratingDeltaLose: number,
  lastRating: number,
  lastEliteRating: number,
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

    const result: StatItem[] = []

    if (selectedDayIndex == null) {

      const maxRating = Math.max(...data.map(d => d.topRating[0]))
      const maxDayIndex = data.findLastIndex(d => d.topRating[0] == maxRating && d.timeline == 'played') || data.findLastIndex(d => d.topRating[0] == maxRating)!

      const maxStat = data[maxDayIndex]

      const totalResults = data.reduce((sum, d) => sum + d.totalResults, 0)
      function avg(value: number) {
        return totalResults > 0 ? Math.round(value / totalResults) : 0
      }

      function sum<T>(array: T[], value: (item: T) => number) {
        return array.reduce((sum, d) => sum + value(d), 0)
      }

      function avgSum<T>(array: T[], value: (item: T) => number) {
        const total = sum(array, value)
        return avg(total)
      }

      const totalBattles = data.reduce((sum, d) => sum + d.totalBattles, 0)
      if (maxStat && maxRating != 0) result.push({
        type: 'top-rating',
        rating: maxStat.topRating[0],
        eliteRating: maxStat.topRating[1],
        dayIndex: maxDayIndex,
        season: season.value ?? undefined
      })

      const squadBattles = sum(data, d => d.squadBattles)
      result.push({
        type: 'simple', value: totalBattles, text: 'Всего боёв', icon: 'battles', tooltipComponent: h(BattlesTooltip, {
          solo: totalResults - squadBattles,
          squad: squadBattles
        })
      })

      const totalWins = sum(data, d => d.wins)
      const winrate = totalResults > 0 ? totalWins / totalResults : 0
      result.push({
        type: 'winrate', value: winrate, text: 'Процент побед',
        tooltipComponent: h(WinrateTooltip, {
          lose: totalResults - totalWins,
          win: totalWins,
          unknown: totalBattles - totalResults
        })
      })
      result.push({ type: 'simple', value: avgSum(data, d => d.damage), text: 'Урона', icon: 'dmg' })
      result.push({ type: 'simple', value: avgSum(data, d => d.assist), text: 'Содействия', icon: 'assist' })

      result.push({
        type: 'simple', value: avgSum(data, d => d.prestigePoints), text: 'Очков престижа', icon: 'prestige-points',
        tooltipComponent: h(PrestigeTooltip, {
          lose: avgSum(data, d => d.prestigePointsLose),
          win: avgSum(data, d => d.prestigePointsWin),
          max: Math.max(...data.map(d => d.prestigePointsMax), 0),
          ratingWin: totalResults > 0 ? sum(data, d => d.ratingDeltaWin) / totalWins : 0,
          ratingLose: (totalResults - totalWins) > 0 ? sum(data, d => d.ratingDeltaLose) / (totalResults - totalWins) : 0
        })
      })
    } else {

      const day = data.find(d => d.dayIndex === selectedDayIndex)
      if (!day) return []

      const totalBattles = day.totalBattles
      const totalResults = day.totalResults
      function avg(value: number) {
        return totalResults > 0 ? Math.round(value / totalResults) : 0
      }

      result.push({
        type: 'rating-delta',
        rating: day.lastRating,
        eliteRating: day.lastEliteRating,
        delta: day.ratingDelta
      })

      result.push({
        type: 'simple', value: totalResults, text: 'Всего боёв', icon: 'battles', tooltipComponent: h(BattlesTooltip, {
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

      result.push({ type: 'simple', value: avg(day.damage), text: 'Урона', icon: 'dmg' })
      result.push({ type: 'simple', value: avg(day.assist), text: 'Содействия', icon: 'assist' })
      result.push({
        type: 'simple', value: avg(day.prestigePoints), text: 'Очков престижа', icon: 'prestige-points',
        tooltipComponent: h(PrestigeTooltip, {
          lose: avg(day.prestigePointsLose),
          win: avg(day.prestigePointsWin),
          max: day.prestigePointsMax,
          ratingWin: totalResults > 0 ? day.ratingDeltaWin / day.wins : 0,
          ratingLose: (totalResults - day.wins) > 0 ? day.ratingDeltaLose / (totalResults - day.wins) : 0
        })
      })

    }


    return result
  })
}