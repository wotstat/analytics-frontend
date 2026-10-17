import { formatSlotValue } from '../../vehicleMetricSelector/formatMetricValue'
import { availableSlots, type Slot, type SlotDefinition } from '../../vehicleMetricSelector/vehicleMetrics'

export function formatMetaSlotValue(slot: Slot, value: number | null | undefined, step: number | null = null) {
  if (value == null || !Number.isFinite(value)) return '—'

  const definition: SlotDefinition = availableSlots[slot]
  if (definition.format !== 'percent' || step === null || !Number.isFinite(step) || step <= 0)
    return formatSlotValue(slot, value, step).replace(',', '.')

  const fractionDigits = step.toFixed(12).replace(/0+$/, '').split('.')[1]?.length ?? 0
  return `${Number(value.toFixed(fractionDigits))}%`
}
