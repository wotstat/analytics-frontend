import { computed } from 'vue'
import { defineParams, useQueryStorage } from '@/shared/uiKit/queryStorage/useQueryStorage'
import { oneOfParam, setParam, setOfParam } from '@/shared/uiKit/queryStorage/params'
import { stringSerializer } from '@/shared/uiKit/queryStorage/serializers/stringSerializer'
import { oneOfSerializer } from '@/shared/uiKit/queryStorage/serializers/oneOfSerializer'
import { battleModeQueryParam } from '@/shared/game/domain/battleModes/battleModeQueryParam'
import { createVehicleFilters, vehicleRegions, type VehicleFilters } from './types'
import { createLocalVehicleFilters, battleThresholds, playerThresholds, type LocalVehicleFilters } from '../vehicleListTable/filters/localFilters'
import { vehicleGroupings, type VehicleGrouping } from '../shared/vehicleGrouping'
import { vehicleTableSettingsParams } from '../vehicleListTable/query/settings'
import { vehicleListFilterParams } from '../vehicleListTable/query/filters'

const defaults = createVehicleFilters()
const localDefaults = createLocalVehicleFilters()

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
const onlyTanks = ({ grouping }: { grouping: VehicleGrouping }) => grouping === 'tanks'

export const vehicleQueryParams = defineParams({
  regions: setOfParam(vehicleRegions, defaults.regions, { label: 'region', key: 'vehicles.regions', priority: 160 }),
  battleModes: { ...battleModeQueryParam, key: 'vehicles.battleModes', priority: 150 },
  arenas: setParam(stringSerializer, defaults.arenas, { label: 'arena', key: 'vehicles.arenas', priority: 140, validate: value => /^[\w-]+$/.test(value) }),
  platoon: oneOfParam(['any', 'solo', 'duo', 'trio', 'large'], defaults.platoon, { label: 'platoon', key: 'vehicles.platoon', priority: 130 }),
  result: oneOfParam(['any', 'win', 'loss', 'draw'], defaults.result, { label: 'result', key: 'vehicles.result', priority: 120 }),
  battleLevel: oneOfParam(['any', 'same', 'top', 'middle', 'bottom'], defaults.battleLevel, { label: 'battle-level', key: 'vehicles.battleLevel', priority: 110 }),
  grouping: groupingParam,
  search: {
    ...vehicleListFilterParams.search,
    context: tableContext,
    enabled: onlyTanks
  },
  types: {
    ...vehicleListFilterParams.types,
    context: tableContext,
    enabled: ({ grouping }: { grouping: VehicleGrouping }) => grouping !== 'levels'
  },
  nations: {
    ...vehicleListFilterParams.nations,
    context: tableContext,
    enabled: onlyTanks
  },
  levels: {
    ...vehicleListFilterParams.levels,
    context: tableContext,
    enabled: ({ grouping }: { grouping: VehicleGrouping }) => grouping !== 'classes'
  },
  onlyActual: {
    ...vehicleListFilterParams.onlyActual,
    context: tableContext,
    enabled: onlyTanks
  },
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
