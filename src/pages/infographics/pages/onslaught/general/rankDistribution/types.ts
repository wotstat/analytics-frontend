import type { DivisionLetter, Rank, RankImageDefinition } from '@/shared/game/comp7/utils'
import type { GameVendor } from '@/shared/game/wot'

export type RankDistributionItem = {
  rank: Exclude<Rank, 'qual'>
  name: DivisionLetter | number
  label?: string
  value: number
  ratingInterval?: [from: number, to: number]
}

export type RankDistributionTooltipProps = {
  rank: RankImageDefinition
  title: string
  ratingInterval: [from: number, to: number]
  players: number
  totalPlayers: number
  groupPlayers: number
  game?: GameVendor
  season?: string
  target?: HTMLElement | null
}
