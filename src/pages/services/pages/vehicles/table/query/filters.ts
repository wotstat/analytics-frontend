import { defineParams } from '@/shared/uiKit/queryStorage/useQueryStorage'
import { booleanParam, setOfParam, stringParam } from '@/shared/uiKit/queryStorage/params'
import { nations } from '@/shared/game/domain/vehicles/nations'
import { vehicleTypes } from '@/shared/game/domain/vehicles/types'
import { createLocalVehicleFilters, vehicleLevels } from '../filters/localFilters'

const defaults = createLocalVehicleFilters()
const levelOptions: readonly number[] = vehicleLevels

export const vehicleListFilterParams = defineParams({
  search: stringParam('', { key: 'vehicles.search', priority: 90, history: 'replace', debounce: 300 }),
  types: setOfParam(vehicleTypes, defaults.types, { label: 'type', key: 'vehicles.types', priority: 80 }),
  nations: setOfParam(nations, defaults.nations, { label: 'nation', key: 'vehicles.nations', priority: 70 }),
  levels: setOfParam(levelOptions, defaults.levels, { label: 'level', key: 'vehicles.levels', priority: 60 }),
  onlyActual: booleanParam(defaults.onlyActual, { label: 'only-actual', key: 'vehicles.onlyActual', priority: 50 }),
})
