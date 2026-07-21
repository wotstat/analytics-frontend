<template>
  <h1>Таблица Лидеров</h1>

  <div class="onslaught-leaderboard-page">

    <Settings v-model:season="selectedSeason" v-model:nickname="nickname" v-model:region="region"
      v-model:seasons="seasons" :showNameInput="true" />

    <div class="search-result-animator" v-if="searchState != 'idle'" :class="{ 'height-animated': animateSearchHeight }"
      :style="{ height: searchResultHeight != null ? `${searchResultHeight}px` : undefined }">
      <div class="search-result" :class="{ 'not-found': searchState == 'notFound' }" ref="searchResultElement">

        <template v-if="searchState == 'found' && searchedPlayer && seasonInterval">
          <table>
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
              <LeaderboardLine :line="searchedPlayer" :region="region" />
              <tr class="details">
                <td colspan="6">
                  <Detail :key="`${searchedPlayer.bdid}-${region}-${selectedSeason}`" :bdid="searchedPlayer.bdid"
                    :region="region" :seasonInterval="seasonInterval" />
                </td>
              </tr>
            </tbody>
          </table>

          <div class="actions">
            <button @click="goToPlayerInTable">Перейти к месту в таблице</button>
          </div>
        </template>

        <div class="skeleton" v-else-if="searchState != 'notFound'">
          <table>
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
              <tr>
                <td colspan="6" class="fake-cell">
                  <div class="fake-line"></div>
                </td>
              </tr>
              <tr class="details">
                <td colspan="6">
                  <div class="fake-charts">
                    <div class="fake-chart">
                      <div class="header"></div>
                      <div class="canvas"></div>
                    </div>
                    <div class="fake-chart">
                      <div class="header"></div>
                      <div class="canvas"></div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="actions">
            <div class="fake-button"></div>
          </div>
        </div>

        <p v-else>Игрок «{{ searchResolvedFor }}» не найден в таблице лидеров</p>
      </div>
    </div>

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
          <LeaderboardLine :line="line" :region="region" :id="`leaderboard-player-${line.bdid}`"
            @click="click(line.name)" @pointerdown="onPointerDown" :class="{
              'selected': selectedName == line.name,
              'searched': searchedPlayer?.bdid == line.bdid,
            }" />

          <tr v-if="selectedName == line.name && seasonInterval" class="details" :class="{
            'searched': searchedPlayer?.bdid == line.bdid,
          }">
            <td colspan="6">
              <Detail :bdid="line.bdid" :region="region" :seasonInterval="seasonInterval"
                v-model:captureClose="captureDetailClose" v-model:selectedInterval="selectedInterval" />
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
import { computed, nextTick, ref, watch, watchEffect, useTemplateRef } from 'vue'
import LeaderboardLine from './components/LeaderboardLine.vue'
import { regionToGame } from '@/shared/game/wot'
import Detail from './components/detail/Detail.vue'
import Loader from '../shared/Loader.vue'

import Settings from '../shared/settings/Settings.vue'
import { refDebounced, useResizeObserver } from '@vueuse/core'
import { watchWithAbortSignal } from '@/shared/utils/core'
import PageSelector from './components/PageSelector.vue'
import { useSeasonInterval } from '../shared/useSeasonInterval'
import Live from './components/Live.vue'
import RankIcon from '@/shared/game/comp7/rank/RankIcon.vue'
import { useMeta } from '@/shared/composition/useMeta'
import type { SelectedInterval } from './components/detail/types.ts'
import { useStableScrollbarGutter } from '@/shared/composition/useStableScrollbarGutter.ts'

useMeta({
  title: 'Таблица лидеров Натиска - WotStat',
  description: 'Таблица лидеров по рейтингу в режиме Натиск Мир Танков и World of Tanks. Рейтинг, количество боёв и динамика за день для каждого игрока.',
  keywords: 'Натиск, таблица лидеров, рейтинг, бои, динамика, Мир Танков, World of Tanks',
})
useStableScrollbarGutter()

const page = ref(1)
const selectedName = ref<string | null>(null)

const seasons = ref<{ region: string, season: string, start: string }[]>([])
const selectedSeason = ref<string | null>(null)
const region = ref<'RU' | 'EU' | 'NA' | 'ASIA' | 'CN' | 'CT'>('RU')
const nickname = ref<string>('')
const debouncedNickname = refDebounced(nickname, 500)

const seasonInterval = useSeasonInterval(seasons, selectedSeason, region)
const leaderboardDay = ref<{ day: string, recalculation: string, lastRank: number, eliteThreshold: number, lastEliteRank: number } | null>(null)
const leaderboardData = ref<LeaderboardData[]>([])
const isLoading = ref(false)

const selectedInterval = ref<SelectedInterval | null>(null)

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
      (
        select max(recalculationTime)
        from Comp7Leaderboard
        where region = '${region.value}' and 
        recalculationTime between START_DATE and END_DATE + interval 5 day
      ) as LAST_RECALCULATION
    select max(day) as day,
      max(recalculationTime) as recalculation,
      max(rank) as lastRank,
      maxIf(rank, elite) as lastEliteRank,
      maxIf(rank, elite) as eliteThreshold
    from Comp7Leaderboard where region = '${region.value}' and
      recalculationTime between START_DATE and END_DATE + interval 5 day and
      recalculationTime = LAST_RECALCULATION
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
  selectedInterval.value = null
  page.value = 1
})

watchWithAbortSignal([region, page, selectedSeason, seasonInterval], signal => load(signal), { immediate: true })

const searchedPlayer = ref<LeaderboardData | null>(null)
const searchResolvedFor = ref<string | null>(null)

const searchState = computed<'idle' | 'loading' | 'found' | 'notFound'>(() => {
  const name = nickname.value.trim()
  if (!name) return 'idle'
  if (searchResolvedFor.value != name) return 'loading'
  return searchedPlayer.value ? 'found' : 'notFound'
})

async function searchPlayer(abortSignal: AbortSignal) {
  const name = debouncedNickname.value.trim()
  if (!name || !leaderboardDay.value) {
    searchedPlayer.value = null
    searchResolvedFor.value = null
    return
  }

  const escapedName = name.replaceAll('\\', '\\\\').replaceAll('\'', '\\\'')
  const data = await query<LeaderboardData>(`
    select day, name, bdid, clan, clanColor, lastRank, lastDayRank, lastBattlesCount, lastDayBattlesCount, lastRating, lastDayRating
    from Comp7LeaderboardDailyByRank final
    where region = '${region.value}' and
      day = '${leaderboardDay.value.day}' and
      lastRecalculationTime = '${leaderboardDay.value.recalculation}' and
      lower(name) = lower('${escapedName}')
    limit 1
  `, { abortSignal, allowCache: false })

  if (abortSignal.aborted) return

  searchedPlayer.value = data.data[0] ?? null
  searchResolvedFor.value = name
}

watchWithAbortSignal([debouncedNickname, leaderboardDay], signal => searchPlayer(signal), { immediate: true })

const searchResultElement = useTemplateRef<HTMLElement>('searchResultElement')
const searchResultHeight = ref<number | null>(null)
const animateSearchHeight = ref(false)
let animateSearchHeightTimeout: ReturnType<typeof setTimeout> | null = null

useResizeObserver(searchResultElement, () => {
  const element = searchResultElement.value
  if (element) searchResultHeight.value = element.getBoundingClientRect().height
})

watch(searchState, (_, oldState) => {
  if (oldState == 'idle') {
    searchResultHeight.value = null
    return
  }

  animateSearchHeight.value = true
  if (animateSearchHeightTimeout) clearTimeout(animateSearchHeightTimeout)
  animateSearchHeightTimeout = setTimeout(() => animateSearchHeight.value = false, 350)
})

let scrollPendingBdid: number | null = null

function scrollToPlayer(bdid: number) {
  document.getElementById(`leaderboard-player-${bdid}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function goToPlayerInTable() {
  const player = searchedPlayer.value
  if (!player) return

  const targetPage = Math.ceil(player.lastRank / 100)
  if (page.value != targetPage) {
    scrollPendingBdid = player.bdid
    page.value = targetPage
  } else if (leaderboardData.value.some(line => line.bdid == player.bdid)) {
    scrollToPlayer(player.bdid)
  } else {
    scrollPendingBdid = player.bdid
  }
}

watch(leaderboardData, async () => {
  if (scrollPendingBdid == null) return

  const bdid = scrollPendingBdid
  scrollPendingBdid = null
  if (!leaderboardData.value.some(line => line.bdid == bdid)) return

  await nextTick()
  scrollToPlayer(bdid)
})

const captureDetailClose = ref(false)

let preventNextClick = false
function onPointerDown() {
  preventNextClick = captureDetailClose.value
}

function click(name: string) {
  if (selectedName.value == name && preventNextClick) return
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

@keyframes shine {
  to {
    background-position: -100% 0;
  }
}

@mixin skeleton-shine {
  $color: rgba(255, 255, 255, 0.01);
  $highlight-color: rgba(255, 255, 255, 0.05);

  background: linear-gradient(90deg, $color 8%, $highlight-color 18%, $color 33%);
  background-size: 200% 100%;
  animation: shine 1.8s infinite linear;
  background-position: 100% 0;
}

.search-result-animator {
  margin-top: 15px;
  border-radius: 10px;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);

  box-sizing: content-box;

  &.height-animated {
    transition: height 0.3s ease;
  }
}

.search-result {
  padding-top: 8px;

  .skeleton {

    .fake-cell {
      padding: 20px 30px;
      line-height: 1.2;

      .fake-line {
        height: 1.2em;
        max-width: 300px;
        border-radius: 5px;
        @include skeleton-shine;
      }

      @container (width <=500px) {
        padding: 20px 10px;
      }
    }

    .fake-charts {
      display: flex;
      gap: 30px;
      padding: 20px 30px;
      padding-top: 0;

      .fake-chart {
        flex: 1;
        aspect-ratio: 1.8 / 1;
        display: flex;
        flex-direction: column;

        .header {
          height: 19px;
          width: 130px;
          margin-bottom: 8px;
          border-radius: 5px;
          @include skeleton-shine;
        }

        .canvas {
          flex: 1;
          border-radius: 10px;
          @include skeleton-shine;
        }
      }

      @container (width <=900px) {
        flex-direction: column;
      }

      @container (width <=900px) and (width >=500px) {
        .fake-chart {
          aspect-ratio: 2 / 1;
        }
      }

      @container (width <=500px) {
        padding: 20px 10px;

        .fake-chart {
          aspect-ratio: 1.5 / 1;
        }
      }
    }

    .fake-button {
      width: 152px;
      height: 26px;
      border-radius: 5px;
      @include skeleton-shine;
    }
  }

  table {
    tbody {
      tr {
        cursor: default;

        &:not(.selected) {
          border-bottom: none;
        }

        @media (hover: hover) {
          &:hover {
            background: none;
          }
        }
      }

      .details {
        background: none;
      }
    }
  }

  .actions {
    display: flex;
    justify-content: center;
    padding: 0 10px;
    padding-bottom: 10px;

    @container (width <=500px) {
      button {
        flex: 1;
      }
    }

    button {
      background-color: rgba(255, 255, 255, 0.08);
      border-radius: 5px;
      padding: 6px 16px;
      font-size: 14px;
      line-height: 1;
      user-select: none;
      transition: background-color 0.07s;

      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
    }
  }

  &.not-found {
    padding: 15px 20px;
    text-align: center;
    color: #c8c8c8;
    font-size: 14px;
  }
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

  $search-highlight-color: rgba(193, 217, 255, 0.3);

  tbody {
    tr {
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

      &.searched {
        &:not(.details) :deep(td) {
          border-top: 1px solid $search-highlight-color;
        }

        &:not(.selected) {
          border-bottom: 1px solid $search-highlight-color;
        }
      }

    }


    .details {
      background-color: rgba(255, 255, 255, 0.03);

      &.searched {
        border-top: none;
        border-bottom: 1px solid $search-highlight-color;
      }
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
