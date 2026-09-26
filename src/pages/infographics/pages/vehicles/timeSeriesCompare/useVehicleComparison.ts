import { computed, ref, type Ref } from 'vue'
import type { VehicleFilters } from '../filters/types'
import type { VehicleStatistics } from '../shared/types'
import type { VehicleSelection } from '../shared/vehicleGrouping'
import { vehicleName } from '../shared/vehicleName'
import { historySeriesColor, historySeriesColors } from '../timeSeries/seriesColors'
import { comparisonFiltersKey, snapshotComparisonFilters, type ComparisonCandidate, type ComparisonSource } from './types'

export function useVehicleComparison(filters: Ref<VehicleFilters>) {
  const sources = ref<ComparisonSource[]>([])
  const sampleNumbers = new Map<string, number>()
  const currentFiltersKey = computed(() => comparisonFiltersKey(filters.value))
  const comparedKeys = computed(() => sources.value
    .filter(source => comparisonFiltersKey(source.filters) === currentFiltersKey.value)
    .map(source => source.rowKey))

  function toggle(vehicle: VehicleStatistics, selection: VehicleSelection) {
    const filtersKey = currentFiltersKey.value
    const tag = JSON.stringify([vehicle.rowKey, filtersKey])

    if (sources.value.some(source => source.tag === tag)) {
      remove(tag)
      return
    }

    addMany([{ vehicle, selection }])
  }

  function addMany(candidates: readonly ComparisonCandidate[]) {
    const filtersKey = currentFiltersKey.value
    const tags = new Set(sources.value.map(source => source.tag))
    const colors = new Set(sources.value.map(source => source.color))
    const additions: ComparisonSource[] = []

    for (const { vehicle, selection } of candidates) {
      const tag = JSON.stringify([vehicle.rowKey, filtersKey])
      if (tags.has(tag)) continue
      tags.add(tag)

      if (!sampleNumbers.has(filtersKey)) sampleNumbers.set(filtersKey, sampleNumbers.size + 1)

      const color = historySeriesColors.find(color => !colors.has(color))
        ?? historySeriesColor(sources.value.length + additions.length)
      colors.add(color)

      additions.push({
        tag,
        rowKey: vehicle.rowKey,
        name: vehicleName(vehicle),
        color,
        selection: {
          ...selection,
          levels: [...selection.levels],
          types: [...selection.types],
          nations: [...selection.nations],
        },
        filters: snapshotComparisonFilters(filters.value),
        sampleNumber: sampleNumbers.get(filtersKey)!,
      })
    }

    if (additions.length) sources.value.push(...additions)
  }

  function remove(tag: string) {
    sources.value = sources.value.filter(source => source.tag !== tag)
  }

  function setColor(tag: string, color: string) {
    sources.value = sources.value.map(source => source.tag === tag ? { ...source, color } : source)
  }

  function clear() {
    sources.value = []
  }

  return {
    sources: computed<readonly ComparisonSource[]>(() => sources.value),
    comparedKeys,
    toggle,
    addMany,
    remove,
    setColor,
    clear,
  }
}
