<template>
  <h1>Общая статистика Натиска</h1>

  <div class="onslaught-page">
    <Settings v-model:season="selectedSeason" v-model:region="selectedRegion" v-model:seasons="seasons" />

    <section class="rank-distribution">
      <div class="header">
        <h3>Распределение игроков по рангам</h3>
      </div>
      <hr class="separator">

      <RankDistributionChart class="rank-distribution-chart" :data="rankDistributionData"
        :game="regionToGame(selectedRegion)" :season="selectedSeason ?? undefined"
        v-model:selected="selectedRankDistributionItems" />
    </section>

    <template v-if="seasonInterval">
      <div class="day-selector-row">
        <DaySelector v-model="selectedDays" v-model:is-open="isDaySelectorOpen" :season-interval="seasonInterval"
          selection-mode="arbitrary" :region="selectedRegion" caption="Дни" />
        <TipSelectDays ref="daySelectorTip" />
      </div>
      <GlobalVehicleTable v-model:group-by-skill="groupBySkill" :state="vehicleState"
        :game="regionToGame(selectedRegion)" :season="selectedSeason ?? undefined"
        :allow-skill-toggle="supportsSkillChange" />
      <GlobalMapsTable :state="arenaState" :game="regionToGame(selectedRegion)" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, useTemplateRef, watch } from 'vue'
import Settings from '../shared/settings/Settings.vue'
import RankDistributionChart from './rankDistribution/RankDistributionChart.vue'
import type { RankDistributionItem } from './rankDistribution/types'
import { useSeasonInterval } from '../shared/useSeasonInterval.ts'
import { dateToDbDate, LONG_CACHE_SETTINGS, query } from '@/db/index.ts'
import { DivisionLetter, getRatingForDivision, isComp7SkillChangeSupported, Rank } from '@/shared/game/comp7/utils.ts'
import { regionToGame } from '@/shared/game/wot.ts'
import { LEADERBOARD_STEP, processDistribution } from './rankDistribution/processDistribution.ts'
import { useStableScrollbarGutter } from '@/shared/composition/useStableScrollbarGutter.ts'
import DaySelector from '../shared/daySelector/DaySelector.vue'
import GlobalVehicleTable from './globalStatistics/GlobalVehicleTable.vue'
import GlobalMapsTable from './globalStatistics/GlobalMapsTable.vue'
import {
  buildGlobalArenaStatisticsQuery,
  buildGlobalVehicleStatisticsQuery,
  type GlobalStatisticsFilters,
} from './globalStatistics/queries.ts'
import type {
  GlobalArenaStatistic,
  GlobalVehicleStatistic,
  StatisticsLoadState,
} from './globalStatistics/types.ts'
import TipSelectDays from './tips/TipSelectDays.vue'

useStableScrollbarGutter()

const seasons = ref<{ region: string, season: string, start: string }[]>([])
const selectedSeason = ref<string | null>(null)
const selectedRegion = ref<'RU' | 'EU' | 'NA' | 'ASIA' | 'CN' | 'CT'>('RU')
const selectedRankDistributionItems = ref<RankDistributionItem[]>([])
const selectedDays = ref<string[]>([])
const isDaySelectorOpen = ref(false)
const groupBySkill = ref(false)
const supportsSkillChange = computed(() => selectedSeason.value !== null
  && isComp7SkillChangeSupported(selectedRegion.value, selectedSeason.value)
)
const seasonInterval = useSeasonInterval(seasons, selectedSeason, selectedRegion)
const daySelectorTip = useTemplateRef<InstanceType<typeof TipSelectDays>>('daySelectorTip')

const vehicleState = shallowRef<StatisticsLoadState<GlobalVehicleStatistic>>({ status: 'loading', data: [] })
const arenaState = shallowRef<StatisticsLoadState<GlobalArenaStatistic>>({ status: 'loading', data: [] })

const leaderboardPlaceholders: RankDistributionItem[] = [
  ...Array.from({ length: 10 }, (_, name) => ({
    rank: 'fifth' as const,
    name,
    label: '',
    value: 0,
  })),
  ...Array.from({ length: 4 }, (_, name) => ({
    rank: 'sixth' as const,
    name,
    label: '',
    value: 0,
  })),
]

const rankDistributionData = shallowRef<RankDistributionItem[]>(leaderboardPlaceholders)

watch([selectedRegion, selectedSeason], () => {
  selectedRankDistributionItems.value = []
  selectedDays.value = []
}, { flush: 'sync' })

watch(supportsSkillChange, isSupported => {
  groupBySkill.value = !isSupported
}, { immediate: true, flush: 'sync' })

watch(isDaySelectorOpen, isOpen => {
  if (isOpen) daySelectorTip.value?.accept()
})

async function load(abortSignal: AbortSignal, soft = false) {
  if (!seasonInterval.value) return
  const startDate = dateToDbDate(seasonInterval.value.start)
  const endDate = dateToDbDate(seasonInterval.value.end)
  const region = selectedRegion.value

  const startFifth = getRatingForDivision('fifth', regionToGame(region))

  const rankDistribution = await query<{
    rank: Exclude<Rank, 'qual'>,
    division: DivisionLetter | number,
    players: number
  }>(`
    with
      '${startDate}' - interval 1 day as START_DATE,
      '${endDate}' + interval 1 day  as END_DATE,
      '${region}' as REGION,

      ${startFifth} as START_FIFTH,
      ${LEADERBOARD_STEP} as LEADERBOARD_STEP,

      (
          select max(lastRecalculationTime) from Comp7LeaderboardDaily
          where region = REGION and day between START_DATE and END_DATE
      ) as LAST_COMP7_RECALCULATEION_TIME,

      leaderboardData as (
          select if(elite, 'sixth', 'fifth') as rank,
                START_FIFTH + (intDiv(rating - START_FIFTH, LEADERBOARD_STEP) * LEADERBOARD_STEP) as division,
                count() as players
          from Comp7LeaderboardByRank
          where
              region = REGION and
              recalculationTime = LAST_COMP7_RECALCULATEION_TIME
          group by division, rank
      ),

      playersRating as (
          select argMaxMerge(rankLast) as lastRank
          from Comp7LatestVisiblePlayersRating
          where region = REGION and day between START_DATE and END_DATE
          group by playerId
          having lastRank NOT IN ('', 'qual', 'fifth', 'sixth')
      ),
      playersData as (
          select splitByChar('_', lastRank)[1] as rank,
                splitByChar('_', lastRank)[2] as division,
                count() as players
          from playersRating
          group by lastRank
      )
    select * from playersData
    union all
    select * from leaderboardData
    `, { abortSignal, settings: LONG_CACHE_SETTINGS })


  if (abortSignal.aborted) return

  rankDistributionData.value = processDistribution(rankDistribution.data, startFifth)
}

let loadingAbortController = new AbortController()
watch([seasonInterval, selectedRegion], () => {
  loadingAbortController.abort()
  loadingAbortController = new AbortController()
  load(loadingAbortController.signal)
})

const statisticsFilters = computed<GlobalStatisticsFilters | null>(() => {
  if (!seasonInterval.value) return null

  return {
    region: selectedRegion.value,
    startDate: dateToDbDate(seasonInterval.value.start),
    endDate: dateToDbDate(seasonInterval.value.end),
    days: selectedDays.value,
    ranks: selectedRankDistributionItems.value,
  }
})

const vehicleQuery = computed(() => statisticsFilters.value
  ? buildGlobalVehicleStatisticsQuery(statisticsFilters.value, groupBySkill.value && supportsSkillChange.value)
  : null
)
const arenaQuery = computed(() => statisticsFilters.value
  ? buildGlobalArenaStatisticsQuery(statisticsFilters.value)
  : null
)

let commonRequestId = 0
let vehicleRequestId = 0
let vehicleAbortController = new AbortController()
let arenaAbortController = new AbortController()
let currentVehicleLoad: Promise<void> = Promise.resolve()

function reasonMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : String(reason)
}

function reloadVehicle(sql: string) {
  vehicleAbortController.abort()
  vehicleAbortController = new AbortController()
  const signal = vehicleAbortController.signal
  const requestId = ++vehicleRequestId

  vehicleState.value = { status: 'loading', data: [] }

  const loadPromise = (async () => {
    try {
      const response = await query<GlobalVehicleStatistic>(sql, {
        abortSignal: signal,
        allowCache: false,
        settings: LONG_CACHE_SETTINGS,
      })
      if (signal.aborted || requestId !== vehicleRequestId) return

      vehicleState.value = {
        status: response.data.length > 0 ? 'success' : 'empty',
        data: response.data,
      }
    } catch (reason) {
      if (signal.aborted || requestId !== vehicleRequestId) return
      console.error(reason)
      vehicleState.value = { status: 'error', data: [], reason: reasonMessage(reason) }
    }
  })()

  currentVehicleLoad = loadPromise
  return loadPromise
}

async function reloadArena(sql: string, commonId: number) {
  arenaAbortController.abort()
  arenaAbortController = new AbortController()
  const signal = arenaAbortController.signal

  try {
    const response = await query<GlobalArenaStatistic>(sql, {
      abortSignal: signal,
      allowCache: false,
      settings: LONG_CACHE_SETTINGS,
    })
    if (signal.aborted || commonId !== commonRequestId) return

    arenaState.value = {
      status: response.data.length > 0 ? 'success' : 'empty',
      data: response.data,
    }
  } catch (reason) {
    if (signal.aborted || commonId !== commonRequestId) return
    console.error(reason)
    arenaState.value = { status: 'error', data: [], reason: reasonMessage(reason) }
  }
}

async function reloadCommon(vehicleSql: string, arenaSql: string) {
  const commonId = ++commonRequestId
  arenaAbortController.abort()
  arenaState.value = { status: 'loading', data: [] }

  let awaitedVehicleLoad = reloadVehicle(vehicleSql)
  await awaitedVehicleLoad

  while (commonId === commonRequestId && awaitedVehicleLoad !== currentVehicleLoad) {
    awaitedVehicleLoad = currentVehicleLoad
    await awaitedVehicleLoad
  }

  if (commonId !== commonRequestId) return
  await reloadArena(arenaSql, commonId)
}

watch(arenaQuery, sql => {
  if (!sql || !vehicleQuery.value) {
    commonRequestId++
    vehicleRequestId++
    vehicleAbortController.abort()
    arenaAbortController.abort()
    vehicleState.value = { status: 'loading', data: [] }
    arenaState.value = { status: 'loading', data: [] }
    return
  }
  reloadCommon(vehicleQuery.value, sql)
}, { immediate: true })

watch(groupBySkill, () => {
  if (!vehicleQuery.value) return
  reloadVehicle(vehicleQuery.value)
})

onBeforeUnmount(() => {
  loadingAbortController.abort()
  vehicleAbortController.abort()
  arenaAbortController.abort()
})

</script>

<style lang="scss" scoped>
h1 {
  margin-top: 0;
}

.onslaught-page {
  margin-top: 1em;
}

.rank-distribution {
  margin-top: 45px;

  .header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;

    h3 {
      margin: 0;
      font-size: 22px;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.87);
    }
  }

  .separator {
    margin: 5px 0;
    border: none;
    border-bottom: 1px solid var(--color-separator, #54545899);
  }

  .rank-distribution-chart {
    margin-right: calc(var(--content-page-margin, 0) * -1);
    margin-left: calc(var(--content-page-margin, 0) * -1);
  }
}

.day-selector-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 35px;
}
</style>
