<template>
  <h1>Статистика Натиска</h1>

  <div class="onslaught-page">
    <Settings v-model:season="selectedSeason" v-model:nickname="nickname" v-model:region="selectedRegion"
      v-model:seasons="seasons" :showNameInput="true" />
    <div class="live-line">
      <Live v-if="showLiveBadge" />
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
import { computed, ref, shallowRef, watch } from 'vue'
import DayChart from './dayChart/DayChart.vue'
import { dateToDbDate, query, queryComputedFirst } from '@/db'
import { gameToRegion, regionToGame } from '@/shared/game/wot'
import Settings from '../shared/settings/Settings.vue'
import { computedWithControl, controlledComputed, onKeyStroke, refDebounced, useElementBounding } from '@vueuse/core'
import { DayChartData } from './types'
import MainStat from './mainStat/MainStat.vue'
import {
  compareRanks, getDivisionLetterByRating, getEnergyPerBattle, getMaxEnergyLimit,
  getRankByRating, getRatingInactiveDecreasePerDay, getRegionIsoHourOffset, getSeasonQualificationCount, Rank
} from '@/shared/game/comp7/utils'
import { useMainStat, type StatisticRes } from './mainStat/useMainStat'
import VehicleTable from './vehicleTable/VehicleTable.vue'
import { watchWithAbortSignal } from '@/shared/utils/core'
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
import { useMeta } from '@/shared/composition/useMeta'
import { BattleRes, useBattleResultTable } from './battleHistoryTable/useBattleHistory'
import { ChannelsTypes, useAnalyticsRealtime } from '@/shared/external/realtime/useAnalyticsRealtime'
import Live from './components/Live.vue'

useMeta({
  title: 'Статистика Натиска - WotStat',
  description: 'Персональная статистика по режиму Натиск: динамика рейтинга, эффективность техники, результаты на картах и многое другое.',
  keywords: 'натиск, статистика, рейтинг, техника, карты, WotStat',
})

const ONE_HOUR = 60 * 60 * 1000
const ONE_DAY = 24 * ONE_HOUR

const dayChangeTipBubble = ref<InstanceType<typeof TipKeyboardChangeDay> | null>(null)
const daySelectTipBubble = ref<InstanceType<typeof TipSelectDay> | null>(null)
const dayChart = ref<HTMLElement | null>(null)

const selectedDayIndex = ref<number | null>(null)
const selectedSeason = ref<string | null>(null)
const seasons = ref<{ region: string, season: string, start: string, end: string }[]>([])
const selectedRegion = ref<'RU' | 'EU' | 'NA' | 'ASIA' | 'CT'>('RU')
const nickname = ref<string>('')
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

const statistics = shallowRef<StatisticRes[] | null>(null)
const vehicleStatistics = shallowRef<VehicleRes[] | null>(null)
const mapsStatistics = shallowRef<MapsRes[] | null>(null)
const battleHistoryStatistics = shallowRef<BattleRes[] | null>(null)
const qualificationStatistics = shallowRef<{ battleIndex: number, result: 'win' | 'loss' | 'draw' }[] | null>(null)

const eliteRatingStatistics = queryComputedFirst<{ top1: number, eliteThreshold: number, top10: number, top100: number }>(() => `
  with
    '${selectedRegion.value}' as REGION,
    '${seasonInterval.value ? dateToDbDate(seasonInterval.value.start) : '2000-01-01'}' as START_DATE,
    '${seasonInterval.value ? dateToDbDate(seasonInterval.value.end) : '2000-01-01'}' as END_DATE,
    (select max(recalculationTime) from Comp7LeaderboardByRank where region = REGION and recalculationTime between START_DATE and END_DATE + interval 1 day) as latestTime
  select max(rating) as top1, min(rating) as eliteThreshold, anyIf(rating, rank=10) as top10, anyIf(rating, rank=100) as top100
  from Comp7LeaderboardByRank
  where region = REGION and recalculationTime = latestTime and elite = true;
`, { top1: 0, eliteThreshold: 0, top10: 0, top100: 0 })

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
        '${startDate}' as START_DATE,
        '${endDate}' as END_DATE,
        '${region}' as REGION,
        ${getRegionIsoHourOffset(region)} as OFFSET,
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
              and dateTime between START_DATE and END_DATE
              and battleMode = 'COMP7'
            group by day
            order by day
        ),
        t4 as (
          with prepare as (
            select recalculationTime,
                   minIf(rating, elite = true) as eliteThreshold,
                   anyIf(rank, name = PLAYER) as rank,
                   anyIf(rating, name = PLAYER) as playerRating
            from Comp7Leaderboard
            where region = REGION
            group by recalculationTime
        )
        select toStartOfDay(recalculationTime + interval OFFSET hour) as day,
               argMax(eliteThreshold, recalculationTime) as lastEliteThreshold,
               argMax(rank, recalculationTime) as lastPlayerRank,
               argMax(playerRating, recalculationTime) as lastPlayerRating,
               max(rank) as maxPlayerRank,
               min(rank) as minPlayerRank
        from prepare
        group by day
    )
    select * from t0
    left outer join t1 using day
    left outer join t2 using day
    left outer join t3 using day
    left outer join t4 using day
  `, { abortSignal, allowCache: false })

  if (abortSignal.aborted) return
  isLoading.value = false
  statistics.value = mainStatistics.data

  const qualStatisticsRes = await query<{ battleIndex: number, result: 'win' | 'loss' | 'draw' }>(`
    with
      '${nickName}' as PLAYER,
      '${startDate}' as START_DATE,
      '${endDate}' as END_DATE,
      '${region}' as REGION,
      ${getRegionIsoHourOffset(region)} as OFFSET
    select comp7.qualBattleIndex as battleIndex, result
    from Event_OnBattleResult
    where playerName = PLAYER
      and dateTime between START_DATE and END_DATE
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
      '${startDate}' as START_DATE,
      '${endDate}' as END_DATE,
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
      and dateTime between START_DATE and END_DATE
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
      '${startDate}' as START_DATE,
      '${endDate}' as END_DATE,
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
      and dateTime between START_DATE and END_DATE
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
      '${startDate}' as START_DATE,
      '${endDate}' as END_DATE,
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
      and dateTime between START_DATE and END_DATE
      and region = REGION
      and battleMode = 'COMP7'
    order by dateTime;
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

watchWithAbortSignal([seasonInterval, debouncedNickname, selectedRegion], signal => load(signal))

const liveBattleResults = useAnalyticsRealtime(
  () => `battleResult?battleMode=COMP7&region=${selectedRegion.value}&playerName=${debouncedNickname.value}`,
  [] as ChannelsTypes['battleResult'],
  d => {
    if (d.length === 0) return
    if (!seasonInterval.value) return
    if (Date.now() > seasonInterval.value.end.getTime() || Date.now() < seasonInterval.value.start.getTime()) return
    load(new AbortController().signal, true)
  }
)

const showLiveBadge = computed(() => {
  if (liveBattleResults.status.value != 'OPEN') return false
  if (!seasonInterval.value) return false
  const now = Date.now()
  return now >= seasonInterval.value.start.getTime() && now <= seasonInterval.value.end.getTime()
})

const days = computed(() => {
  if (!seasonInterval.value) return []
  const stat = statistics.value ?? []

  const statByDay = new Map(stat?.map(s => [s.day, s]) ?? [])
  const maxRating = Math.max(...stat?.map(s => s.lastPlayerRating || s.lastRating) ?? [0], 0)
  const startRating = stat.find(s => s.totalBattles > 0 && s.firstRating[0] != 0)?.firstRating[0] ?? 0
  const game = regionToGame(selectedRegion.value)
  const maxEnergyLimit = getMaxEnergyLimit(game)

  const result = []
  let lastRating = 0
  let firstDayPlayed = -1
  let eliteRating = -1
  let lastQualBattleIndex = -1
  let energy = 0
  let maxRank = 'qual' as Rank

  const seasonQualificationCount = getSeasonQualificationCount(selectedSeason.value ?? 'latest', gameToRegion(game))
  const isoHourOffset = getRegionIsoHourOffset(gameToRegion(game))

  for (let i = 0; i < seasonInterval.value.length; i++) {
    const isoDate = new Date(seasonInterval.value.start.getTime() + i * ONE_DAY).toISOString()
    const dbDate = `${isoDate.slice(0, 10)} ${isoDate.slice(11, 19)}`

    const stat = statByDay.get(dbDate)
    if (stat?.lastRating) lastRating = stat.lastRating
    if (stat?.totalBattles && firstDayPlayed == -1) firstDayPlayed = i
    if (stat?.lastEliteRating) eliteRating = stat.lastEliteRating
    if (stat?.maxQualBattleIndex != undefined && stat.qualificationBattles) lastQualBattleIndex = Math.max(lastQualBattleIndex, stat.maxQualBattleIndex)

    const rankBeforeBattle = getRankByRating(stat?.firstRating[0] ?? lastRating, game, stat?.firstRating[1] || undefined)
    const rankAfterBattle = getRankByRating(stat?.maxRating[0] ?? lastRating, game, stat?.maxRating[1] || undefined)

    const energyDelta = getEnergyPerBattle(maxRank, rankBeforeBattle, rankAfterBattle, game) * (stat?.totalBattles ?? 0)
    maxRank = compareRanks(maxRank, rankAfterBattle) > 0 ? maxRank : rankAfterBattle
    energy = Math.min(maxEnergyLimit, energy + energyDelta)

    if (stat?.totalBattles === 0) {
      if (energy > 0) energy -= 1
      else lastRating -= getRatingInactiveDecreasePerDay(getRankByRating(lastRating, game, eliteRating > 0 ? eliteRating : undefined), game)
    }

    const isFuture = seasonInterval.value.start.getTime() + i * ONE_DAY > Date.now() + isoHourOffset * ONE_HOUR
    const timeline: DayChartData['timeline'] = isFuture ? 'future' : firstDayPlayed == -1 ? 'past' : stat?.totalBattles ? 'played' : 'active'

    const ratingPercent = (() => {
      if (lastRating == 0 && lastQualBattleIndex !== -1) {
        const qualBattleNumber = lastQualBattleIndex + 1
        if (startRating > 0) return (startRating / maxRating) * (qualBattleNumber / seasonQualificationCount)
        else return qualBattleNumber / seasonQualificationCount
      }
      if (maxRating > 0) return lastRating / maxRating
      return 0
    })()

    result.push({
      dayIndex: i,
      day: dbDate,
      rating: lastRating,
      eliteRating,
      maxRating,
      ratingPercent: timeline == 'future' && firstDayPlayed == -1 ? 0 : ratingPercent,
      timeline,
      stat: stat,
      energyDelta
    })
  }

  return result
})

const barsData = computed<DayChartData[]>(() => days.value.map(d => ({
  relativeRating: d.ratingPercent,
  timeline: d.timeline,
  rank: getRankByRating(d.rating, game.value, d.eliteRating > 0 ? d.eliteRating : undefined),
  divisionLetter: getDivisionLetterByRating(d.rating, game.value),
  leaderboardPosition: d.stat?.lastPlayerRank || d.stat?.lastLeaderboardPosition || null,
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
  const firstPlayedDay = statistics.value?.find(d => d.totalBattles > 0 && d.firstRating[0] != 0)

  return {
    battles: qualificationStatistics.value ?? [],
    rating: firstPlayedDay ? firstPlayedDay.firstRating[0] : 0,
    version: `${qualificationStatsVersion++}`
  }
}), 1)

const currentRating = computed(() => ({
  rating: days.value.at(-1)?.rating ?? null,
  eliteRating: eliteRatingStatistics.value.data.eliteThreshold,
  qualIndex: Math.max(...days.value.map(d => d.stat?.qualificationBattles ? d.stat.maxQualBattleIndex : -1), -1),
  top1: eliteRatingStatistics.value.data.top1,
  top10: eliteRatingStatistics.value.data.top10,
  top100: eliteRatingStatistics.value.data.top100,
}))

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
h1 {
  margin-top: 0;
}

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