<template>
  <VehicleFilters v-model="filters" />

  <TimeSeriesCompare
    :sources="comparison.sources.value"
    :filters
    :before-day="beforeDay"
    :from-day="fromDay"
    :min-battles="localFilters.minBattles"
    :min-players="localFilters.minPlayers"
    v-model:settings="comparison.settings.value"
    v-model:annotations="comparison.annotations.value"
    @visibility-change="comparison.setDisabled"
    @remove="comparison.remove"
    @color-change="comparison.setColor"
    @clear="comparison.clear" />

  <VehicleListTable
    v-model:grouping="grouping"
    v-model:local-filters="localFilters"
    v-model:search="search"
    v-model:period="period"
    v-model:from-beginning="fromBeginning"
    v-model:slots="slots"
    v-model:visible-slots="visibleSlots"
    v-model:sort="sort"
    :vehicles="statistics.data"
    :status="statistics.status"
    :progress="statistics.progress"
    :filters
    :before-day="beforeDay"
    :from-day="fromDay"
    :compared-keys="comparison.comparedKeys.value"
    :comparison-count="comparison.sources.value.length"
    @compare="comparison.toggle"
    @compare-all="comparison.addMany"
    @retry="retry++" />

  <section class="data-source">
    <h5>Источник данных</h5>
    <p>
      Учитываются все участники боёв, в которых хотя бы один игрок использовал мод WotStat. Бои с несколькими игроками с
      модом учитываются один раз.
    </p>
  </section>
</template>

<script setup lang="ts">
import TimeSeriesCompare from './timeSeriesCompare/TimeSeriesCompare.vue'
import { useVehicleComparison } from './timeSeriesCompare/useVehicleComparison'
import { computed, ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import VehicleListTable from './vehicleListTable/VehicleListTable.vue'
import type { Slot } from './vehicleMetricSelector/vehicleMetrics.ts'
import VehicleFilters from './filters/VehicleFilters.vue'
import { useVehicleQueryStorage } from './filters/useVehicleQueryStorage'
import { vehicleStatisticsQueries } from './shared/vehicleStatisticsQuery'
import { defaultVehicleStatisticsFromDay } from './shared/vehicleStatisticsPeriod'
import { useVehicleTableStatistics } from './vehicleListTable/useVehicleTableStatistics'
import { useBackground } from '@/shared/uiKit/pageBackground/useBackground'
import VehiclesBackground from './VehiclesBackground.vue'

useBackground(VehiclesBackground)

const { filters, localFilters, search, grouping, period, slots, sort } = useVehicleQueryStorage()
const visibleSlots = ref<Slot[]>([])

const comparison = useVehicleComparison(filters)

const beforeDay = new Date().toISOString().slice(0, 10)
const fromBeginning = useLocalStorage('vehicles-from-beginning', false)
const fromDay = computed(() => fromBeginning.value ? null : defaultVehicleStatisticsFromDay)
const retry = ref(0)
const queries = computed(() => vehicleStatisticsQueries(filters.value, grouping.value, period.value, undefined, beforeDay))
const onlyActual = computed(() => grouping.value === 'tanks' && localFilters.value.onlyActual)
const statisticsSlots = computed(() => [...new Set([
  ...visibleSlots.value,
  ...sort.value.flatMap(({ key }) => key === 'name' || key === 'tankLevel' || key === 'tankType' ? [] : [key]),
])])
const statistics = useVehicleTableStatistics(queries, statisticsSlots, onlyActual, retry)
</script>

<style scoped lang="scss">
.data-source {
  margin: 50px 0 0;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.55;

  h5 {
    margin: 0 0 6px;
    font-size: 14px;
    line-height: 1.4;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
  }
}
</style>
