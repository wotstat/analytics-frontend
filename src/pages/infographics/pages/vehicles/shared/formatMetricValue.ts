import { availableSlots, type Slot, type SlotDefinition } from './vehicleMetrics'

const integer = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const compactUnits = [
  { value: 1_000, suffix: 'k' },
  { value: 1_000_000, suffix: 'M' },
  { value: 1_000_000_000, suffix: 'B' },
  { value: 1_000_000_000_000, suffix: 'T' },
] as const

const compactFormatters = Array.from({ length: 13 }, (_, maximumFractionDigits) =>
  new Intl.NumberFormat('en-US', { useGrouping: false, maximumFractionDigits }))

function formatInteger(value: number, step: number | null) {
  // При шаге, кратном тысяче, подписи оси можно сокращать уже с 1k.
  const compactFrom = step !== null && step >= 1_000 && step % 1_000 === 0 ? 1_000 : 100_000
  if (Math.abs(value) < compactFrom) return integer.format(value)

  let unitIndex = compactUnits.findLastIndex(unit => Math.abs(value) >= unit.value)

  const fractionDigits = (index: number) => {
    const unit = compactUnits[index].value
    if (step !== null && Number.isFinite(step) && step > 0) {
      return Math.max(0, Math.min(12, Math.ceil(Math.log10(unit / step))))
    }

    if (index === 0) return 1 // 123.4k

    const magnitude = Math.floor(Math.log10(Math.abs(value) / unit))
    return Math.max(0, 2 - magnitude) // 1.23M, 12.3M, 123M
  }

  let digits = fractionDigits(unitIndex)

  // На границе единиц 999.95k округляется в 1M, а не в 1000k.
  const factor = 10 ** digits
  if (unitIndex < compactUnits.length - 1 && Math.round(Math.abs(value) / compactUnits[unitIndex].value * factor) >= 1000 * factor) {
    unitIndex++
    digits = fractionDigits(unitIndex)
  }

  const unit = compactUnits[unitIndex]
  return `${compactFormatters[digits].format(value / unit.value)}${unit.suffix}`
}

export function formatSlotValue(slot: Slot, value: number | null, step: number | null = null) {
  if (value === null || !Number.isFinite(value)) return '—'

  const definition: SlotDefinition = availableSlots[slot]
  switch (definition.format) {
    case 'percent': return `${decimal.format(value)}%`
    case 'decimal': return decimal.format(value)
    case 'distance': return `${integer.format(value)} м`
    case 'time': {
      const seconds = Math.round(value)
      return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
    }
    default: return formatInteger(value, step)
  }
}

