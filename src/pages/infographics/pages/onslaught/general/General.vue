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
        v-model:selected="selectedRankDistributionItems" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue'
import Settings from '../shared/settings/Settings.vue'
import RankDistributionChart from './rankDistribution/RankDistributionChart.vue'
import type { RankDistributionItem } from './rankDistribution/types'
import { useSeasonInterval } from '../shared/useSeasonInterval.ts'
import { dateToDbDate, LONG_CACHE_SETTINGS, query } from '@/db/index.ts'
import { DivisionLetter, getRatingForDivision, Rank } from '@/shared/game/comp7/utils.ts'
import { regionToGame } from '@/shared/game/wot.ts'
import { LEADERBOARD_STEP, processDistribution } from './rankDistribution/processDistribution.ts'

const seasons = ref<{ region: string, season: string, start: string }[]>([])
const selectedSeason = ref<string | null>(null)
const selectedRegion = ref<'RU' | 'EU' | 'NA' | 'ASIA' | 'CN' | 'CT'>('RU')
const selectedRankDistributionItems = ref<RankDistributionItem[]>([])
const seasonInterval = useSeasonInterval(seasons, selectedSeason, selectedRegion)

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

async function load(abortSignal: AbortSignal, soft = false) {
  if (!seasonInterval.value) return
  const startDate = dateToDbDate(seasonInterval.value.start)
  const endDate = dateToDbDate(seasonInterval.value.end)
  const region = selectedRegion.value

  const startFifth = getRatingForDivision('fifth', regionToGame(region))

  console.log('Loading data with params', { startDate, endDate, region })

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

  rankDistributionData.value = processDistribution(rankDistribution.data)

  console.log(rankDistribution.data)

}

let loadingAbortController = new AbortController()
watch([seasonInterval, selectedRegion], () => {
  loadingAbortController.abort()
  loadingAbortController = new AbortController()
  load(loadingAbortController.signal)
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
</style>
