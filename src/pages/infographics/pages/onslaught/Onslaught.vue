<template>
  <div class="onslaught-page">
    <Settings v-model:season="selectedSeason" v-model:nickname="nickname" :seasons="seasons.data ?? []" />
    <DayChart :days="barsData" class="day-chart" @select="selectDay" @deselect="deselectDay"
      :selectedIndex="selectedDayIndex" />
    <!-- <MainStat :game="preferredGameOrDefault" :topRating @selectDay="selectDay" /> -->
    <MainStat :game="preferredGameOrDefault" :items="mainStats" @selectDay="selectDay" />
  </div>
</template>


<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch, watchEffect } from 'vue'
import DayChart from './dayChart/DayChart.vue'
import { dateToDbDate, LONG_CACHE_SETTINGS, query, queryAsync, queryComputed } from '@/db'
import { useI18n } from '@/shared/i18n/useI18n'
import i18n from '@/shared/game/comp7/i18n.json'
import { preferredGameOrDefault } from '@/shared/global/globalPreferred'
import { gameToRegion } from '@/shared/game/wot'
import Settings from './settings/Settings.vue'
import { onKeyStroke, refDebounced } from '@vueuse/core'
import { DayChartData } from './types'
import MainStat from './mainStat/MainStat.vue'
import { getDivisionLetterByRating, getRankByRating, getSeasonDuration } from '@/shared/game/comp7/utils'
import { StatItem, useMainStat, type StatisticRes } from './mainStat/useMainStat'

const ONE_HOUR = 60 * 60 * 1000
const ONE_DAY = 24 * ONE_HOUR
const COMP7_ISO_HOUR_OFFSET = -2

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

onKeyStroke('ArrowLeft', () => {
  if (selectedDayIndex.value == null) return
  if (selectedDayIndex.value - 1 < 0) return

  const nextIndex = days.value.slice(0, selectedDayIndex.value).findLastIndex(d => d.timeline == 'played')
  if (nextIndex == -1) return
  selectDay(nextIndex)
})

onKeyStroke('ArrowRight', () => {
  if (selectedDayIndex.value == null) return
  if (selectedDayIndex.value + 1 >= days.value.length) return

  const nextIndex = days.value.slice(selectedDayIndex.value + 1).findIndex(d => d.timeline == 'played')
  if (nextIndex == -1) return
  selectDay(selectedDayIndex.value + 1 + nextIndex)
})

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


const statistics = shallowRef<StatisticRes[] | null>(null)

async function load() {
  if (!seasonInterval.value) return
  const startDate = dateToDbDate(seasonInterval.value.start)
  const endDate = dateToDbDate(seasonInterval.value.end)
  const region = gameToRegion(preferredGameOrDefault.value)
  const nickName = debouncedNickname.value

  statistics.value = null
  selectedDayIndex.value = null

  const result = await query<StatisticRes>(`
    with
        '${nickName}' as PLAYER,
        '${startDate}' as START_DATE,
        '${endDate}' as END_DATE,
        '${region}' as REGION,
        ${COMP7_ISO_HOUR_OFFSET} as OFFSET,
        t0 as (
            select toStartOfDay(dateTime + interval OFFSET hour) as day,
                argMax(eliteRating, dateTime) as lastEliteRating
            from Event_OnComp7Info
            where region = REGION
                and dateTime between START_DATE and END_DATE
            group by day
            order by day
        ),
        t1 as (
            select toStartOfDay(dateTime + interval OFFSET hour) as day,
                  argMin((rating, eliteRating), rating) as minRating,
                  argMax((rating, eliteRating), rating) as maxRating,
                  argMax(rating, dateTime) as lastRating,
                  argMax(leaderboardPosition, dateTime) as lastLeaderboardPosition
            from Event_OnComp7Info
            where playerName = PLAYER
              and dateTime between START_DATE and END_DATE
              and region = REGION
            group by day
            order by day
        ),
        t2 as (
            select toStartOfDay(dateTime + interval OFFSET hour) as day,
                  toUInt32(count()) as totalBattles
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
                  toUInt32(count()) as totalResults,
                  toUInt32(countIf(personal.squadID != 0)) as squadBattles,
                  toUInt32(countIf(result = 'win')) as wins,
                  toUInt32(sum(personal.comp7PrestigePoints)) as prestigePoints,
                  toUInt32(sumIf(personal.comp7PrestigePoints, result != 'win')) as prestigePointsLose,
                  toUInt32(sumIf(personal.comp7PrestigePoints, result = 'win')) as prestigePointsWin,
                  toUInt32(max(personal.comp7PrestigePoints)) as prestigePointsMax,
                  toUInt32(sum(personal.damageDealt)) as damage,
                  toUInt32(max(personal.damageDealt)) as maxDamage,
                  toUInt32(sum(personal.damageAssistedRadio + personal.damageAssistedTrack + personal.damageAssistedStun)) as assist,
                  toUInt32(sum(personal.damageAssistedRadio)) as radioAssist,
                  toUInt32(sum(personal.damageAssistedTrack)) as trackAssist,
                  toUInt32(sum(personal.damageAssistedStun)) as stunAssist,
                  toUInt32(sum(personal.piercingEnemyHits)) as piercing,
                  toUInt32(sum(personal.shots)) as shots,
                  toUInt32(sum(personal.directEnemyHits)) as hits,
                  toInt32(sum(comp7.ratingDelta)) as ratingDelta,
                  toInt32(sumIf(comp7.ratingDelta, result = 'win')) as ratingDeltaWin,
                  toInt32(sumIf(comp7.ratingDelta, result != 'win')) as ratingDeltaLose
            from Event_OnBattleResult
            where region = REGION
              and playerName = PLAYER
              and dateTime between START_DATE and END_DATE
              and battleMode = 'COMP7'
            group by day
            order by day
        )
    select * from t0
    left outer join t1 using day
    left outer join t2 using day
    left outer join t3 using day
  `)

  if (startDate != dateToDbDate(seasonInterval.value.start) ||
    endDate != dateToDbDate(seasonInterval.value.end) ||
    region != gameToRegion(preferredGameOrDefault.value) ||
    nickName != debouncedNickname.value) return

  statistics.value = result.data
}

watch([seasonInterval, debouncedNickname, preferredGameOrDefault], load)
watch([seasonInterval, nickname, preferredGameOrDefault], () => {
  statistics.value = null
})

const days = computed(() => {
  if (!seasonInterval.value) return []
  const stat = statistics.value ?? []

  const statByDay = new Map(stat?.map(s => [s.day, s]) ?? [])
  const maxRating = Math.max(...stat?.map(s => s.lastRating) ?? [0], 0)

  const result = []
  let lastRating = 0
  let firstDayPlayed = -1
  let eliteRating = -1
  for (let i = 0; i < seasonInterval.value.length; i++) {
    const isoDate = new Date(seasonInterval.value.start.getTime() + i * ONE_DAY).toISOString()
    const dbDate = `${isoDate.slice(0, 10)} ${isoDate.slice(11, 19)}`

    const stat = statByDay.get(dbDate)
    if (stat?.lastRating) lastRating = stat.lastRating
    if (stat?.lastRating && firstDayPlayed == -1) firstDayPlayed = i
    if (stat?.lastEliteRating) eliteRating = stat.lastEliteRating

    const isFuture = seasonInterval.value.start.getTime() + i * ONE_DAY > Date.now() + COMP7_ISO_HOUR_OFFSET * ONE_HOUR
    const timeline: DayChartData['timeline'] = isFuture ? 'future' : firstDayPlayed == -1 ? 'past' : stat?.totalBattles ? 'played' : 'active'

    const ratingPercent = maxRating ? lastRating / maxRating : 0

    result.push({
      dayIndex: i,
      day: dbDate,
      rating: lastRating,
      eliteRating,
      ratingPercent: timeline == 'future' && firstDayPlayed == -1 ? 0.3 : ratingPercent,
      timeline,
      stat: stat
    })

  }

  return result
})

const barsData = computed<DayChartData[]>(() => days.value.map(d => ({
  relativeRating: d.ratingPercent,
  timeline: d.timeline,
  rank: getRankByRating(d.rating, preferredGameOrDefault.value, d.eliteRating > 0 ? d.eliteRating : undefined),
  divisionLetter: getDivisionLetterByRating(d.rating, preferredGameOrDefault.value),
  leaderboardPosition: d.stat?.lastLeaderboardPosition ?? null,
  dayIndex: d.dayIndex,
})))

const mainStats = useMainStat(days, preferredGameOrDefault, selectedSeason, selectedDayIndex)

</script>


<style lang="scss" scoped>
.onslaught-page {
  margin-top: 1em;

  .day-chart {
    margin-top: 20px;
    margin-left: calc(var(--content-page-margin, 0) * -1);
    margin-right: calc(var(--content-page-margin, 0) * -1);
  }
}
</style>