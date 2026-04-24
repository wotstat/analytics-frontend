<template>
  <div class="onslaught-page">
    <Settings v-model:season="selectedSeason" v-model:nickname="nickname" :seasons="seasons.data ?? []" />
    <SecondaryStat :qualification="qualificationStats" />
    <div class="chart">
      <TipSelectDay class="tip-bubble" ref="daySelectTipBubble" :display="displayedTipSelectDay" />
      <TipKeyboardChangeDay class="tip-bubble" ref="dayChangeTipBubble" />
      <DayChart :days="barsData" class="day-chart" @select="selectDay" @deselect="deselectDay"
        :selectedIndex="selectedDayIndex" ref="dayChart" />
      <Loader :isLoading="isLoading" />
    </div>

    <MainStat :game="preferredGameOrDefault" :items="mainStats" @selectDay="selectDay" />
    <VehicleTable class="vehicle-statistics" :vehicleStats :displayedDay />
    <MapsTable class="maps-statistics" :mapsStats :displayedDay />
  </div>
</template>


<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import DayChart from './dayChart/DayChart.vue'
import { dateToDbDate, LONG_CACHE_SETTINGS, query, queryAsync } from '@/db'
import { preferredGameOrDefault } from '@/shared/global/globalPreferred'
import { gameToRegion } from '@/shared/game/wot'
import Settings from './settings/Settings.vue'
import { onKeyStroke, refDebounced, useElementBounding } from '@vueuse/core'
import { DayChartData } from './types'
import MainStat from './mainStat/MainStat.vue'
import { getDivisionLetterByRating, getRankByRating, getSeasonDuration } from '@/shared/game/comp7/utils'
import { useMainStat, type StatisticRes } from './mainStat/useMainStat'
import VehicleTable from './vehicleTable/VehicleTable.vue'
import { watchWithAbortSignal } from '@/shared/utils/core'
import { useVehicleTable, VehicleRes } from './vehicleTable/useVehicleTable'
import { MapsRes, useMapsTable } from './mapsTable/useMapsTable'
import MapsTable from './mapsTable/MapsTable.vue'
import { headerOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import TipKeyboardChangeDay from './tips/TipKeyboardChangeDay.vue'
import TipSelectDay from './tips/TipSelectDay.vue'
import Loader from './Loader.vue'
import SecondaryStat from './secondaryStat/SecondaryStat.vue'




const ONE_HOUR = 60 * 60 * 1000
const ONE_DAY = 24 * ONE_HOUR
const COMP7_ISO_HOUR_OFFSET = -2

const dayChangeTipBubble = ref<InstanceType<typeof TipKeyboardChangeDay> | null>(null)
const daySelectTipBubble = ref<InstanceType<typeof TipSelectDay> | null>(null)
const dayChart = ref<HTMLElement | null>(null)

const selectedDayIndex = ref<number | null>(null)
const selectedSeason = ref<string | null>(null)
const nickname = ref<string>('')
const debouncedNickname = refDebounced(nickname, 500)
const isLoading = ref(false)

function selectDay(index: number) {
  daySelectTipBubble.value?.accept()
  if (selectedDayIndex.value !== index && selectedDayIndex.value != null) dayChangeTipBubble.value?.wrong()
  if (selectedDayIndex.value === index) selectedDayIndex.value = null
  else selectedDayIndex.value = index
}

function deselectDay() {
  selectedDayIndex.value = null
}

onKeyStroke('ArrowLeft', (e) => {
  if (selectedDayIndex.value == null) return
  if (selectedDayIndex.value - 1 < 0) return

  const nextIndex = days.value.slice(0, selectedDayIndex.value).findLastIndex(d => d.timeline == 'played')
  if (nextIndex == -1) return
  e.stopPropagation()
  e.preventDefault()
  selectDay(nextIndex)
  dayChangeTipBubble.value?.accept()
})

onKeyStroke('ArrowRight', (e) => {
  if (selectedDayIndex.value == null) return
  if (selectedDayIndex.value + 1 >= days.value.length) return

  const nextIndex = days.value.slice(selectedDayIndex.value + 1).findIndex(d => d.timeline == 'played')
  if (nextIndex == -1) return
  e.stopPropagation()
  e.preventDefault()
  selectDay(selectedDayIndex.value + 1 + nextIndex)
  dayChangeTipBubble.value?.accept()
})

onKeyStroke('Escape', (e) => {
  if (selectedDayIndex.value == null) return
  e.stopPropagation()
  e.preventDefault()
  deselectDay()
})

const { top: chartTop, height: chartHeight } = useElementBounding(dayChart)
const isChartDayVisible = computed(() => chartTop.value + chartHeight.value - headerOffset.value - 25 > 0)
const displayedDay = computed(() => !isChartDayVisible.value && selectedDayIndex.value != null ? selectedDayIndex.value + 1 : null)

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
const vehicleStatistics = shallowRef<VehicleRes[] | null>(null)
const mapsStatistics = shallowRef<MapsRes[] | null>(null)
const qualificationStatistics = shallowRef<{ battleIndex: number, result: 'win' | 'loss' | 'draw' }[] | null>(null)

async function load(abortSignal: AbortSignal) {
  if (!seasonInterval.value) return

  if (abortSignal.aborted) return
  const startDate = dateToDbDate(seasonInterval.value.start)
  const endDate = dateToDbDate(seasonInterval.value.end)
  const region = gameToRegion(preferredGameOrDefault.value)
  const nickName = debouncedNickname.value

  if (!nickName) return

  console.log('Loading data with params', { startDate, endDate, region, nickName })
  isLoading.value = true

  statistics.value = null
  selectedDayIndex.value = null
  vehicleStatistics.value = null

  const mainStatistics = await query<StatisticRes>(`
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
                  argMinIf((rating, eliteRating), dateTime, rating > 0) as firstRating,
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
                  countIf(personal.squadID != 0) as squadBattles,
                  countIf(result = 'win') as wins,
                  sum(personal.comp7PrestigePoints) as prestigePoints,
                  sumIf(personal.comp7PrestigePoints, result != 'win') as prestigePointsLose,
                  sumIf(personal.comp7PrestigePoints, result = 'win') as prestigePointsWin,
                  max(personal.comp7PrestigePoints) as prestigePointsMax,
                  sum(personal.damageDealt) as damage,
                  max(personal.damageDealt) as maxDamage,
                  sum(personal.damageAssistedRadio + personal.damageAssistedTrack + personal.damageAssistedStun) as assist,
                  sum(personal.damageAssistedRadio) as radioAssist,
                  sum(personal.damageAssistedTrack) as trackAssist,
                  sum(personal.damageAssistedStun) as stunAssist,
                  sum(personal.piercingEnemyHits) as piercing,
                  sum(personal.shots) as shots,
                  sum(personal.directEnemyHits) as hits,
                  sum(comp7.ratingDelta) as ratingDelta,
                  sumIf(comp7.ratingDelta, result = 'win') as ratingDeltaWin,
                  sumIf(comp7.ratingDelta, result != 'win') as ratingDeltaLose
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
  `, { abortSignal })

  if (abortSignal.aborted) return
  isLoading.value = false
  statistics.value = mainStatistics.data


  const qualStatisticsRes = await query<{ battleIndex: number, result: 'win' | 'loss' | 'draw' }>(`
    with
      '${nickName}' as PLAYER,
      '${startDate}' as START_DATE,
      '${endDate}' as END_DATE,
      '${region}' as REGION,
      ${COMP7_ISO_HOUR_OFFSET} as OFFSET
    select comp7.qualBattleIndex as battleIndex, result
    from Event_OnBattleResult
    where playerName = PLAYER
      and dateTime between START_DATE and END_DATE
      and region = REGION
      and battleMode = 'COMP7'
      and comp7.qualActive = true
    order by battleIndex
  `, { abortSignal })
  if (abortSignal.aborted) return
  qualificationStatistics.value = qualStatisticsRes.data


  const vehicleStatisticsRes = await query<VehicleRes>(`
    with
      '${nickName}' as PLAYER,
      '${startDate}' as START_DATE,
      '${endDate}' as END_DATE,
      '${region}' as REGION,
      ${COMP7_ISO_HOUR_OFFSET} as OFFSET
    select toStartOfDay(dateTime + interval OFFSET hour) as day,
          tankTag,
          tankType,
          tankLevel,
          count() as totalResults,
          countIf(result = 'win') as wins,
          sum(personal.damageDealt) as damage,
          sum(personal.damageAssistedRadio + personal.damageAssistedStun + personal.damageAssistedStun) as assist,
          sum(personal.comp7PrestigePoints) as prestigePoints,
          sum(personal.kills) as kills
    from Event_OnBattleResult
    where playerName = PLAYER
      and dateTime between START_DATE and END_DATE
      and region = REGION
      and battleMode = 'COMP7'
    group by day, tankTag, tankType, tankLevel
    order by day, tankTag
  `, { abortSignal })
  if (abortSignal.aborted) return
  vehicleStatistics.value = vehicleStatisticsRes.data


  const mapsStatisticsRes = await query<MapsRes>(`
    with
      '${nickName}' as PLAYER,
      '${startDate}' as START_DATE,
      '${endDate}' as END_DATE,
      '${region}' as REGION,
      ${COMP7_ISO_HOUR_OFFSET} as OFFSET
    select toStartOfDay(dateTime + interval OFFSET hour) as day,
          arenaTag,
          count() as totalResults,
          countIf(result = 'win') as wins,
          sum(personal.damageDealt) as damage,
          sum(personal.damageAssistedRadio + personal.damageAssistedStun + personal.damageAssistedStun) as assist,
          sum(personal.comp7PrestigePoints) as prestigePoints,
          sum(personal.kills) as kills
    from Event_OnBattleResult
    where playerName = PLAYER
      and dateTime between START_DATE and END_DATE
      and region = REGION
      and battleMode = 'COMP7'
    group by day, arenaTag
    order by day, arenaTag
  `, { abortSignal })
  if (abortSignal.aborted) return
  mapsStatistics.value = mapsStatisticsRes.data
}

watch([seasonInterval, nickname, preferredGameOrDefault], () => {
  statistics.value = null
  vehicleStatistics.value = null
  mapsStatistics.value = null
  isLoading.value = false
})

watchWithAbortSignal([seasonInterval, debouncedNickname, preferredGameOrDefault], signal => load(signal))


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

const selectedDay = computed(() => {
  if (selectedDayIndex.value == null) return null
  return days.value.find(d => d.dayIndex === selectedDayIndex.value)?.day ?? null
})

const mainStats = refDebounced(useMainStat(days, preferredGameOrDefault, selectedSeason, selectedDayIndex), 1)
const vehicleStats = refDebounced(useVehicleTable(computed(() => vehicleStatistics.value ?? []), selectedDay), 1)
const mapsStats = refDebounced(useMapsTable(computed(() => mapsStatistics.value ?? []), selectedDay), 1)
const qualificationStats = refDebounced(computed(() => {

  const firstPlayedDay = statistics.value?.find(d => d.totalBattles > 0)

  return {
    battles: qualificationStatistics.value ?? [],
    rating: firstPlayedDay ? firstPlayedDay.firstRating[0] : 0
  }
}), 1)

watch(selectedDayIndex, (dayIndex) => {
  if (dayIndex != null) dayChangeTipBubble.value?.display()
  else dayChangeTipBubble.value?.hide()
})

const displayedTipSelectDay = computed(() => {
  if (selectedDayIndex.value != null) return false
  if (barsData.value.some(d => d.timeline === 'played')) return true
  return false
})

</script>


<style lang="scss" scoped>
.onslaught-page {
  margin-top: 1em;

  .chart {
    margin-top: 20px;
    position: relative;

    .tip-bubble {
      position: absolute;
      top: 0;
      left: 0;
    }

    .day-chart {
      margin-left: calc(var(--content-page-margin, 0) * -1);
      margin-right: calc(var(--content-page-margin, 0) * -1);
    }

    .loader {
      position: absolute;
      height: 2px;
      left: 0;
      right: 0;

      bottom: 0;
    }
  }

  .vehicle-statistics {
    margin-top: 45px;
  }
}
</style>