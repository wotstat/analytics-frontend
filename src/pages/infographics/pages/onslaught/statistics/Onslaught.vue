<template>
  <div class="onslaught-page">
    <Settings v-model:season="selectedSeason" v-model:nickname="nickname" v-model:region="selectedRegion"
      v-model:seasons="seasons" :showNameInput="true" @clear-nickname="nicknameStorage.flush()" />

    <div class="live-line">
      <Live :show="showLiveBadge" />
    </div>

    <SecondaryStat :qualification="qualificationStats" :currentRating="currentRating" :game="game"
      :season="selectedSeason || 'latest'" />
    <div class="chart">
      <TipSelectDay class="tip-bubble" ref="daySelectTipBubble" :display="displayedTipSelectDay" />
      <TipKeyboardChangeDay class="tip-bubble" ref="dayChangeTipBubble" />
      <DayChart :days="barsData" class="day-chart" @select="selectDay" @deselect="deselectDay"
        :selectedIndex="selectedDayIndex" ref="dayChart" />
      <Loader :isLoading="isLoading" />
    </div>

    <Transition name="fade">
      <div class="player-not-found"
        v-if="!isLoading && statistics && statistics.reduce((acc, stat) => acc + (stat.totalBattles ?? 0), 0) === 0">
        <b>Статистика для игрока не найдена</b>
        <p>Для отображения статистики необходимо установить мод <a href="/install?preset=analytics" target="_blank"
            rel="noopener noreferrer">WotStat Аналитика</a></p>
      </div>
    </Transition>

    <MainStat :game="game" :items="mainStats" @selectDay="selectDay" />
    <VehicleTable class="vehicle-statistics" :game="game" :vehicleStats :displayedDay />
    <MapsTable class="maps-statistics" :game="game" :mapsStats :displayedDay />
    <BattleHistoryTable class="battle-history-statistics" :game="game" :history="battlesStats" :displayedDay
      :nickname="nickname" />
  </div>
</template>


<script setup lang="ts">
import { computed, ref, shallowRef, watch, useTemplateRef } from 'vue'
import DayChart from './dayChart/DayChart.vue'
import { dateToDbDate, query, queryComputedFirst } from '@/db'
import { gameToRegion, regionToGame } from '@/shared/game/domain/wot'
import Settings from '../shared/settings/Settings.vue'
import { useOnslaughtQueryStorage, useOnslaughtNicknameStorage } from '../shared/useOnslaughtQueryStorage'
import { computedWithControl, onKeyStroke, refDebounced, useElementBounding } from '@vueuse/core'
import { DayChartData } from './types'
import MainStat from './mainStat/MainStat.vue'
import { compareRanks, getDivisionLetterFromTag, getEnergyPerBattle, getMaxEnergyLimit, getRankFromTag, getRatingInactiveDecreasePerDay, getRegionIsoHourOffset, getSeasonQualificationCount, type Rank, type RankTag } from '@/shared/game/domain/comp7/utils'
import { useMainStat, type StatisticRes } from './mainStat/useMainStat'
import VehicleTable from './vehicleTable/VehicleTable.vue'
import { useVehicleTable, VehicleRes } from './vehicleTable/useVehicleTable'
import { MapsRes, useMapsTable } from './mapsTable/useMapsTable'
import MapsTable from './mapsTable/MapsTable.vue'
import BattleHistoryTable from './battleHistoryTable/BattleHistoryTable.vue'
import { headerOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import TipKeyboardChangeDay from './tips/TipKeyboardChangeDay.vue'
import TipSelectDay from './tips/TipSelectDay.vue'
import Loader from '../shared/Loader.vue'
import SecondaryStat from './secondaryStat/SecondaryStat.vue'
import { refDebouncedCheck } from '@/shared/utils/refDebouncedCheck'
import { useSeasonInterval } from '../shared/useSeasonInterval'
import { BattleRes, useBattleResultTable } from './battleHistoryTable/useBattleHistory'
import { ChannelsTypes, useAnalyticsRealtime } from '@/shared/external/realtime/useAnalyticsRealtime'
import Live from './components/Live.vue'
import { useStableScrollbarGutter } from '@/shared/composition/useStableScrollbarGutter.ts'
import { usePageMeta } from '@/meta/pageMeta'
import { onslaughtSelectionMetaTags } from '../meta/utils/params'

useStableScrollbarGutter()

const ONE_HOUR = 60 * 60 * 1000
const ONE_DAY = 24 * ONE_HOUR

const dayChangeTipBubble = useTemplateRef<InstanceType<typeof TipKeyboardChangeDay>>('dayChangeTipBubble')
const daySelectTipBubble = useTemplateRef<InstanceType<typeof TipSelectDay>>('daySelectTipBubble')
const dayChart = useTemplateRef<HTMLElement>('dayChart')

const selectedDayIndex = ref<number | null>(null)
const { params: { season: selectedSeason, region: selectedRegion } } = useOnslaughtQueryStorage()
const seasons = ref<{ region: string, season: string, start: string, end: string }[]>([])
const nicknameStorage = useOnslaughtNicknameStorage()
const { nickname } = nicknameStorage.params

usePageMeta(() => onslaughtSelectionMetaTags({
  region: selectedRegion.value,
  season: selectedSeason.value,
  nickname: nickname.value,
}, 'Личная статистика', true))

const debouncedNickname = refDebouncedCheck(nickname, (n, old) => old.length > 0 ? 500 : 0)
const isLoading = ref(false)
const game = computed(() => regionToGame(selectedRegion.value))

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
const seasonInterval = useSeasonInterval(seasons, selectedSeason, selectedRegion)
const seasonTimeInterval = computed(() => {
  if (!seasonInterval.value) return null
  const offset = getRegionIsoHourOffset(selectedRegion.value) * ONE_HOUR
  return {
    start: seasonInterval.value.start.getTime() - offset,
    end: seasonInterval.value.end.getTime() - offset
  }
})

const statistics = shallowRef<StatisticRes[] | null>(null)
const vehicleStatistics = shallowRef<VehicleRes[] | null>(null)
const mapsStatistics = shallowRef<MapsRes[] | null>(null)
const battleHistoryStatistics = shallowRef<BattleRes[] | null>(null)
const qualificationStatistics = shallowRef<{ battleIndex: number, result: 'win' | 'loss' | 'draw' }[] | null>(null)

const leaderboardStatistics = queryComputedFirst<{ top1: number, legendC: number, legendB: number, legendA: number, top10: number, top100: number }>(() => `
  with
    '${selectedRegion.value}' as REGION,
    toDateTime('${seasonInterval.value ? dateToDbDate(seasonInterval.value.start) : '2000-01-01'}', 'UTC') as START_DATE,
    toDateTime('${seasonInterval.value ? dateToDbDate(seasonInterval.value.end) : '2000-01-01'}', 'UTC') as END_DATE,
    (
      select max(lastRecalculationTime)
      from Comp7LeaderboardDaily
      where region = REGION
        and day between toDate(START_DATE) and toDate(END_DATE) + interval 1 day
        and lastRecalculationTime between START_DATE and END_DATE + interval 1 day
    ) as latestTime
  select max(rating) as top1, min(rating) as legendC,
    minIf(rating, division in (11, 12)) as legendB, minIf(rating, division = 11) as legendA,
    anyIf(rating, rank=10) as top10, anyIf(rating, rank=100) as top100
  from Comp7LeaderboardByRank
  where not startsWith(name, 'MT_COMP_QA_') and region = REGION and recalculationTime = latestTime and elite = true
  limit 1
`, { top1: 0, legendC: 0, legendB: 0, legendA: 0, top10: 0, top100: 0 })

async function load(abortSignal: AbortSignal, soft = false) {
  const nickName = debouncedNickname.value
  if (!nickName) return
  if (abortSignal.aborted) return

  isLoading.value = true

  if (!seasonInterval.value) return
  const startDate = dateToDbDate(seasonInterval.value.start)
  const endDate = dateToDbDate(seasonInterval.value.end)
  const region = selectedRegion.value

  console.log('Loading data with params', { startDate, endDate, region, nickName })

  if (!soft) {
    statistics.value = null
    selectedDayIndex.value = null
    vehicleStatistics.value = null
    mapsStatistics.value = null
    battleHistoryStatistics.value = null
  }

  const mainStatistics = await query<StatisticRes>(`
    with
        '${nickName}' as PLAYER,
        '${startDate}' - interval OFFSET hour as START_DATE,
        '${endDate}' - interval OFFSET hour as END_DATE,
        '${region}' as REGION,
        '${selectedSeason.value ?? ''}' as SEASON,
        ${getRegionIsoHourOffset(region)} as OFFSET,
        t1 as (
            select toStartOfDay(dateTime + interval OFFSET hour) as day,
                  argMinIf((rating, nullIf(rank, '')), (dateTime, id), rank not in ('qual', '')) as firstRating,
                  argMin((rating, nullIf(rank, '')), (rating, dateTime, id)) as minRating,
                  argMax((rating, nullIf(rank, '')), (rating, dateTime, id)) as maxRating,
                  argMax((rating, nullIf(rank, ''), leaderboardPosition), (dateTime, id)) as lastSnapshot,
                  lastSnapshot.1 as lastRating,
                  lastSnapshot.2 as lastRank,
                  lastSnapshot.3 as lastLeaderboardPosition,
                  count() as ratingSnapshots,
                  groupUniqArrayIf(rank, rank != '') as ranks
            from Event_OnComp7Info
            where playerName = PLAYER
              and dateTime >= START_DATE and dateTime < END_DATE
              and region = REGION and season = SEASON
            group by day
            order by day
        ),
        t2 as (
            select toStartOfDay(dateTime + interval OFFSET hour) as day,
                  count() as totalBattles
            from Event_OnBattleStart
            where region = REGION
              and playerName = PLAYER
              and dateTime >= START_DATE and dateTime < END_DATE
              and battleMode = 'COMP7'
            group by day
            order by day
        ),
        t3 as (
            select toStartOfDay(dateTime + interval OFFSET hour) as day,
                  count() as totalResults,
                  countIf(personal.squadID != 0) as squadBattles,
                  countIf(comp7.qualActive = true) as qualificationBattles,
                  countIf(comp7.qualActive = true and result = 'win') as qualificationWins,
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
                  sumIf(comp7.ratingDelta, result != 'win') as ratingDeltaLose,
                  max(comp7.qualBattleIndex) as maxQualBattleIndex
            from Event_OnBattleResult
            where region = REGION
              and playerName = PLAYER
              and dateTime >= START_DATE and dateTime < END_DATE
              and battleMode = 'COMP7'
            group by day
            order by day
        )
    select * from (
      select day from t1
      union distinct select day from t2
      union distinct select day from t3
    ) as eventDays
    left any join t1 using day
    left any join t2 using day
    left any join t3 using day
    order by day
    limit 1000
  `, { abortSignal, allowCache: false })

  if (abortSignal.aborted) return
  isLoading.value = false
  statistics.value = mainStatistics.data

  const qualStatisticsRes = await query<{ battleIndex: number, result: 'win' | 'loss' | 'draw' }>(`
    with
      '${nickName}' as PLAYER,
      '${startDate}' - interval OFFSET hour as START_DATE,
      '${endDate}' - interval OFFSET hour as END_DATE,
      '${region}' as REGION,
      ${getRegionIsoHourOffset(region)} as OFFSET
    select comp7.qualBattleIndex as battleIndex, result
    from Event_OnBattleResult
    where playerName = PLAYER
      and dateTime >= START_DATE and dateTime < END_DATE
      and region = REGION
      and battleMode = 'COMP7'
      and comp7.qualActive = true
    order by battleIndex
  `, { abortSignal, allowCache: false })
  if (abortSignal.aborted) return
  if (soft) qualificationStatsVersion -= 1
  qualificationStatistics.value = qualStatisticsRes.data


  const vehicleStatisticsRes = await query<VehicleRes>(`
    with
      '${nickName}' as PLAYER,
      '${startDate}' - interval OFFSET hour as START_DATE,
      '${endDate}' - interval OFFSET hour as END_DATE,
      '${region}' as REGION,
      ${getRegionIsoHourOffset(region)} as OFFSET
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
      and dateTime >= START_DATE and dateTime < END_DATE
      and region = REGION
      and battleMode = 'COMP7'
    group by day, tankTag, tankType, tankLevel
    order by day, tankTag
  `, { abortSignal, allowCache: false })
  if (abortSignal.aborted) return
  vehicleStatistics.value = vehicleStatisticsRes.data


  const mapsStatisticsRes = await query<MapsRes>(`
    with
      '${nickName}' as PLAYER,
      '${startDate}' - interval OFFSET hour as START_DATE,
      '${endDate}' - interval OFFSET hour as END_DATE,
      '${region}' as REGION,
      ${getRegionIsoHourOffset(region)} as OFFSET
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
      and dateTime >= START_DATE and dateTime < END_DATE
      and region = REGION
      and battleMode = 'COMP7'
    group by day, arenaTag
    order by day, arenaTag
  `, { abortSignal, allowCache: false })
  if (abortSignal.aborted) return
  mapsStatistics.value = mapsStatisticsRes.data


  const battleHistoryRes = await query<BattleRes>(`
  with
      '${nickName}' as PLAYER,
      '${startDate}' - interval OFFSET hour as START_DATE,
      '${endDate}' - interval OFFSET hour as END_DATE,
      '${region}' as REGION,
      ${getRegionIsoHourOffset(region)} as OFFSET
    select toStartOfDay(dateTime + interval OFFSET hour) as day, dateTime,
      result, arenaTag as arena, team, 
      comp7.ratingDelta as ratingDelta, comp7.qualBattleIndex as qualBattleIndex,
      tankTag, tankLevel, tankType,
      personal.damageDealt as damage,
      personal.damageAssistedRadio + personal.damageAssistedTrack + personal.damageAssistedStun as assist,
      personal.kills as kills,
      personal.comp7PrestigePoints as prestigePoints
    from Event_OnBattleResult
    where playerName = PLAYER 
      and dateTime >= START_DATE and dateTime < END_DATE
      and region = REGION
      and battleMode = 'COMP7'
    order by onBattleStartId;
  `, { abortSignal, allowCache: false })
  if (abortSignal.aborted) return
  battleHistoryStatistics.value = battleHistoryRes.data

}

watch([seasonInterval, nickname, selectedRegion], () => {
  statistics.value = null
  vehicleStatistics.value = null
  mapsStatistics.value = null
  qualificationStatistics.value = null
  battleHistoryStatistics.value = null
  isLoading.value = false
})


let loadingAbortController = new AbortController()

watch([seasonInterval, debouncedNickname, selectedRegion], () => {
  loadingAbortController.abort()
  loadingAbortController = new AbortController()
  load(loadingAbortController.signal)
})

const liveBattleResults = useAnalyticsRealtime(
  () => `battleResult?battleMode=COMP7&region=${selectedRegion.value}&playerName=${debouncedNickname.value}`,
  [] as ChannelsTypes['battleResult'],
  d => {
    if (d.length === 0) return
    if (!seasonTimeInterval.value) return
    if (Date.now() >= seasonTimeInterval.value.end || Date.now() < seasonTimeInterval.value.start) return

    loadingAbortController.abort()
    loadingAbortController = new AbortController()
    load(loadingAbortController.signal, true)
  }
)

useAnalyticsRealtime(
  () => `comp7Info?region=${selectedRegion.value}&playerName=${debouncedNickname.value}`,
  [] as ChannelsTypes['comp7Info'],
  d => {
    console.log(d)

    const lastInfo = d.length > 0 ? d[d.length - 1] : null
    if (!lastInfo) return
    if (!seasonTimeInterval.value) return
    if (Date.now() >= seasonTimeInterval.value.end || Date.now() < seasonTimeInterval.value.start) return
    if (lastInfo.rating == 0) return

    if (days.value[0].rating == lastInfo.rating) return


    loadingAbortController.abort()
    loadingAbortController = new AbortController()
    load(loadingAbortController.signal, true)
  }
)

const showLiveBadge = refDebounced(computed(() => {
  if (liveBattleResults.status.value != 'OPEN') return false
  if (!seasonTimeInterval.value) return false
  if (!debouncedNickname.value) return false
  const now = Date.now()
  return now >= seasonTimeInterval.value.start && now < seasonTimeInterval.value.end
}), 500)

const days = computed(() => {
  if (!seasonInterval.value) return []
  const stat = statistics.value ?? []

  const statByDay = new Map(stat?.map(s => [s.day, s]) ?? [])
  const maxRating = Math.max(...stat.map(s => s.maxRating[0]), 0)
  const startRating = stat.find(s => s.firstRating[1] != null)?.firstRating[0] ?? 0
  const game = regionToGame(selectedRegion.value)
  const maxEnergyLimit = getMaxEnergyLimit(game)

  const result = []
  let lastRating = 0
  let lastRank: RankTag | null = null
  let firstDayPlayed = -1
  let lastQualBattleIndex = -1
  let energy = 0
  let maxRank: Rank = 'qual'

  const seasonQualificationCount = getSeasonQualificationCount(selectedSeason.value ?? 'latest', gameToRegion(game))
  const isoHourOffset = getRegionIsoHourOffset(gameToRegion(game))

  for (let i = 0; i < seasonInterval.value.length; i++) {
    const isoDate = new Date(seasonInterval.value.start.getTime() + i * ONE_DAY).toISOString()
    const dbDate = `${isoDate.slice(0, 10)} ${isoDate.slice(11, 19)}`
    const stat = statByDay.get(dbDate)
    const previousRank = lastRank
    const hasSnapshot = (stat?.ratingSnapshots ?? 0) > 0
    const isFuture = seasonInterval.value.start.getTime() + i * ONE_DAY > Date.now() + isoHourOffset * ONE_HOUR

    if (stat && hasSnapshot) {
      lastRating = stat.lastRating
      lastRank = stat.lastRank
    }
    if (stat?.totalBattles && firstDayPlayed === -1) firstDayPlayed = i
    if (stat?.qualificationBattles) lastQualBattleIndex = Math.max(lastQualBattleIndex, stat.maxQualBattleIndex)

    const beforeTag = stat?.firstRating[1] ?? previousRank ?? lastRank
    const dayRanks = stat?.ranks.map(getRankFromTag) ?? []
    const rankAfterBattle: Rank = dayRanks.reduce<Rank>((highest, rank) => compareRanks(highest, rank) >= 0 ? highest : rank,
      lastRank ? getRankFromTag(lastRank) : maxRank)
    const energyDelta = beforeTag
      ? getEnergyPerBattle(maxRank, getRankFromTag(beforeTag), rankAfterBattle, game) * (stat?.totalBattles ?? 0)
      : 0
    if (compareRanks(rankAfterBattle, maxRank) > 0) maxRank = rankAfterBattle
    energy = Math.min(maxEnergyLimit, energy + energyDelta)

    if (!stat?.totalBattles && !isFuture && firstDayPlayed !== -1) {
      if (energy > 0) energy -= 1
      else if (!hasSnapshot && lastRank) {
        lastRating = Math.max(0, lastRating - getRatingInactiveDecreasePerDay(getRankFromTag(lastRank), game))
      }
    }

    const timeline: DayChartData['timeline'] = isFuture ? 'future' : firstDayPlayed === -1 ? 'past' : stat?.totalBattles ? 'played' : 'active'
    const ratingPercent = (() => {
      if (lastRank === 'qual' && lastQualBattleIndex !== -1) {
        const qualBattleNumber = lastQualBattleIndex + 1
        if (startRating > 0 && maxRating > 0) return (startRating / maxRating) * (qualBattleNumber / seasonQualificationCount)
        return qualBattleNumber / seasonQualificationCount
      }
      if (maxRating > 0) return lastRating / maxRating
      return 0
    })()

    result.push({
      dayIndex: i,
      day: dbDate,
      rating: lastRating,
      rank: lastRank,
      maxRating,
      ratingPercent: timeline === 'future' && firstDayPlayed === -1 ? 0 : ratingPercent,
      timeline,
      stat,
      energyDelta
    })
  }

  return result
})

const barsData = computed<DayChartData[]>(() => days.value.map(d => ({
  relativeRating: d.ratingPercent,
  timeline: d.timeline,
  rank: d.rank ? getRankFromTag(d.rank) : null,
  divisionLetter: d.rank ? getDivisionLetterFromTag(d.rank) : '?',
  leaderboardPosition: d.stat?.lastLeaderboardPosition ?? null,
  dayIndex: d.dayIndex,
})))

const selectedDay = computed(() => {
  if (selectedDayIndex.value == null) return null
  return days.value.find(d => d.dayIndex === selectedDayIndex.value)?.day ?? null
})

const mainStats = refDebounced(useMainStat(days, game, selectedSeason, selectedDayIndex), 1)
const vehicleStats = refDebounced(useVehicleTable(computed(() => vehicleStatistics.value ?? []), selectedDay), 1)
const mapsStats = refDebounced(useMapsTable(computed(() => mapsStatistics.value ?? []), selectedDay), 1)
const battlesStats = refDebounced(useBattleResultTable(computed(() => battleHistoryStatistics.value ?? []), selectedDay), 1)

let qualificationStatsVersion = 0
const qualificationStats = refDebounced(computedWithControl(qualificationStatistics, () => {
  const firstPlayedDay = statistics.value?.find(d => d.firstRating[1] != null)

  return {
    battles: qualificationStatistics.value ?? [],
    rating: firstPlayedDay?.firstRating[0] ?? null,
    rank: firstPlayedDay?.firstRating[1] ?? null,
    version: `${qualificationStatsVersion++}`
  }
}), 1)

const currentRating = computed(() => {
  const latest = statistics.value?.findLast(day => day.ratingSnapshots > 0)
  const leaderboard = leaderboardStatistics.value.data
  return {
    rating: latest?.lastRating ?? null,
    rank: latest?.lastRank ?? null,
    legendThresholds: { C: leaderboard.legendC, B: leaderboard.legendB, A: leaderboard.legendA },
    qualIndex: Math.max(...days.value.map(d => d.stat?.qualificationBattles ? d.stat.maxQualBattleIndex : -1), -1),
    top1: leaderboard.top1,
    top10: leaderboard.top10,
    top100: leaderboard.top100,
  }
})

watch(selectedDayIndex, (dayIndex) => {
  if (navigator.maxTouchPoints > 0) return
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

  .live-line {
    display: flex;
    flex-direction: row-reverse;
    margin-top: 5px;
    height: 18px;
    margin-bottom: -25px;
  }

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

  .player-not-found {
    margin-top: 20px;
    background: rgba(255, 255, 255, 0.03);
    padding: 20px;
    border-radius: 8px;
    position: relative;
    overflow: hidden;

    a {
      color: var(--blue-thin-color);

      &:hover {
        color: var(--blue-color);
      }
    }

    &::after {
      content: '';
      display: block;
      width: 6px;
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      background: rgb(255, 56, 60);
    }
  }

  .vehicle-statistics {
    margin-top: 45px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s, filter 0.15s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  filter: blur(3px);
}
</style>
