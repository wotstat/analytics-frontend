import type { Serializer } from '@/shared/uiKit/queryStorage/serializers/types'
import { availableSlots, type Slot } from '../vehicleMetrics/vehicleMetrics'

const metricKeys = new Map((Object.keys(availableSlots) as Slot[]).map(slot => {
  const [base, aggregation] = slot.split('_')
  const name = base.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
  return [slot, aggregation ? `${name}-${aggregation}` : name]
}))
const slotsByKey = new Map([...metricKeys].map(([slot, key]) => [key, slot]))
if (slotsByKey.size !== metricKeys.size) throw new Error('Ambiguous metric query key')

export const slotSerializer: Serializer<Slot> = {
  serialize: slot => {
    const key = metricKeys.get(slot)
    if (key === undefined) throw new Error('Unknown metric')
    return key
  },
  deserialize: raw => {
    const slot = slotsByKey.get(raw)
    if (slot === undefined) throw new Error('Unknown metric query key')
    return slot
  },
}
