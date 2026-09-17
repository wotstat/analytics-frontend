import type { Nation } from '@/shared/game/vehicles/nations/nations'
import type { VehicleType } from '@/shared/game/vehicles/vehicle/utils'

export type BattleThreshold = 0 | 20 | 50 | 100 | 500
export type PlayerThreshold = 0 | 10 | 30 | 50 | 100
export const DEFAULT_MIN_BATTLES: BattleThreshold = 50
export const DEFAULT_MIN_PLAYERS: PlayerThreshold = 30

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
    levels: [], nations: [], types: [], onlyActual: false,
    minBattles: DEFAULT_MIN_BATTLES, minPlayers: DEFAULT_MIN_PLAYERS
  }
}
