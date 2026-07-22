import type { GameVendor } from '@/shared/game/wot'

export type StatisticsLoadState<T> =
  | { status: 'loading', data: T[] }
  | { status: 'success', data: T[] }
  | { status: 'empty', data: T[] }
  | { status: 'error', data: T[], reason: string }

export type GlobalVehicleStatistic = {
  tankTag: string
  tankType: string
  tankLevel: number
  skills: [tag: string, share: number][]
  skillTag: string
  skillShare: number
  players: number
  battles: number
  winrate: number
  damage: number
  assist: number
  prestigePoints: number
  kills: number
}

export type SkillDistributionTooltipProps = {
  skills: GlobalVehicleStatistic['skills']
  game: GameVendor
  season?: string
}

export type GlobalArenaStatistic = {
  arenaTag: string
  players: number
  battles: number
  defenseWinrate: number
  baseCaptureRate: number
  duration: number
  damage: number
  assist: number
  kills: number
}

export type GlobalDailyPlayersStatistic = {
  day: string
  players: number
}
