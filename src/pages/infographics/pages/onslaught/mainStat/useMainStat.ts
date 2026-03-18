import { IconType } from '@/shared/game/efficiencyIcon/utils'
import { GameVendor } from '@/shared/game/wot'
import { computed, Ref } from 'vue'


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
}

export type Winrate = {
  type: 'winrate',
  value: number,
  text: string,
  wins: number,
  losses: number
  unknown: number
}

export type StatItem = TopDayRating | Simple | Winrate | RatingDelta

type Day = {
  dayIndex: number
  topRating: [number, number]
  timeline: 'played' | (string & {})
  totalBattles: number,
  totalResults: number,
  wins: number,
  damage: number,
  assist: number,
  prestigePoints: number,
  ratingDelta: number,
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
      if (maxStat && maxRating != 0) result.push({
        type: 'top-rating',
        rating: maxStat.topRating[0],
        eliteRating: maxStat.topRating[1],
        dayIndex: maxDayIndex,
        season: season.value ?? undefined
      })

      const totalBattles = data.reduce((sum, d) => sum + d.totalBattles, 0)
      result.push({ type: 'simple', value: totalBattles, text: 'Всего боёв', icon: 'battles' })

      const totalResults = data.reduce((sum, d) => sum + d.totalResults, 0)
      function avg(value: number) {
        return totalResults > 0 ? Math.round(value / totalResults) : 0
      }

      const totalWins = data.reduce((sum, d) => sum + d.wins, 0)
      const winrate = totalResults > 0 ? totalWins / totalResults : 0
      result.push({ type: 'winrate', value: winrate, text: 'Процент побед', wins: totalWins, losses: totalResults - totalWins, unknown: totalBattles - totalResults })

      const totalDamage = data.reduce((sum, d) => sum + d.damage, 0)
      result.push({ type: 'simple', value: avg(totalDamage), text: 'Урона', icon: 'dmg' })

      const totalAssist = data.reduce((sum, d) => sum + d.assist, 0)
      result.push({ type: 'simple', value: avg(totalAssist), text: 'Содействия', icon: 'assist' })

      const totalPrestigePoints = data.reduce((sum, d) => sum + d.prestigePoints, 0)
      result.push({ type: 'simple', value: avg(totalPrestigePoints), text: 'Очков престижа', icon: 'prestige-points' })
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

      result.push({ type: 'simple', value: totalResults, text: 'Всего боёв', icon: 'battles' })

      const winrate = totalResults > 0 ? day.wins / totalResults : 0
      result.push({ type: 'winrate', value: winrate, text: 'Процент побед', wins: day.wins, losses: totalResults - day.wins, unknown: totalBattles - totalResults })

      result.push({ type: 'simple', value: avg(day.damage), text: 'Урона', icon: 'dmg' })
      result.push({ type: 'simple', value: avg(day.assist), text: 'Содействия', icon: 'assist' })
      result.push({ type: 'simple', value: avg(day.prestigePoints), text: 'Очков престижа', icon: 'prestige-points' })

    }


    return result
  })
}