import type { customBattleModes } from '@/shared/game/wot'

export type VehicleRegion = 'RU' | 'EU' | 'NA' | 'ASIA' | 'CN'
export type VehicleBattleMode = keyof typeof customBattleModes

export type VehicleFilters = {
  // Пустой список означает отсутствие ограничения, значения внутри списка объединяются через OR.
  regions: VehicleRegion[]
  battleModes: VehicleBattleMode[]
  // Формат общего селектора карт: tag:team, например 05_prohorovka:any.
  arenas: string[]
  team: 'any' | 1 | 2
  platoon: 'any' | 'solo' | 'duo' | 'trio' | 'large'
  result: 'any' | 'win' | 'loss' | 'draw'
  battleLevel: 'any' | 'same' | 'top' | 'middle' | 'bottom'
}

export function createVehicleFilters(): VehicleFilters {
  return {
    regions: ['RU'],
    battleModes: ['normalAny'],
    arenas: [],
    team: 'any',
    platoon: 'any',
    result: 'any',
    battleLevel: 'any',
  }
}
