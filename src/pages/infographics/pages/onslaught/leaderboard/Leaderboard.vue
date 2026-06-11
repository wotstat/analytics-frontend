<template>
  <h1>Таблица Лидеров</h1>

  <div class="onslaught-leaderboard-page">

    <Settings v-model:season="selectedSeason" v-model:nickname="nickname" v-model:region="region"
      v-model:seasons="seasons" />

    <div class="info">
      <PageSelector :start="1" :end="endPage" v-model="page" class="page-selector"
        v-if="leaderboardDay && endPage > 1" />
      <div class="page-selector" v-else></div>

      <div class="last-recalculation">
        <p v-if="updatedAt">Обновлено: {{ updatedAt }}</p>
        <Live :region="region" :seasonInterval="seasonInterval" :leaderboardDay="leaderboardDay"
          @mayUpdate="loadLatestData" />
      </div>
    </div>

    <Loader :isLoading="isLoading" class="leaderboard-loader" :predictedLoadingTime="100" />

    <table v-if="leaderboardData.length">

      <thead>
        <tr>
          <th>№</th>
          <th>Игрок</th>
          <th class="battles-today-col">Бои за день</th>
          <th class="battles-total-multi">Бои всего</th>
          <th class="battles-total-single">Бои</th>
          <th>Очки</th>
        </tr>
      </thead>

      <tbody>
        <template v-for="line in leaderboardData">
          <LeaderboardLine :line="line" :region="region" @click="click(line.name)" :class="{
            'selected': selectedName == line.name && false,
          }" />

          <tr v-if="selectedName == line.name && false" class="details">
            <td colspan="6">
              <Detail />
            </td>
          </tr>

          <tr v-if="line.lastRank == leaderboardDay?.lastEliteRank" class="elite-separator">
            <td colspan="6">
              <div>
                <RankIcon :rank="'sixth'" :size="'medium'" :season="selectedSeason ?? 'latest'" class="rank" />
                ПОРОГ ЛЕГЕНДЫ
                <RankIcon :rank="'sixth'" :size="'medium'" :season="selectedSeason ?? 'latest'" class="rank" />
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>

  <PageSelector :start="1" :end="endPage" v-model="page" class="page-selector"
    v-if="leaderboardDay && leaderboardData.length > 10" />
</template>


<script setup lang="ts">
import { dateToDbDate, query, queryComputedFirst } from '@/db'
import { computed, ref, watch } from 'vue'
import LeaderboardLine from './components/LeaderboardLine.vue'
import { regionToGame } from '@/shared/game/wot'
import Detail from './components/Detail.vue'
import Loader from '../shared/Loader.vue'

import Settings from '../shared/settings/Settings.vue'
import { refDebounced } from '@vueuse/core'
import { watchWithAbortSignal } from '@/shared/utils/core'
import PageSelector from './components/PageSelector.vue'
import { useSeasonInterval } from '../shared/useSeasonInterval'
import Live from './components/Live.vue'
import RankIcon from '@/shared/game/comp7/rank/RankIcon.vue'


const page = ref(1)
const selectedName = ref<string | null>(null)

const seasons = ref<{ region: string, season: string, start: string, end: string }[]>([])
const selectedSeason = ref<string | null>(null)
const region = ref<'RU' | 'EU' | 'NA' | 'ASIA' | 'CN' | 'CT'>('RU')
const nickname = ref<string>('')
const debouncedNickname = refDebounced(nickname, 500)
const game = computed(() => regionToGame(region.value))

const seasonInterval = useSeasonInterval(seasons, selectedSeason, region)
const leaderboardDay = ref<{ day: string, recalculation: string, lastRank: number, eliteThreshold: number, lastEliteRank: number } | null>(null)
const leaderboardData = ref<LeaderboardData[]>([])
const isLoading = ref(false)

const endPage = computed(() => {
  if (!leaderboardDay.value) return 0
  return Math.ceil(leaderboardDay.value.lastRank / 100)
})

const updatedAt = computed(() => {
  if (!leaderboardDay.value) return null
  const date = new Date(leaderboardDay.value.recalculation + 'Z')

  return date.toLocaleString([], {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(',', '')
})

type LeaderboardData = {
  day: string
  name: string
  bdid: number
  clan: string | null
  clanColor: number
  lastRank: number
  lastDayRank: number
  lastBattlesCount: number
  lastDayBattlesCount: number
  lastRating: number
  lastDayRating: number
}

function loadLatestData() {
  console.log('Loading latest data', region.value, selectedSeason.value)
  load(new AbortController().signal, true)
}

async function load(abortSignal: AbortSignal, latest = false) {
  if (!seasonInterval.value) return

  isLoading.value = true
  if (!leaderboardDay.value || latest) {
    const lastData = await query<{ day: string, recalculation: string, lastRank: number, lastEliteRank: number, eliteThreshold: number }>(`
    with
      '${dateToDbDate(seasonInterval.value.start)}' as START_DATE,
      '${dateToDbDate(seasonInterval.value.end)}' as END_DATE,
    select max(day) as day,
      max(recalculationTime) as recalculation,
      max(rank) as lastRank,
      maxIf(rank, elite) as lastEliteRank,
      maxIf(rank, elite) as eliteThreshold
    from Comp7Leaderboard where region = '${region.value}' and
      recalculationTime between START_DATE and END_DATE + interval 5 day
  `, { allowCache: false })

    if (abortSignal.aborted) return
    if (lastData.data.length == 0) return

    leaderboardDay.value = lastData.data[0]
  }

  const resetTimeout = setTimeout(() => leaderboardData.value = [], 500)
  abortSignal.addEventListener('abort', () => clearTimeout(resetTimeout))

  const data = await query<LeaderboardData>(`
    select day, name, bdid, clan, clanColor, lastRank, lastDayRank, lastBattlesCount, lastDayBattlesCount, lastRating, lastDayRating
    from Comp7LeaderboardDailyByRank final
    where region = '${region.value}' and 
      day = '${leaderboardDay.value.day}' and 
      lastRank between ${(page.value - 1) * 100 + 1} and ${page.value * 100} and
      lastRecalculationTime = '${leaderboardDay.value.recalculation}'
    order by lastRank
  `, { abortSignal, allowCache: false })

  if (abortSignal.aborted) return

  clearTimeout(resetTimeout)
  leaderboardData.value = data.data
  isLoading.value = false
}

watch([selectedSeason, region], () => {
  leaderboardDay.value = null
  leaderboardData.value = []
  page.value = 1
})

watchWithAbortSignal([region, page, selectedSeason, seasonInterval], signal => load(signal), { immediate: true })

function click(name: string) {
  selectedName.value = selectedName.value == name ? null : name
}

</script>


<style lang="scss" scoped>
h1 {
  margin-top: 0;
}

.info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  margin-top: 10px;

  .page-selector {
    margin: 0;
  }

  .last-recalculation {
    display: flex;
    align-items: center;
    margin-left: 20px;
    color: #c8c8c8;
    font-size: 14px;
  }

  @media screen and (max-width: 700px) {
    flex-direction: column;
    align-items: flex-start;

    .last-recalculation {
      margin-left: 0;
      margin-top: 5px;
    }

  }
}

.leaderboard-loader {
  margin: 10px 0;
  height: 2px;
}

.page-selector {
  margin: 20px 0;
  min-height: 22px;
}

table {
  border-collapse: collapse;
  width: 100%;

  thead {
    tr {
      th {
        color: #c8c8c8;
        font-weight: normal;
        padding: 0px 15px;
        padding: 0px 15px;

        &:nth-child(1) {
          width: 85px;
        }

        &:nth-child(2) {
          text-align: left;
        }

        &:nth-child(3),
        &:nth-child(4),
        &:nth-child(5) {
          text-align: center;
          padding: 0px 5px;
          width: 100px;
        }

        &:nth-child(6) {
          width: 150px;
        }
      }
    }

    .battles-total-single {
      display: none;
    }
  }


  tbody {
    tr {
      // position: relative;
      cursor: pointer;
      -ms-touch-action: manipulation;
      touch-action: manipulation;

      &:not(.selected) {
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      &.selected {
        background: rgba(255, 255, 255, 0.03);
      }

      @media (hover: hover) {

        &:hover {
          background: rgba(255, 255, 255, 0.03);
        }
      }

    }


    .details {
      background-color: rgba(255, 255, 255, 0.03);
    }

    .elite-separator {
      background-color: rgba(255, 255, 255, 0.03);

      td {
        cursor: default;

        div {
          margin: 10px 0px;
          width: 100%;
          font-size: 16px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: row;
          color: #ffffffed;
          gap: 10px;

          .rank {
            margin: 0 5px;
            height: 45px;
            user-select: none;
            pointer-events: none;
          }
        }
      }

    }

  }

  @container (max-width: 700px) {
    thead {
      tr {
        th {
          &:nth-child(6) {
            width: 50px;
          }
        }
      }
    }
  }

  @container (max-width: 500px) {

    thead {
      tr {

        .battles-today-col,
        .battles-total-multi {
          display: none;
        }

        .battles-total-single {
          display: table-cell;
        }

        th {

          &:nth-child(1),
          &:nth-child(3),
          &:nth-child(4),
          &:nth-child(5),
          &:nth-child(6) {
            width: 55px;
          }
        }
      }
    }
  }

  @container (max-width: 400px) {

    thead {
      tr {
        .battles-total-single {
          display: none;
        }
      }
    }
  }
}
</style>