<template>
  <VehicleFilters v-model="filters" />
  <TimeSeriesCompare v-model="comparisonSources" :filters :min-battles="localFilters.minBattles" :min-players="localFilters.minPlayers" />
  <VehicleListTable v-model:grouping="grouping" v-model:local-filters="localFilters" :slots="defaultSlots"
    :vehicles="statistics.data" :status="statistics.status" :filters :compared-keys="comparedKeys" @compare="toggleComparison" @retry="retry++" />
</template>



<script setup lang="ts">
import TimeSeriesCompare from './timeSeriesCompare/TimeSeriesCompare.vue'
import { comparisonFiltersKey, nextComparisonColor, snapshotComparisonFilters, type ComparisonSource } from './timeSeriesCompare/types'
import { vehicleName } from './vehicleListTable/vehicleName'
import type { VehicleSelection } from './vehicleGrouping'
import { computed, ref } from 'vue'
import { useMeta } from '@/shared/composition/useMeta'
import VehicleListTable from './vehicleListTable/VehicleListTable.vue'
import { defaultSlots, type VehicleStatistics } from './vehicleListTable/helpers'
import VehicleFilters from './filters/VehicleFilters.vue'
import { createVehicleFilters } from './filters/types'
import { LONG_CACHE_SETTINGS, queryComputed } from '@/db'
import { vehicleStatisticsQuery } from './vehicleStatisticsQuery'
import { createLocalVehicleFilters } from './vehicleListTable/localFilters'
import type { VehicleGrouping } from './vehicleGrouping'
import { useBackground } from '@/shared/uiKit/pageBackground/useBackground'
import VehiclesBackground from './VehiclesBackground.vue'

useBackground(VehiclesBackground)

useMeta({
  title: 'Статистика танков',
  description: 'Статистика всех танков игры',
  keywords: 'статистика танков, статистика танков в боях, статистика танков в игре, статистика танков в world of tanks'
})

const filters = ref(createVehicleFilters())
const localFilters = ref(createLocalVehicleFilters())
const grouping = ref<VehicleGrouping>('tanks')

const comparisonSources = ref<ComparisonSource[]>([])
const currentComparisonFilters = computed(() => snapshotComparisonFilters(filters.value, localFilters.value))
const currentComparisonKey = computed(() => comparisonFiltersKey(currentComparisonFilters.value))
const comparedKeys = computed(() => comparisonSources.value
  .filter(source => comparisonFiltersKey(source.filters) === currentComparisonKey.value)
  .map(source => source.rowKey))
const sampleNumbers = new Map<string, number>()

function toggleComparison(vehicle: VehicleStatistics, selection: VehicleSelection) {
  const filtersKey = currentComparisonKey.value
  const tag = JSON.stringify([vehicle.rowKey, filtersKey])
  if (comparisonSources.value.some(source => source.tag === tag)) {
    comparisonSources.value = comparisonSources.value.filter(source => source.tag !== tag)
    return
  }
  if (!sampleNumbers.has(filtersKey)) sampleNumbers.set(filtersKey, sampleNumbers.size + 1)
  comparisonSources.value.push({
    tag,
    rowKey: vehicle.rowKey,
    name: vehicle.tankTag === null ? `Среднее · ${vehicleName(vehicle)}` : vehicleName(vehicle),
    color: nextComparisonColor(comparisonSources.value),
    selection: { ...selection, levels: [...selection.levels], types: [...selection.types], nations: [...selection.nations] },
    filters: snapshotComparisonFilters(filters.value, localFilters.value),
    sampleNumber: sampleNumbers.get(filtersKey)!,
  })
}

const retry = ref(0)
const statistics = queryComputed<VehicleStatistics>(() =>
  `${vehicleStatisticsQuery(filters.value, grouping.value)}\n-- retry ${retry.value}`,
  { settings: { ...LONG_CACHE_SETTINGS, query_cache_nondeterministic_function_handling: 'save' }, allowCache: false })


</script>
