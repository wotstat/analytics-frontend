<template>
  <div class="onslaught-page">
    <Settings v-model:season="selectedSeason" v-model:nickname="nickname" :seasons="seasons.data ?? []" />
    <DayChart :days="barsData" class="day-chart" @select="selectDay" @deselect="deselectDay"
      :selectedIndex="selectedDayIndex" />

  </div>
</template>


<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch, watchEffect } from 'vue'
import DayChart from './dayChart/DayChart.vue'
import { dateToDbDate, LONG_CACHE_SETTINGS, query, queryAsync, queryComputed } from '@/db'
import { useI18n } from '@/shared/i18n/useI18n'
import i18n from './i18n.json'
import { preferredGameOrDefault } from '@/shared/global/globalPreferred'
import { gameToRegion } from '@/shared/game/wot'
import Settings from './settings/Settings.vue'
import { refDebounced } from '@vueuse/core'
import { getRankByRating, getSeasonDuration } from './utils'
import { DayChartData } from './types'

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

function deselectDay() {
  selectedDayIndex.value = null
}

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

const statistics = shallowRef<{
  day: string,
  minRating: number,
  maxRating: number,
  lastRating: number,
  totalBattles: number,
  totalResults: number,
  wins: number,
  prestigePoints: number,
  dmg: number,
  ratingDelta: number
}[] | null>(null)

async function load() {
  if (!seasonInterval.value) return
  const startDate = dateToDbDate(seasonInterval.value.start)
  const endDate = dateToDbDate(seasonInterval.value.end)
  const region = gameToRegion(preferredGameOrDefault.value)
  const nickName = debouncedNickname.value

  statistics.value = null

  const result = await query<{
    day: string,
    minRating: number,
    maxRating: number,
    lastRating: number,
    totalBattles: number,
    totalResults: number,
    wins: number,
    prestigePoints: number,
    dmg: number,
    ratingDelta: number
  }>(`
    with
        '${nickName}' as PLAYER,
        '${startDate}' as START_DATE,
        '${endDate}' as END_DATE,
        '${region}' as REGION,
        -2 as OFFSET,
        t1 as (
            select toStartOfDay(dateTime + interval OFFSET hour) as day,
                  min(rating) as minRating,
                  max(rating) as maxRating,
                  argMax(rating, dateTime) as lastRating
            from Event_OnComp7Info
            where playerName = PLAYER
              and dateTime between START_DATE and END_DATE
              and region = REGION
            group by day
            order by day
        ),
        t2 as (
            select toStartOfDay(dateTime + interval OFFSET hour) as day,
                  count() as totalBattles
            from Event_OnBattleStart
            where region = REGION
              and playerName = PLAYER
              and dateTime between START_DATE and END_DATE
              and battleMode = 'COMP7'
            group by day
            order by day
        ),
        t3 as (
            select toStartOfDay(dateTime + interval OFFSET hour) as day,
                  count() as totalResults,
                  countIf(result = 'win') as wins,
                  avg(personal.comp7PrestigePoints) as prestigePoints,
                  avg(personal.damageDealt) as dmg,
                  sum(comp7.ratingDelta) as ratingDelta
            from Event_OnBattleResult
            where region = REGION
              and playerName = PLAYER
              and dateTime between START_DATE and END_DATE
              and battleMode = 'COMP7'
            group by day
            order by day
        )
    select * from t1
    join t2 using day
    join t3 using day
  `)

  if (startDate != dateToDbDate(seasonInterval.value.start) ||
    endDate != dateToDbDate(seasonInterval.value.end) ||
    region != gameToRegion(preferredGameOrDefault.value) ||
    nickName != debouncedNickname.value) return

  statistics.value = result.data
}

watch([seasonInterval, debouncedNickname, preferredGameOrDefault], load)

const days = computed(() => {
  if (!seasonInterval.value) return []
  if (!statistics.value || statistics.value.length === 0) return []

  const statByDay = new Map(statistics.value?.map(s => [s.day, s]) ?? [])
  const maxRating = Math.max(...statistics.value?.map(s => s.maxRating) ?? [0], 0)

  const result = []
  let lastRating = 0
  let firstDayPlayed = -1
  for (let i = 0; i < seasonInterval.value.length; i++) {
    const isoDate = new Date(seasonInterval.value.start.getTime() + i * ONE_DAY).toISOString()
    const dbDate = `${isoDate.slice(0, 10)} ${isoDate.slice(11, 19)}`

    const stat = statByDay.get(dbDate)
    if (stat) lastRating = stat.lastRating
    if (stat && firstDayPlayed == -1) firstDayPlayed = i

    const isFuture = seasonInterval.value.start.getTime() + i * ONE_DAY > Date.now()
    const timeline: DayChartData['timeline'] = firstDayPlayed == -1 ? 'past' : isFuture ? 'future' : stat ? 'played' : 'active'

    result.push({
      dayIndex: i,
      day: dbDate,
      rating: lastRating,
      ratingPercent: maxRating ? lastRating / maxRating : 0,
      timeline,
    })

  }

  return result
})

const barsData = computed<DayChartData[]>(() => days.value.map(d => ({
  relativeRating: d.ratingPercent,
  timeline: d.timeline,
  rank: getRankByRating(d.rating, gameToRegion(preferredGameOrDefault.value))
})))


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