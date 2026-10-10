import type { DivisionLetter, Rank } from '@/shared/game/domain/comp7/utils'
import type { RankImageDefinition } from '@/shared/game/components/comp7/rank/images'
import type { GameVendor } from '@/shared/game/domain/wot'
import { OffsetValue, PlacementParam } from '@/shared/uiKit/popover/utils'

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
  offset?: OffsetValue
  placement?: PlacementParam
}
