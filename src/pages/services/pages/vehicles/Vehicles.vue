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
      Учитываются все участники боёв, в которых хотя бы один игрок использовал мод WotStat. Бои в которых участвуют
      несколько игроков с модом <b>учитываются один раз</b>.
    </p>

    <template v-if="hasSnapshotColumns">
      <h5>Планки отметок и знаков классности</h5>
      <p>
        Планки знаков классности и отметок на орудии загружаются отдельно из публичного API игры.
        В таблице отображаются последние доступные, период 1/7/30 дней на них не влияет.
        Планка общие на всю игру и не зависят от фильтров боя (режим/карта/взвод/результат/уровень).
      </p>

      <template v-if="grouping !== 'tanks'">
        <h5>
          Планки при группировке по {{
            {
              'levels': 'уровню',
              'classes': 'типу',
              'classesByLevel': 'Типу по уровню'
            }[grouping]
          }}
        </h5>

        <p>
          Планки отображают среднее по группе взвешенное по числу боёв танка. То есть <b>более популярные танки сильнее
            влияют на результат</b>. Фильтры определяют состав группы и веса танков
          <i>(танк может быть популярен в одном режиме, но непопулярен в другом)</i>.
        </p>
      </template>
    </template>
  </section>
</template>

<script setup lang="ts">
import TimeSeriesCompare from './timeSeriesCompare/TimeSeriesCompare.vue'
import { useVehicleComparison } from './timeSeriesCompare/useVehicleComparison'
import { computed, ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import VehicleListTable from './vehicleListTable/VehicleListTable.vue'
import { availableSlots, type Slot } from './vehicleMetricSelector/vehicleMetrics/vehicleMetrics.ts'
import VehicleFilters from './filters/VehicleFilters.vue'
import { useVehicleQueryStorage } from './filters/useVehicleQueryStorage'
import { vehicleStatisticsQueries } from './shared/vehicleStatisticsQuery'
import { defaultVehicleStatisticsFromDay } from './shared/vehicleStatisticsPeriod'
import { useVehicleTableStatistics } from './vehicleListTable/useVehicleTableStatistics'
import { useBackground } from '@/shared/uiKit/pageBackground/useBackground'
import VehiclesBackground from './VehiclesBackground.vue'
import { useVehiclesPageMeta } from './meta/utils/pageMeta'

useBackground(VehiclesBackground)

const { filters, localFilters, search, grouping, period, slots, sort } = useVehicleQueryStorage()
const visibleSlots = ref<Slot[]>([])
const hasSnapshotColumns = computed(() => visibleSlots.value.some(slot => availableSlots[slot].updatedDayField !== undefined))

const comparison = useVehicleComparison(filters)

useVehiclesPageMeta()

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

    &:not(:first-child) {
      margin-top: 16px;
    }
  }

  p+p {
    margin-top: 8px;
  }
}
</style>
