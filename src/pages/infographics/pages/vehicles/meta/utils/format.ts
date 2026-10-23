import { formatSlotValue } from '../../vehicleMetricSelector/utils/formatMetricValue'
import { availableSlots, type Slot } from '../../vehicleMetricSelector/vehicleMetrics/vehicleMetrics'

export function formatMetaSlotValue(slot: Slot, value: number | null | undefined, step: number | null = null) {
  if (value == null || !Number.isFinite(value)) return '—'

  const definition = availableSlots[slot]

  if (definition.format !== 'percent' || step === null || !Number.isFinite(step) || step <= 0)
    return formatSlotValue(slot, value, step).replace(',', '.')

  const fractionDigits = step.toFixed(12).replace(/0+$/, '').split('.')[1]?.length ?? 0
  return `${Number(value.toFixed(fractionDigits))}%`
}
