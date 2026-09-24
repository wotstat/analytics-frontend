import type { Nation } from '@/shared/game/vehicles/nations/nations'
import type { VehicleType } from '@/shared/game/vehicles/vehicle/utils'

export type BattleThreshold = 0 | 20 | 50 | 100 | 500 | 1000
export type PlayerThreshold = 0 | 10 | 30 | 50 | 100 | 500

export const DEFAULT_MIN_BATTLES: BattleThreshold = 50
export const DEFAULT_MIN_PLAYERS: PlayerThreshold = 30
export const DEFAULT_ONLY_ACTUAL = true

export type LocalVehicleFilters = {
  levels: number[]
  nations: Nation[]
  types: VehicleType[]
  onlyActual: boolean
  minBattles: BattleThreshold
  minPlayers: PlayerThreshold
}

export function createLocalVehicleFilters(): LocalVehicleFilters {
  return {
    levels: [],
    nations: [],
    types: [],
    onlyActual: DEFAULT_ONLY_ACTUAL,
    minBattles: DEFAULT_MIN_BATTLES,
    minPlayers: DEFAULT_MIN_PLAYERS,
  }
}
