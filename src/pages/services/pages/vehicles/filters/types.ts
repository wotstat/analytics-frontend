import type { BattleModeSelectionKey } from '@/shared/game/domain/battleModes/battleModeSelection'

export const vehicleRegions = ['RU', 'EU', 'NA', 'ASIA', 'CN'] as const
export type VehicleRegion = typeof vehicleRegions[number]

export type VehicleFilters = {
  regions: VehicleRegion[]
  battleModes: BattleModeSelectionKey[]
  arenas: string[]
  platoon: 'any' | 'solo' | 'duo' | 'trio' | 'large'
  result: 'any' | 'win' | 'loss' | 'draw'
  battleLevel: 'any' | 'same' | 'top' | 'middle' | 'bottom'
}

export function createVehicleFilters(): VehicleFilters {
  return {
    regions: ['RU'],
    battleModes: ['random'],
    arenas: [],
    platoon: 'any',
    result: 'any',
    battleLevel: 'any',
  }
}
