<template>
  <OnslaughtMetaFrame :params :state :variant="!params.nickname || hasNoStatistics ? 'compact-full' : 'compact'"
    section="Личная статистика" :footer>
    <div v-if="!params.nickname" class="personal-intro">
      <div class="intro-copy">
        <p class="og-eyebrow">Результаты за сезон</p>
        <h2>Личная статистика</h2>
        <p class="og-caption">Рейтинг, победы и статистика по технике</p>
        <div class="invitation">
          Введите свой никнейм на странице
          <svg viewBox="0 0 28 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12h22M17 4l8 8-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </div>
      </div>
      <MetaRankPair :game :season="params.season ?? 'latest'" />
    </div>

    <div v-else-if="hasNoStatistics" class="personal-empty">
      <div class="empty-copy">
        <h2 class="og-nickname" :class="{ long: params.nickname.length > 20 }">{{ params.nickname }}</h2>
        <p class="empty-message">Пока нет статистики</p>
        <p class="og-caption">Здесь учитываются бои с модом WotStat</p>
      </div>
      <BattlesIcon class="empty-icon" />
    </div>

    <div v-else class="personal-player">
      <div class="player-overview">
        <div class="player-copy">
          <h2 class="og-nickname" :class="{ long: params.nickname.length > 20 }">{{ params.nickname }}</h2>
          <div class="rating">
            <span class="og-number">{{ formatNumber(statistics?.rating) }}</span><span>очков рейтинга</span>
          </div>
          <p v-if="division" class="rank-label">{{ rankLabel(division) }}</p>
        </div>

        <div v-if="division" class="player-rank">
          <RankIcon :rank="division" :game :season="params.season ?? 'latest'" size="large" loading="eager" />
        </div>
      </div>

      <MetaMetrics hide-labels :items="[
        { label: 'боёв за сезон', value: formatNumber(statistics?.battles), icon: BattlesIcon },
        { label: 'побед', value: formatPercent(winrate), icon: WinrateIcon },
        { label: 'средний урон', value: formatNumber(statistics?.damage), icon: DamageIcon },
      ]" />
    </div>
  </OnslaughtMetaFrame>
</template>

<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import type { RenderContext } from '@/meta/utils'
import RankIcon from '@/shared/game/components/comp7/rank/RankIcon.vue'
import BattlesIcon from '@/shared/game/components/efficiencyIcon/assets/battles.svg?component'
import WinrateIcon from '@/shared/game/components/efficiencyIcon/assets/winrate.svg?component'
import DamageIcon from '@/shared/game/components/efficiencyIcon/assets/dmg.svg?component'
import { regionToGame } from '@/shared/game/domain/wot'
import { getDivisionByRating } from '@/shared/game/domain/comp7/utils'
import OnslaughtMetaFrame from '../../meta/OnslaughtMetaFrame.vue'
import MetaMetrics from '../../meta/MetaMetrics.vue'
import MetaRankPair from '../../meta/MetaRankPair.vue'
import { useOnslaughtMeta } from '../../meta/utils/useOnslaughtMeta'
import { loadLeaderboardSnapshot, loadPersonalStatistics, type PersonalStatistics } from '../../meta/utils/data'
import { formatNumber, formatPercent, rankLabel } from '../../meta/utils/format'

const props = defineProps<{ context: RenderContext }>()
const statistics = shallowRef<PersonalStatistics | null>(null)
const legendThreshold = shallowRef<number | null>(null)

const { params, state } = useOnslaughtMeta(props.context, async (selection, signal) => {
  if (!selection.nickname) return
  const [personal, leaderboard] = await Promise.all([
    loadPersonalStatistics(selection, signal),
    loadLeaderboardSnapshot(selection, signal),
  ])
  statistics.value = personal
  legendThreshold.value = leaderboard?.legends ? leaderboard.threshold : null
})

const hasNoStatistics = computed(() => state.value === 'ready' && !statistics.value)
const game = computed(() => regionToGame(params.value.region))
const winrate = computed(() => {
  if (!statistics.value?.results) return null
  return statistics.value.wins / statistics.value.results
})

const division = computed(() => {
  if (statistics.value?.rating == null) return null
  return getDivisionByRating(statistics.value.rating, game.value,
    legendThreshold.value ?? statistics.value.eliteRating, params.value.season ?? 'latest')
})

const footer = computed(() => {
  if (!params.value.nickname) return 'Личная статистика · За весь сезон'
  if (!statistics.value) return 'Личная статистика'
  const date = new Date(statistics.value.updatedAt * 1000).toLocaleDateString('ru-RU', { timeZone: 'UTC' })
  return `Личная статистика · Актуально на ${date}`
})
</script>

<style scoped lang="scss">
.personal-intro {
  display: grid;
  grid-template-columns: 1fr 330px;
  align-items: center;
  gap: 24px;
  height: 100%;

  h2 {
    margin: 0;
    font-size: 64px;
    line-height: 1.06;
    letter-spacing: -2px;
  }

  .invitation {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-top: 30px;
    color: var(--onslaught-accent);
    font-size: 21px;

    svg {
      display: block;
      flex: none;
      width: 28px;
      height: 24px;
    }
  }
}

.personal-empty {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  align-items: center;
  gap: 48px;
  height: 100%;

  .empty-copy {
    min-width: 0;
  }

  .empty-message {
    margin: 24px 0 0;
    font-size: 32px;
    line-height: 1.2;
  }

  .empty-icon {
    width: 260px;
    height: 260px;
    color: var(--meta-card-muted);
    opacity: .35;
  }
}

.personal-player {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 32px;
  height: 100%;

  .player-overview {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    align-items: center;
    gap: 32px;
    min-height: 0;
  }

  .player-copy {
    min-width: 0;
  }

  .rating {
    display: flex;
    align-items: baseline;
    gap: 20px;
    margin-top: 22px;

    .og-number {
      font-size: 80px;
      letter-spacing: normal;
    }

    >span:last-child {
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
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 0;

    img {
      width: 340px;
      filter: drop-shadow(0 12px 28px #0006);

      &.game-wot {
        width: 320px;
      }
    }
  }
}
</style>
