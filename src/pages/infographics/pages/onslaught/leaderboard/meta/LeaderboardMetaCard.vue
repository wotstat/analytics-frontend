<template>
  <OnslaughtMetaFrame :params :state section="Таблица лидеров" :footer>
    <div v-if="params.nickname" class="leaderboard-player" :class="{ 'has-rank': division }">
      <div class="player-overview">
        <div class="player-copy">
          <h2 class="og-nickname" :class="{ long: playerName.length > 20 }">{{ playerName }}</h2>
          <template v-if="player || state === 'loading'">
            <p class="position">
              <span class="og-number">{{ formatNumber(player?.position) }}</span>
              <span class="position-label">место</span>
            </p>
            <p v-if="division" class="rank-label">{{ rankLabel(division) }}</p>
          </template>
          <template v-else>
            <p class="no-data">Игрок вне таблицы лидеров</p>
            <p class="og-caption">В выбранном регионе и сезоне</p>
          </template>
        </div>
        <MetaMetrics v-if="player || state === 'loading'" :items="[
          { label: 'рейтинг', value: formatNumber(player?.rating) },
          { label: 'боёв', value: formatNumber(player?.battles) },
        ]" />
      </div>
      <div v-if="division" class="player-rank">
        <RankIcon :rank="division" :game :season="params.season ?? 'latest'" size="large" loading="eager" />
      </div>
    </div>

    <div v-else-if="snapshot || state === 'loading'" class="leaderboard-overview">
      <div class="legend-summary">
        <p class="legend-heading">Порог Легенды</p>
        <div class="legend-rating">
          <RankIcon rank="sixth" :game :season="params.season ?? 'latest'" size="large" loading="eager" />
          <h2 class="og-number">{{ formatNumber(snapshot?.legends ? snapshot.threshold : null) }}</h2>
        </div>
        <p class="legend-population"><strong>{{ formatNumber(snapshot?.legends) }}</strong> игроков в Легенде</p>
      </div>

      <div class="top-players">
        <div class="table-heading"><span>Пятёрка лидеров</span><span>Рейтинг</span></div>
        <div v-for="item in players" :key="item.position" class="player-row" :class="{ first: item.position === 1 }">
          <span class="place">{{ item.position }}</span>
          <span class="name">{{ item.name }}</span>
          <span class="points">{{ formatNumber(item.rating) }}</span>
        </div>
      </div>
    </div>

    <div v-else class="empty-leaderboard">
      <p class="og-eyebrow">Таблица лидеров</p>
      <h2>Лидеры сезона</h2>
      <p class="og-caption">В этом сезоне пока нет данных рейтинга</p>
    </div>
  </OnslaughtMetaFrame>
</template>

<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import type { RenderContext } from '@/meta/utils'
import RankIcon from '@/shared/game/components/comp7/rank/RankIcon.vue'
import { regionToGame } from '@/shared/game/domain/wot'
import { getDivisionByLeaderboardCode, getDivisionByRating } from '@/shared/game/domain/comp7/utils'
import OnslaughtMetaFrame from '../../meta/OnslaughtMetaFrame.vue'
import MetaMetrics from '../../meta/MetaMetrics.vue'
import { useOnslaughtMeta } from '../../meta/utils/useOnslaughtMeta'
import { loadLeaderboardSnapshot, type LeaderboardSnapshot } from '../../meta/utils/data'
import { formatNumber, rankLabel } from '../../meta/utils/format'

const props = defineProps<{ context: RenderContext }>()
const snapshot = shallowRef<LeaderboardSnapshot | null>(null)

const { params, state } = useOnslaughtMeta(props.context, async (selection, signal) => {
  snapshot.value = await loadLeaderboardSnapshot(selection, signal)
})

const game = computed(() => regionToGame(params.value.region))
const players = computed(() => snapshot.value?.entries ?? [])
const player = computed(() => params.value.nickname ? players.value[0] : null)
const playerName = computed(() => player.value?.name ?? params.value.nickname)

const division = computed(() => {
  if (!player.value) return null
  const season = params.value.season ?? 'latest'
  const recordedDivision = getDivisionByLeaderboardCode(player.value.division, game.value, season)
  if (recordedDivision) return recordedDivision
  if (player.value.elite) return 'sixth'
  return getDivisionByRating(player.value.rating, game.value, null, season)
})

const footer = computed(() => {
  if (!snapshot.value) return 'Таблица лидеров · Рейтинг сезона'
  return `Таблица лидеров · Актуально на ${snapshot.value.day.split('-').reverse().join('.')}`
})
</script>

<style scoped lang="scss">
.leaderboard-overview {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  align-items: center;
  gap: 80px;
  height: 100%;

  .legend-heading {
    margin: 0 0 16px;
    white-space: nowrap;
    color: var(--onslaught-accent);
    font-size: 32px;
    font-weight: 700;
    line-height: 1.15;
  }

  .legend-rating {
    display: flex;
    align-items: center;
    gap: 4px;

    img {
      flex: none;
      width: 128px;
      margin: 0 -8px 0 -24px;

      &.game-wot {
        margin-right: 8px;
      }
    }
  }

  .og-number {
    font-size: 88px;
    letter-spacing: -2px;
  }

  .legend-population {
    margin: 20px 0 0;
    color: var(--meta-card-muted);
    font-size: 21px;
    line-height: 1.4;

    strong {
      margin-right: 6px;
      color: var(--meta-card-text);
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
  }

  .top-players {
    min-width: 0;

    .table-heading {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 20px;
      color: var(--meta-card-muted);
      font-size: 19px;
    }

    .player-row {
      display: grid;
      grid-template-columns: 28px minmax(0, 1fr) auto;
      align-items: center;
      gap: 20px;
      height: 60px;
      border-top: 1px solid #ffffff12;

      .place {
        color: var(--meta-card-muted);
        font-size: 21px;
      }

      .name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 24px;
      }

      .points {
        font-size: 28px;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }

      &.first {
        color: #ffe0a4;

        .place {
          color: inherit;
        }
      }
    }
  }
}

.leaderboard-player {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  gap: 48px;
  height: 100%;

  &.has-rank {
    grid-template-columns: minmax(0, 1fr) 420px;
  }

  .player-overview {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
    gap: 32px;
  }

  .player-copy {
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex: 1;
    min-width: 0;
  }

  .position {
    display: flex;
    align-items: baseline;
    gap: 20px;
    margin: 24px 0 0;

    .og-number {
      font-size: 80px;
      letter-spacing: normal;
    }

    .position-label {
      color: var(--meta-card-muted);
      font-size: 23px;
    }
  }

  .rank-label {
    margin: 16px 0 0;
    color: var(--onslaught-accent);
    font-size: 25px;
    font-weight: 600;
    line-height: 1.2;
  }

  .player-rank {
    align-self: center;

    img {
      display: block;
      width: 420px;
      margin-top: -36px;
      filter: drop-shadow(0 12px 28px #0006);

      &.game-wot {
        width: 380px;
        margin-inline: auto;
      }
    }
  }

  .no-data {
    margin: 28px 0 0;
    font-size: 38px;
    line-height: 1.2;
  }
}

.empty-leaderboard h2 {
  margin: 0;
  font-size: 64px;
}
</style>
