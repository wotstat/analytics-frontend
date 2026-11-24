import type { BattleModeSelectionKey } from '@/shared/game/domain/battleModes/battleModeSelection'
import type { QueryRegion } from '@/shared/game/domain/region/regions'
import type { VehicleLevel, VehicleType } from '@/shared/game/domain/vehicles/types'

export type MapFilters = {
  regions: QueryRegion[]
  battleModes: BattleModeSelectionKey[]
  tankTags: string[]
  // Пока выбраны конкретные танки, типы и уровни сохраняются для восстановления после сброса.
  tankTypes: VehicleType[]
  tankLevels: VehicleLevel[]
}

export function createMapFilters(): MapFilters {
  return {
    regions: ['RU'],
    battleModes: ['random'],
    tankTags: [],
    tankTypes: [],
    tankLevels: [],
  }
}
