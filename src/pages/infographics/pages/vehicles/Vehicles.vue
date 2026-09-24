<template>
  <VehicleFilters v-model="filters" />
  <TimeSeriesCompare :sources="comparison.sources.value" :filters :min-battles="localFilters.minBattles"
    :min-players="localFilters.minPlayers" @remove="comparison.remove" @color-change="comparison.setColor"
    @clear="comparison.clear" />
  <VehicleListTable v-model:grouping="grouping" v-model:local-filters="localFilters" v-model:period="period" :slots="defaultSlots"
    :vehicles="statistics.data" :status="statistics.status" :filters :compared-keys="comparison.comparedKeys.value"
    @compare="comparison.toggle" @retry="retry++" />
</template>

<script setup lang="ts">
import TimeSeriesCompare from './timeSeriesCompare/TimeSeriesCompare.vue'
import { useVehicleComparison } from './timeSeriesCompare/useVehicleComparison'
import type { VehicleGrouping } from './shared/vehicleGrouping'
import { ref } from 'vue'
import { useMeta } from '@/shared/composition/useMeta'
import VehicleListTable from './vehicleListTable/VehicleListTable.vue'
import { defaultSlots } from './shared/vehicleMetrics'
import type { VehicleStatistics } from './shared/types'
import VehicleFilters from './filters/VehicleFilters.vue'
import { createVehicleFilters } from './filters/types'
import { LONG_CACHE_SETTINGS, queryComputed } from '@/db'
import { vehicleStatisticsQuery } from './shared/vehicleStatisticsQuery'
import type { VehicleStatisticsPeriod } from './shared/vehicleStatisticsPeriod'
import { createLocalVehicleFilters } from './vehicleListTable/localFilters'
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
const period = ref<VehicleStatisticsPeriod>(30)

const comparison = useVehicleComparison(filters)

const retry = ref(0)
const statistics = queryComputed<VehicleStatistics>(() =>
  `${vehicleStatisticsQuery(filters.value, grouping.value, period.value)}\n-- retry ${retry.value}`,
  { settings: { ...LONG_CACHE_SETTINGS, query_cache_nondeterministic_function_handling: 'save' }, allowCache: false })
</script>
