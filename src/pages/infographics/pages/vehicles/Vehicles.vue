<template>
  <VehicleFilters v-model="filters" />
  <TimeSeriesCompare :sources="comparison.sources.value" :filters :min-battles="localFilters.minBattles"
    :min-players="localFilters.minPlayers" :skip-incomplete-days="localFilters.skipIncompleteDays"
    @remove="comparison.remove" @color-change="comparison.setColor" @clear="comparison.clear" />
  <VehicleListTable v-model:grouping="grouping" v-model:local-filters="localFilters" v-model:period="period"
    v-model:slots="slots" :vehicles="statistics.data" :status="statistics.status" :filters
    :compared-keys="comparison.comparedKeys.value" :comparison-count="comparison.sources.value.length"
    @compare="comparison.toggle" @compare-all="comparison.addMany" @retry="retry++" />
</template>

<script setup lang="ts">
import TimeSeriesCompare from './timeSeriesCompare/TimeSeriesCompare.vue'
import { useVehicleComparison } from './timeSeriesCompare/useVehicleComparison'
import type { VehicleGrouping } from './shared/vehicleGrouping'
import { computed, ref } from 'vue'
import { useMeta } from '@/shared/composition/useMeta'
import VehicleListTable from './vehicleListTable/VehicleListTable.vue'
import { defaultSlots, type Slot } from './vehicleMetricSelector/vehicleMetrics.ts'
import VehicleFilters from './filters/VehicleFilters.vue'
import { createVehicleFilters } from './filters/types'
import { vehicleStatisticsQueries } from './shared/vehicleStatisticsQuery'
import { useVehicleTableStatistics } from './vehicleListTable/useVehicleTableStatistics'
import type { VehicleStatisticsPeriod } from './shared/vehicleStatisticsPeriod'
import { createLocalVehicleFilters } from './vehicleListTable/filters/localFilters'
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
const slots = ref<Slot[]>([...defaultSlots])

const comparison = useVehicleComparison(filters)

const beforeDay = new Date().toISOString().slice(0, 10)
const retry = ref(0)
const queries = computed(() => vehicleStatisticsQueries(filters.value, grouping.value, period.value, undefined, slots.value, beforeDay))
const onlyActual = computed(() => grouping.value === 'tanks' && localFilters.value.onlyActual)
const statistics = useVehicleTableStatistics(
  () => `${queries.value.actual}\n-- retry ${retry.value}`,
  () => onlyActual.value ? null : `${queries.value.inactive}\n-- retry ${retry.value}`,
)
</script>
