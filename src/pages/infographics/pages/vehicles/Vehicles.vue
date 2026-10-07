<template>
  <VehicleFilters v-model="filters" />
  <TimeSeriesCompare :sources="comparison.sources.value" :filters :min-battles="localFilters.minBattles"
    :min-players="localFilters.minPlayers"
    @remove="comparison.remove" @color-change="comparison.setColor" @clear="comparison.clear" />
  <VehicleListTable v-model:grouping="grouping" v-model:local-filters="localFilters" v-model:period="period"
    v-model:slots="slots" :vehicles="statistics.data" :status="statistics.status" :progress="statistics.progress"
    :filters
    :compared-keys="comparison.comparedKeys.value" :comparison-count="comparison.sources.value.length"
    @compare="comparison.toggle" @compare-all="comparison.addMany" @retry="retry++" />

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
const queries = computed(() => vehicleStatisticsQueries(filters.value, grouping.value, period.value, undefined, beforeDay))
const onlyActual = computed(() => grouping.value === 'tanks' && localFilters.value.onlyActual)
const statistics = useVehicleTableStatistics(queries, slots, onlyActual, retry)
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
