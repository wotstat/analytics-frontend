export type StatisticsLoadState<T> =
  | { status: 'loading', data: T[] }
  | { status: 'success', data: T[] }
  | { status: 'empty', data: T[] }
  | { status: 'error', data: T[], reason: string }

export type GlobalVehicleStatistic = {
  tankTag: string
  tankType: string
  tankLevel: number
  skillTag: string
  players: number
  battles: number
  winrate: number
  damage: number
  assist: number
  prestigePoints: number
  kills: number
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
