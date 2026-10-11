import { computed } from 'vue'
import { defineParams, useQueryStorage } from '@/shared/uiKit/queryStorage/useQueryStorage'
import { booleanParam, oneOfParam, setParam, setOfParam, stringParam } from '@/shared/uiKit/queryStorage/params'
import { stringSerializer } from '@/shared/uiKit/queryStorage/serializers/stringSerializer'
import { oneOfSerializer } from '@/shared/uiKit/queryStorage/serializers/oneOfSerializer'
import { battleModeQueryParam } from '@/shared/game/domain/battleModes/battleModeQueryParam'
import { nations } from '@/shared/game/domain/vehicles/nations'
import { vehicleTypes } from '@/shared/game/domain/vehicles/types'
import { createVehicleFilters, vehicleRegions, type VehicleFilters } from './types'
import { createLocalVehicleFilters, vehicleLevels, battleThresholds, playerThresholds, type LocalVehicleFilters } from '../vehicleListTable/filters/localFilters'
import { vehicleGroupings, type VehicleGrouping } from '../shared/vehicleGrouping'
import { vehicleTableSettingsParams } from '../vehicleListTable/query/settings'

const defaults = createVehicleFilters()
const localDefaults = createLocalVehicleFilters()
const levelOptions: readonly number[] = vehicleLevels

const groupingSerializer = oneOfSerializer(vehicleGroupings.map(grouping => grouping.value))
const groupingParam = {
  label: 'group',
  key: 'vehicles.grouping',
  default: 'tanks' as const,
  history: 'push' as const,
  priority: 100,
  serialize: (grouping: VehicleGrouping) => grouping === 'classesByLevel' ? 'classes-by-level' : groupingSerializer.serialize(grouping),
  deserialize: (raw: string) => groupingSerializer.deserialize(raw === 'classes-by-level' ? 'classesByLevel' : raw)
}
const tableContext = { grouping: groupingParam }
const tankOnly = {
  context: tableContext,
  enabled: ({ grouping }: { grouping: VehicleGrouping }) => grouping === 'tanks'
}

export const vehicleQueryParams = defineParams({
  regions: setOfParam(vehicleRegions, defaults.regions, { label: 'region', key: 'vehicles.regions', priority: 160 }),
  battleModes: { ...battleModeQueryParam, key: 'vehicles.battleModes', priority: 150 },
  arenas: setParam(stringSerializer, defaults.arenas, { label: 'arena', key: 'vehicles.arenas', priority: 140, validate: value => /^[\w-]+$/.test(value) }),
  platoon: oneOfParam(['any', 'solo', 'duo', 'trio', 'large'], defaults.platoon, { label: 'platoon', key: 'vehicles.platoon', priority: 130 }),
  result: oneOfParam(['any', 'win', 'loss', 'draw'], defaults.result, { label: 'result', key: 'vehicles.result', priority: 120 }),
  battleLevel: oneOfParam(['any', 'same', 'top', 'middle', 'bottom'], defaults.battleLevel, { label: 'battle-level', key: 'vehicles.battleLevel', priority: 110 }),
  grouping: groupingParam,
  search: stringParam('', { key: 'vehicles.search', priority: 90, history: 'replace', debounce: 300, ...tankOnly }),
  types: setOfParam(vehicleTypes, localDefaults.types, {
    label: 'type', key: 'vehicles.types', priority: 80, context: tableContext,
    enabled: ({ grouping }: { grouping: VehicleGrouping }) => grouping !== 'levels'
  }),
  nations: setOfParam(nations, localDefaults.nations, { label: 'nation', key: 'vehicles.nations', priority: 70, ...tankOnly }),
  levels: setOfParam(levelOptions, localDefaults.levels, {
    label: 'level', key: 'vehicles.levels', priority: 60, context: tableContext,
    enabled: ({ grouping }: { grouping: VehicleGrouping }) => grouping !== 'classes'
  }),
  onlyActual: booleanParam(localDefaults.onlyActual, { label: 'only-actual', key: 'vehicles.onlyActual', priority: 50, ...tankOnly }),
  minBattles: oneOfParam(battleThresholds, localDefaults.minBattles, { label: 'min-battles', key: 'vehicles.minBattles', priority: 40 }),
  minPlayers: oneOfParam(playerThresholds, localDefaults.minPlayers, { label: 'min-players', key: 'vehicles.minPlayers', priority: 30 }),
  ...vehicleTableSettingsParams,
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

  return { filters, localFilters, search: p.search, grouping: p.grouping, period: p.period, slots: p.slots, sort: p.sort }
}
