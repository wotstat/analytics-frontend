import type { Nation } from '@/shared/game/vehicles/nations/nations'
import type { VehicleType } from '@/shared/game/vehicles/vehicle/utils'

export type BattleThreshold = 0 | 20 | 50 | 100 | 500

export type LocalVehicleFilters = {
  levels: number[]
  nations: Nation[]
  types: VehicleType[]
  onlyActual: boolean
  minBattles: BattleThreshold
}

export function createLocalVehicleFilters(): LocalVehicleFilters {
  return { levels: [], nations: [], types: [], onlyActual: false, minBattles: 0 }
}
