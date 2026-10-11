import { defineParams, type QueryValues } from '@/shared/uiKit/queryStorage/useQueryStorage'
import { oneOfParam } from '@/shared/uiKit/queryStorage/params'
import { availableSlots, type Slot } from '../../vehicleMetricSelector/vehicleMetrics'

const metricKeys = new Map((Object.keys(availableSlots) as Slot[]).map(slot => {
  const [base, aggregation] = slot.split('_')
  const name = base.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
  return [slot, aggregation ? `${name}-${aggregation}` : name]
}))
const slotsByKey = new Map([...metricKeys].map(([slot, key]) => [key, slot]))
if (slotsByKey.size !== metricKeys.size) throw new Error('Ambiguous metric query key')

export const comparisonSettingsParams = defineParams({
  slot: {
    label: 'metric', key: 'vehicles.compare.metric', default: 'damage' as const, priority: -1,
    serialize: (slot: Slot) => {
      const key = metricKeys.get(slot)
      if (key === undefined) throw new Error('Unknown metric')
      return key
    },
    deserialize: (raw: string) => {
      const slot = slotsByKey.get(raw)
      if (slot === undefined) throw new Error('Unknown metric query key')
      return slot
    },
  },
  step: oneOfParam(['day', 'week', 'month'], 'day', { key: 'vehicles.compare.step', priority: -2 }),
  averageWindow: oneOfParam([3, 5, 7], null, { label: 'avg', key: 'vehicles.compare.averageWindow', priority: -3 }),
})

export type ComparisonSettings = QueryValues<typeof comparisonSettingsParams>
