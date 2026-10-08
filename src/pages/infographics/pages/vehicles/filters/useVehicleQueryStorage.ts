import { computed } from 'vue'
import { defineParams, useQueryStorage } from '@/shared/ui/queryStorage/useQueryStorage'
import { battleModeQueryParam } from '@/shared/query/battleModeQueryParam'
import { nations } from '@/shared/game/vehicles/nations/nations'
import { vehicleTypes } from '@/shared/game/vehicles/vehicle/utils'
import { createVehicleFilters, vehicleRegions, type VehicleFilters } from './types'
import {
  createLocalVehicleFilters, vehicleLevels, battleThresholds, playerThresholds, type LocalVehicleFilters
} from '../vehicleListTable/filters/localFilters'

function parseOption<T extends string | number>(options: readonly T[], raw: string): T {
  const value = options.find(option => String(option) === raw)
  if (value === undefined) throw new Error('Неизвестное значение фильтра техники')
  return value
}

function optionParam<T extends string | number>(options: readonly T[], defaultValue: T) {
  return { default: defaultValue, deserialize: (raw: string) => parseOption(options, raw) }
}

function listParam<T>(defaultValue: T[], parse: (raw: string) => T) {
  return {
    default: () => [...defaultValue],
    serialize: (values: T[]) => [...new Set(values)].join(','),
    deserialize: (raw: string) => raw === '' ? [] : [...new Set(raw.split(',').map(parse))]
  }
}

function parseIdentifier(raw: string) {
  if (!/^[\w-]+$/.test(raw)) throw new Error('Некорректный идентификатор фильтра техники')
  return raw
}

const defaults = createVehicleFilters()
const localDefaults = createLocalVehicleFilters()

const params = defineParams({
  regions: {
    ...listParam(defaults.regions, raw => parseOption(vehicleRegions, raw)),
    label: 'region', key: 'vehicles.regions'
  },
  battleModes: {
    ...battleModeQueryParam, key: 'vehicles.battleModes'
  },
  arenas: {
    ...listParam(defaults.arenas, parseIdentifier),
    label: 'arena', key: 'vehicles.arenas'
  },
  platoon: { ...optionParam(['any', 'solo', 'duo', 'trio', 'large'], defaults.platoon), key: 'vehicles.platoon' },
  result: { ...optionParam(['any', 'win', 'loss', 'draw'], defaults.result), key: 'vehicles.result' },
  battleLevel: {
    ...optionParam(['any', 'same', 'top', 'middle', 'bottom'], defaults.battleLevel),
    label: 'battle-level', key: 'vehicles.battleLevel'
  },
  levels: {
    ...listParam(localDefaults.levels, raw => parseOption(vehicleLevels, raw)),
    label: 'level', key: 'vehicles.levels'
  },
  nations: {
    ...listParam(localDefaults.nations, raw => parseOption(nations, raw)),
    label: 'nation', key: 'vehicles.nations'
  },
  types: {
    ...listParam(localDefaults.types, raw => parseOption(vehicleTypes, raw)),
    label: 'type', key: 'vehicles.types'
  },
  onlyActual: { type: Boolean, default: localDefaults.onlyActual, label: 'only-actual', key: 'vehicles.onlyActual' },
  minBattles: {
    ...optionParam(battleThresholds, localDefaults.minBattles),
    label: 'min-battles', key: 'vehicles.minBattles'
  },
  minPlayers: {
    ...optionParam(playerThresholds, localDefaults.minPlayers),
    label: 'min-players', key: 'vehicles.minPlayers'
  },
  search: { type: String, default: '', key: 'vehicles.search', history: 'replace', debounce: 300 }
})

export function useVehicleQueryStorage() {
  const storage = useQueryStorage(params, { history: 'push' })
  const p = storage.params

  const filters = computed<VehicleFilters>({
    get: () => ({
      regions: p.regions.value,
      battleModes: p.battleModes.value,
      arenas: p.arenas.value,
      platoon: p.platoon.value,
      result: p.result.value,
      battleLevel: p.battleLevel.value
    }),
    set: value => storage.patch(value)
  })

  const localFilters = computed<LocalVehicleFilters>({
    get: () => ({
      levels: p.levels.value,
      nations: p.nations.value,
      types: p.types.value,
      onlyActual: p.onlyActual.value,
      minBattles: p.minBattles.value,
      minPlayers: p.minPlayers.value
    }),
    set: value => storage.patch(value)
  })

  return { filters, localFilters, search: p.search }
}
