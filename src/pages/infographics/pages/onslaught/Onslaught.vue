<template>
  <div class="onslaught-page">
    <Settings v-model:season="selectedSeason" v-model:nickname="nickname" :seasons="seasons.data ?? []" />
    <DayChart :days="[0.8, 0.9, 0.5, 0.84]" class="day-chart" @select="selectDay" :selectedIndex="selectedDayIndex" />
  </div>
</template>


<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import DayChart from './dayChart/DayChart.vue'
import { LONG_CACHE_SETTINGS, queryAsync } from '@/db'
import { useI18n } from '@/shared/i18n/useI18n'
import i18n from './i18n.json'
import { preferredGameOrDefault } from '@/shared/global/globalPreferred'
import { gameToRegion } from '@/shared/game/wot'
import Settings from './settings/Settings.vue'

const { t } = useI18n(i18n)

const selectedDayIndex = ref<number | null>(null)
const selectedSeason = ref<string | null>(null)
const nickname = ref<string>('')

function selectDay(index: number) {
  if (selectedDayIndex.value === index) selectedDayIndex.value = null
  else selectedDayIndex.value = index
}

const days = [
  { value: 0.8 }
]

const seasons = queryAsync<{ region: string, season: string }>(`
  select region, season,
        min(toStartOfDay(dateTime - interval 4 hour)) as start,
        max(toStartOfDay(dateTime - interval 4 hour)) as end
  from Event_OnComp7Info
  where region in ('RU', 'EU')
  group by region, season
  order by start desc
`, { settings: LONG_CACHE_SETTINGS })


onMounted(() => {

})
</script>


<style lang="scss" scoped>
.onslaught-page {
  margin-top: 1em;

  .day-chart {
    margin-top: 20px;
  }
}
</style>