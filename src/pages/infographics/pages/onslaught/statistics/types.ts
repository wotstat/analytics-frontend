import { DivisionLetter, Rank } from '@/shared/game/comp7/utils'


export type DayChartData = {
  relativeRating: number
  timeline: 'past' | 'future' | 'active' | 'played'
  rank: Rank
  divisionLetter: DivisionLetter | '?'
  leaderboardPosition: number | null
  dayIndex: number
}