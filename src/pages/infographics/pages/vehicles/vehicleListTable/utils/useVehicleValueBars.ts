import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { VehicleStatisticsRow } from '../../shared/types'
import type { Slot } from '../../vehicleMetricSelector/vehicleMetrics/vehicleMetrics'

// Apple System Colors (Default dark): red, orange, yellow, green, cyan, purple.
// https://developer.apple.com/design/human-interface-guidelines/color#Specifications
const valueBarColors = ['#ff4245', '#ffd600', '#30d158']
const extendedValueBarColors = ['#ff4245', '#ff9230', '#ffd600', '#30d158', '#3cd3fe', '#db34f2']

export function useVehicleValueBars(
  vehicles: MaybeRefOrGetter<readonly VehicleStatisticsRow[]>,
  slots: MaybeRefOrGetter<readonly Slot[]>,
  options: { enabled: MaybeRefOrGetter<boolean>, extendedPalette: MaybeRefOrGetter<boolean> },
) {
  const metricRanges = computed(() => {
    const ranges = new Map<Slot, { min: number, max: number }>()
    if (!toValue(options.enabled)) return ranges

    // Диапазон охватывает все отфильтрованные строки, включая ещё не показанные.
    const rows = toValue(vehicles)
    for (const metric of toValue(slots)) {
      let min = Infinity
      let max = -Infinity

      for (const vehicle of rows) {
        const value = vehicle[metric]
        if (value == null || !Number.isFinite(value)) continue
        min = Math.min(min, value)
        max = Math.max(max, value)
      }

      if (min !== Infinity) ranges.set(metric, { min, max })
    }

    return ranges
  })

  return (vehicle: VehicleStatisticsRow, metric: Slot) => {
    const range = metricRanges.value.get(metric)
    const value = vehicle[metric]
    if (!range || value == null || !Number.isFinite(value)) return

    // При одинаковых значениях выделять минимум или максимум не нужно.
    const progress = range.max === range.min ? 0.5 : (value - range.min) / (range.max - range.min)
    const colors = toValue(options.extendedPalette) ? extendedValueBarColors : valueBarColors
    const colorPosition = progress * (colors.length - 1)
    const colorIndex = Math.min(Math.floor(colorPosition), colors.length - 2)
    const colorMix = (colorPosition - colorIndex) * 100

    return {
      '--value-bar-height': `${progress * 100}%`,
      '--value-bar-color': `color-mix(in oklab, ${colors[colorIndex]}, ${colors[colorIndex + 1]} ${colorMix}%)`,
    }
  }
}
