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
    v-model:delta-period="deltaPeriod" v-model:sort-by-delta="sortByDelta"
    @compare="comparison.toggle" @compare-all="comparison.addMany" @retry="retry" />

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
import VehiclesBackground from '../../vehicles/VehiclesBackground.vue'
import { vehicleRegions } from '../../vehicles/filters/types'
import AchievementHistory from '../history/AchievementHistory.vue'
import AchievementTable from '../AchievementTable.vue'
import type { AchievementKind } from '../utils/achievements'
import { useAchievementQueryStorage } from './useAchievementQueryStorage'
import { useAchievementStatistics } from './useAchievementStatistics'

const props = defineProps<{ kind: AchievementKind }>()
const {
  region, search, sort, localFilters, filters, comparison, metrics, step, averageWindow, annotations,
  deltaPeriod, sortByDelta,
} = useAchievementQueryStorage(props.kind)
const { statistics, retry } = useAchievementStatistics(props.kind, region)
const beforeDay = new Date().toISOString().slice(0, 10)

useBackground(VehiclesBackground, { backgroundKey: 'services-vehicles' })
</script>

<style scoped lang="scss">
.achievement-filters {
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

    &:active {
      background: rgba(255, 255, 255, 0.2);
    }

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background: rgba(255, 255, 255, 0.2);
      }
    }

    &.active {
      background: var(--blue-color);
    }
  }

  @container content (max-width: 600px) {
    .region {
      flex: 1;
      height: 25px;
    }
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
