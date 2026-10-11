import { computed } from 'vue'
import { defineParams, useQueryStorage } from '@/shared/uiKit/queryStorage/useQueryStorage'
import { booleanParam, oneOfParam, setParam, setOfParam, stringParam } from '@/shared/uiKit/queryStorage/params'
import { stringSerializer } from '@/shared/uiKit/queryStorage/serializers/stringSerializer'
import { battleModeQueryParam } from '@/shared/game/domain/battleModes/battleModeQueryParam'
import { nations } from '@/shared/game/domain/vehicles/nations'
import { vehicleTypes } from '@/shared/game/domain/vehicles/types'
import { createVehicleFilters, vehicleRegions, type VehicleFilters } from './types'
import { createLocalVehicleFilters, vehicleLevels, battleThresholds, playerThresholds, type LocalVehicleFilters } from '../vehicleListTable/filters/localFilters'

const defaults = createVehicleFilters()
const localDefaults = createLocalVehicleFilters()
const levelOptions: readonly number[] = vehicleLevels

export const vehicleQueryParams = defineParams({
  regions: setOfParam(vehicleRegions, defaults.regions, { label: 'region', key: 'vehicles.regions' }),
  battleModes: { ...battleModeQueryParam, key: 'vehicles.battleModes' },
  arenas: setParam(stringSerializer, defaults.arenas, { label: 'arena', key: 'vehicles.arenas', validate: value => /^[\w-]+$/.test(value) }),
  platoon: oneOfParam(['any', 'solo', 'duo', 'trio', 'large'], defaults.platoon, { label: 'platoon', key: 'vehicles.platoon' }),
  result: oneOfParam(['any', 'win', 'loss', 'draw'], defaults.result, { label: 'result', key: 'vehicles.result' }),
  battleLevel: oneOfParam(['any', 'same', 'top', 'middle', 'bottom'], defaults.battleLevel, { label: 'battle-level', key: 'vehicles.battleLevel' }),
  levels: setOfParam(levelOptions, localDefaults.levels, { label: 'level', key: 'vehicles.levels' }),
  nations: setOfParam(nations, localDefaults.nations, { label: 'nation', key: 'vehicles.nations' }),
  types: setOfParam(vehicleTypes, localDefaults.types, { label: 'type', key: 'vehicles.types' }),
  onlyActual: booleanParam(localDefaults.onlyActual, { label: 'only-actual', key: 'vehicles.onlyActual' }),
  minBattles: oneOfParam(battleThresholds, localDefaults.minBattles, { label: 'min-battles', key: 'vehicles.minBattles' }),
  minPlayers: oneOfParam(playerThresholds, localDefaults.minPlayers, { label: 'min-players', key: 'vehicles.minPlayers' }),
  search: stringParam('', { key: 'vehicles.search', history: 'replace', debounce: 300 })
})

export function useVehicleQueryStorage() {
  const storage = useQueryStorage(vehicleQueryParams, { history: 'push' })
  const p = storage.params

  const filters = computed<VehicleFilters>({
    get: () => ({
      regions: [...p.regions.value],
      battleModes: p.battleModes.value,
      arenas: [...p.arenas.value],
      platoon: p.platoon.value,
      result: p.result.value,
      battleLevel: p.battleLevel.value
    }),
    set: value => storage.patch({ ...value, regions: new Set(value.regions), arenas: new Set(value.arenas) })
  })

  const localFilters = computed<LocalVehicleFilters>({
    get: () => ({
      levels: [...p.levels.value],
      nations: [...p.nations.value],
      types: [...p.types.value],
      onlyActual: p.onlyActual.value,
      minBattles: p.minBattles.value,
      minPlayers: p.minPlayers.value
    }),
    set: value => storage.patch({
      ...value, levels: new Set(value.levels), nations: new Set(value.nations), types: new Set(value.types)
    })
  })

  return { filters, localFilters, search: p.search }
}
