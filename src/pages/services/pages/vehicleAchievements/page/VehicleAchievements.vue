<template>
  <section class="achievement-filters">
    <RegionSelector v-model="region" class="region-select" />
  </section>

  <AchievementHistory
    :kind
    :sources="comparison.sources.value"
    :filters
    :before-day="beforeDay"
    v-model:metrics="metrics"
    v-model:step="step"
    v-model:average-window="averageWindow"
    v-model:annotations="annotations"
    @visibility-change="comparison.setDisabled"
    @remove="comparison.remove"
    @color-change="comparison.setColor"
    @clear="comparison.clear" />

  <AchievementTable
    :kind
    :vehicles="statistics.data"
    :status="statistics.status"
    :filters
    :before-day="beforeDay"
    :compared-keys="comparison.comparedKeys.value"
    :comparison-count="comparison.sources.value.length"
    v-model:search="search"
    v-model:local-filters="localFilters"
    v-model:sort="sort"
    v-model:delta-period="deltaPeriod"
    v-model:sort-by-delta="sortByDelta"
    @compare="comparison.toggle"
    @compare-all="comparison.addMany"
    @retry="retry" />

  <section class="data-source">
    <h5>Источник данных</h5>
    <p>Планки загружаются из публичного API игры и не зависят от боёв с модом WotStat.
      В таблице показаны последние доступные значения для выбранного региона.</p>
    <p>Дата на графике учитывает задержку в два дня между датой данных API и применением планок в игре.</p>
    <p>Прирост показывает изменение за день, неделю, месяц, три месяца, полгода или год.
      Месяцы и годы считаются по календарю. Если снимка за нужную дату нет, вместо прироста показан прочерк.</p>
  </section>
</template>

<script setup lang="ts">
import { useBackground } from '@/shared/uiKit/pageBackground/useBackground'
import RegionSelector from '@/shared/game/components/selectors/region/RegionSelector.vue'
import StatisticsBackground from '../../shared/StatisticsBackground.vue'
import AchievementHistory from '../history/AchievementHistory.vue'
import AchievementTable from '../AchievementTable.vue'
import type { AchievementKind } from '../utils/achievements'
import { useAchievementQueryStorage } from './useAchievementQueryStorage'
import { useAchievementStatistics } from '../utils/useAchievementStatistics'

const props = defineProps<{ kind: AchievementKind }>()
const {
  region, search, sort, localFilters, filters, comparison, metrics, step, averageWindow, annotations,
  deltaPeriod, sortByDelta,
} = useAchievementQueryStorage(props.kind)
const { statistics, retry } = useAchievementStatistics(props.kind, region)
const beforeDay = new Date().toISOString().slice(0, 10)

useBackground(StatisticsBackground, { backgroundKey: 'services-vehicles' })
</script>

<style scoped lang="scss">
.achievement-filters {
  margin: 12px 0 24px;
}

.region-select {
  min-height: 24px;

  @container content (max-width: 600px) {
    --option-button-flex: 1;
    --option-button-height: 25px;
  }
}

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
