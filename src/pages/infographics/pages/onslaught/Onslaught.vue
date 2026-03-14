<template>
  <div class="onslaught-page">
    <Settings v-model:season="selectedSeason" v-model:nickname="nickname" :seasons="seasons.data ?? []" />
    <DayChart :days="[0.8, 0.9, 0.5, 0.84]" class="day-chart" @select="selectDay" :selectedIndex="selectedDayIndex" />

    {{ seasonInterval }}
  </div>
</template>


<script setup lang="ts">
import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import DayChart from './dayChart/DayChart.vue'
import { LONG_CACHE_SETTINGS, queryAsync } from '@/db'
import { useI18n } from '@/shared/i18n/useI18n'
import i18n from './i18n.json'
import { preferredGameOrDefault } from '@/shared/global/globalPreferred'
import { gameToRegion } from '@/shared/game/wot'
import Settings from './settings/Settings.vue'
import { refDebounced } from '@vueuse/core'
import { getSeasonDuration } from './utils'

const ONE_DAY = 24 * 60 * 60 * 1000

const { t } = useI18n(i18n)

const selectedDayIndex = ref<number | null>(null)
const selectedSeason = ref<string | null>(null)
const nickname = ref<string>('')
const debouncedNickname = refDebounced(nickname, 500)

function selectDay(index: number) {
  if (selectedDayIndex.value === index) selectedDayIndex.value = null
  else selectedDayIndex.value = index
}

const days = [
  { value: 0.8 }
]

const seasons = queryAsync<{ region: string, season: string, start: string, end: string }>(`
  select region, season,
        min(toStartOfDay(dateTime - interval 4 hour)) as start,
        max(toStartOfDay(dateTime - interval 4 hour)) as end
  from Event_OnComp7Info
  where region in ('RU', 'EU')
  group by region, season
  order by start desc
`, { settings: LONG_CACHE_SETTINGS })


const seasonInterval = computed(() => {
  if (!selectedSeason.value) return null
  if (!seasons.value.data) return null
  const season = seasons.value.data.find(s => s.season === selectedSeason.value && s.region === gameToRegion(preferredGameOrDefault.value))
  if (!season) return null

  const start = new Date(season.start + 'Z')
  const end = new Date(season.end + 'Z')

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null
  const seasonLength = getSeasonDuration(season.season, season.region)
  return { start, end: new Date(start.getTime() + seasonLength), length: seasonLength / ONE_DAY }
})

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