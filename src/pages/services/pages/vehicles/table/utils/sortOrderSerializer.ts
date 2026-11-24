import type { Serializer } from '@/shared/uiKit/queryStorage/serializers/types'
import type { Slot } from '../../metrics/catalog/vehicleMetrics'
import type { SortKey, SortOrder } from './useVehicleSorting'

const metadataKeys = new Map<SortKey, string>([
  ['name', 'name'], ['tankLevel', 'tank-level'], ['tankType', 'tank-type'],
])
const keysByMetadata = new Map([...metadataKeys].map(([key, raw]) => [raw, key]))

export function sortOrderSerializer(slots: Serializer<Slot>): Serializer<SortOrder> {
  return {
    serialize: ({ key, ascending }) => {
      const raw = metadataKeys.get(key) ?? slots.serialize(key as Slot)
      return ascending ? `${raw}-asc` : raw
    },
    deserialize: raw => {
      const key = raw.replace(/-(asc|desc)$/, '')
      return { key: keysByMetadata.get(key) ?? slots.deserialize(key), ascending: raw.endsWith('-asc') }
    },
  }
}
