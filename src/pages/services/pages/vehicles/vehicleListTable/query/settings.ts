import { defineParams } from '@/shared/uiKit/queryStorage/useQueryStorage'
import { arrayParam } from '@/shared/uiKit/queryStorage/params'
import type { Serializer } from '@/shared/uiKit/queryStorage/serializers/types'
import { defaultSlots, type Slot } from '../../vehicleMetricSelector/vehicleMetrics/vehicleMetrics'
import { slotSerializer } from '../../vehicleMetricSelector/utils/slotSerializer'
import type { VehicleStatisticsPeriod } from '../../shared/vehicleStatisticsPeriod'
import type { SortOrder } from '../utils/useVehicleSorting'
import { sortOrderSerializer } from '../utils/sortOrderSerializer'

const defaultSortOrders: SortOrder[] = [{ key: 'battles', ascending: false }]

const periodKeys = new Map<VehicleStatisticsPeriod, string>([[1, 'day'], [7, 'week'], [30, 'month']])
const periodsByKey = new Map([...periodKeys].map(([period, key]) => [key, period]))
const periodSerializer: Serializer<VehicleStatisticsPeriod> = {
  serialize: period => {
    const key = periodKeys.get(period)
    if (key === undefined) throw new Error('Unknown statistics period')
    return key
  },
  deserialize: raw => {
    const period = periodsByKey.get(raw)
    if (period === undefined) throw new Error('Unknown statistics period query key')
    return period
  },
}

const columnsParam = arrayParam(slotSerializer, defaultSlots, { label: 'columns', key: 'vehicles.table.columns', priority: 10 })
const sortParam = arrayParam(sortOrderSerializer, defaultSortOrders, { key: 'vehicles.table.sort', priority: 5 })

export const vehicleTableSettingsParams = defineParams({
  period: { ...periodSerializer, default: 30 as const, key: 'vehicles.table.period', priority: 20 },
  slots: {
    ...columnsParam,
    serialize: (slots: Slot[]) => columnsParam.serialize(slots.length ? slots : defaultSlots),
  },
  sort: {
    ...sortParam,
    serialize: (orders: SortOrder[]) => sortParam.serialize(orders.length ? orders : defaultSortOrders),
  },
})
