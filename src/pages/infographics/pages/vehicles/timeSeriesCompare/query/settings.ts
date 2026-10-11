import { defineParams, type QueryValues } from '@/shared/uiKit/queryStorage/useQueryStorage'
import { oneOfParam } from '@/shared/uiKit/queryStorage/params'
import { slotSerializer } from '../../vehicleMetricSelector/utils/slotSerializer'

export const comparisonSettingsParams = defineParams({
  slot: {
    ...slotSerializer,
    label: 'metric', key: 'vehicles.compare.metric', default: 'damage' as const, priority: -1,
  },
  step: oneOfParam(['day', 'week', 'month'], 'day', { key: 'vehicles.compare.step', priority: -2 }),
  averageWindow: oneOfParam([3, 5, 7], null, { label: 'avg', key: 'vehicles.compare.averageWindow', priority: -3 }),
})

export type ComparisonSettings = QueryValues<typeof comparisonSettingsParams>
