import type { Serializer } from '@/shared/uiKit/queryStorage/serializers/types'
import type { Slot } from '../../vehicleMetricSelector/vehicleMetrics/vehicleMetrics'
import { slotSerializer } from '../../vehicleMetricSelector/utils/slotSerializer'
import type { SortKey, SortOrder } from './useVehicleSorting'

const metadataKeys = new Map<SortKey, string>([
  ['name', 'name'], ['tankLevel', 'tank-level'], ['tankType', 'tank-type'],
])
const keysByMetadata = new Map([...metadataKeys].map(([key, raw]) => [raw, key]))

export const sortOrderSerializer: Serializer<SortOrder> = {
  serialize: ({ key, ascending }) => {
    const raw = metadataKeys.get(key) ?? slotSerializer.serialize(key as Slot)
    return ascending ? `${raw}-asc` : raw
  },
  deserialize: raw => {
    const ascending = raw.endsWith('-asc')
    const key = ascending || raw.endsWith('-desc') ? raw.slice(0, -4) : raw
    return { key: keysByMetadata.get(key) ?? slotSerializer.deserialize(key), ascending }
  },
}
