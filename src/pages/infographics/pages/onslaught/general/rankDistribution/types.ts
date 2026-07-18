import type { DivisionLetter, Rank } from '@/shared/game/comp7/utils'

export type RankDistributionItem = {
  rank: Exclude<Rank, 'qual'>
  name: DivisionLetter | number
  value: number
}
