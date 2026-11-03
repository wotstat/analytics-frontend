<template>
  <section class="achievement-filters">
    <div class="region-select">
      <button v-for="option in vehicleRegions" :key="option" type="button" class="region mt-font"
        :class="{ active: region === option }" @click="region = option">{{ option }}</button>
    </div>
  </section>

  <AchievementHistory :kind :sources="comparison.sources.value" :filters :before-day="beforeDay"
    v-model:metrics="metrics" v-model:step="step" v-model:average-window="averageWindow" v-model:annotations="annotations"
    @visibility-change="comparison.setDisabled" @remove="comparison.remove" @color-change="comparison.setColor"
    @clear="comparison.clear" />

  <AchievementTable :kind :vehicles="statistics.data" :status="statistics.status" :filters :before-day="beforeDay"
    :compared-keys="comparison.comparedKeys.value" :comparison-count="comparison.sources.value.length"
    v-model:search="search" v-model:local-filters="localFilters" v-model:sort="sort"
    @compare="comparison.toggle" @compare-all="comparison.addMany" @retry="retry" />

  <section class="data-source">
    <h5>Источник данных</h5>
    <p>Планки загружаются из публичного API игры и не зависят от боёв с модом WotStat.
      В таблице показаны последние доступные значения для выбранного региона.</p>
    <p>Дата на графике учитывает задержку в два дня между датой данных API и применением планок в игре.</p>
  </section>
</template>

<script setup lang="ts">
import { useBackground } from '@/shared/uiKit/pageBackground/useBackground'
import VehiclesBackground from '../../vehicles/VehiclesBackground.vue'
import { vehicleRegions } from '../../vehicles/filters/types'
import AchievementHistory from '../history/AchievementHistory.vue'
import AchievementTable from '../AchievementTable.vue'
import type { AchievementKind } from '../utils/achievements'
import { useAchievementQueryStorage } from './useAchievementQueryStorage'
import { useAchievementStatistics } from './useAchievementStatistics'

const props = defineProps<{ kind: AchievementKind }>()
const { region, search, sort, localFilters, filters, comparison, metrics, step, averageWindow, annotations } = useAchievementQueryStorage(props.kind)
const { statistics, retry } = useAchievementStatistics(props.kind, region)
const beforeDay = new Date().toISOString().slice(0, 10)

useBackground(VehiclesBackground, { backgroundKey: 'services-vehicles' })
</script>

<style scoped lang="scss">
@use '../../vehicles/filters/baseFilterStyles.scss' as *;

.achievement-filters {
  @include base-filter-height;

  margin: 12px 0 24px;
}

.region-select {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  min-height: 24px;
  gap: 5px;

  .region {
    height: 22px;
    padding: 0 10px;
    border-radius: 5px;
    background: rgba(255, 255, 255, 0.08);
    font-size: 14px;
    line-height: 1;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    &.active {
      background: var(--blue-color);
    }
  }
}

.data-source {
  margin-top: 50px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.55;

  h5 {
    margin: 0 0 6px;
    font-size: 14px;
  }

  p+p {
    margin-top: 8px;
  }
}
</style>
