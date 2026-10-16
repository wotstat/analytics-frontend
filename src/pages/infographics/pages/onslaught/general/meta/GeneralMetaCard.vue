<template>
  <OnslaughtMetaFrame :params :state section="Общая статистика" footer="Общая статистика · По собранным боям сезона">
    <div class="general-content">
      <div class="overview">
        <div class="audience">
          <p class="og-eyebrow">Общая статистика сезона</p>
          <template v-if="state === 'loading' || overview?.players">
            <h2 class="og-number">{{ formatNumber(overview?.players) }}</h2>
            <p class="og-caption">игроков в собранных боях</p>
          </template>
          <template v-else>
            <h2 class="empty-title">Сезон в цифрах</h2>
            <p class="og-caption">Пока нет записанных боёв</p>
          </template>
        </div>

        <div class="ranks">
          <div class="rank-images">
            <RankIcon rank="fourth" :game :season="params.season ?? 'latest'" size="large" loading="eager" class="gold" />
            <RankIcon rank="fifth" :game :season="params.season ?? 'latest'" size="large" loading="eager" class="champion" />
            <RankIcon rank="sixth" :game :season="params.season ?? 'latest'" size="large" loading="eager" class="legend" />
          </div>
          <p>От Железа до Легенды</p>
        </div>
      </div>

      <MetaMetrics :items="[
        { label: 'боёв в выборке', value: formatNumber(overview?.battles) },
        { label: 'игроков в Легенде', value: formatNumber(snapshot?.legends) },
        { label: 'порог Легенды', value: formatNumber(snapshot?.legends ? snapshot.threshold : null) },
      ]" />
    </div>
  </OnslaughtMetaFrame>
</template>

<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import type { RenderContext } from '@/meta/utils'
import RankIcon from '@/shared/game/components/comp7/rank/RankIcon.vue'
import { regionToGame } from '@/shared/game/domain/wot'
import OnslaughtMetaFrame from '../../meta/OnslaughtMetaFrame.vue'
import MetaMetrics from '../../meta/MetaMetrics.vue'
import { useOnslaughtMeta } from '../../meta/utils/useOnslaughtMeta'
import { loadLeaderboardSnapshot, loadOnslaughtOverview, type LeaderboardSnapshot, type OnslaughtOverview } from '../../meta/utils/data'
import { formatNumber } from '../../meta/utils/format'

const props = defineProps<{ context: RenderContext }>()
const overview = shallowRef<OnslaughtOverview | null>(null)
const snapshot = shallowRef<LeaderboardSnapshot | null>(null)

const { params, state } = useOnslaughtMeta(props.context, async (selection, signal) => {
  const [statistics, leaderboard] = await Promise.all([
    loadOnslaughtOverview(selection, signal),
    loadLeaderboardSnapshot(selection, signal),
  ])
  overview.value = statistics
  snapshot.value = leaderboard
})

const game = computed(() => regionToGame(params.value.region))
</script>

<style scoped lang="scss">
.general-content {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 32px;
  height: 100%;

  .overview {
    display: grid;
    grid-template-columns: 1fr 390px;
    align-items: center;
    gap: 24px;
  }

  .empty-title {
    margin: 0;
    font-size: 62px;
    line-height: 1.1;
  }

  .ranks {
    text-align: center;
    transform: translateY(-16px);

    .rank-images {
      position: relative;
      height: 200px;

      img {
        position: absolute;
        filter: drop-shadow(0 12px 24px #0006);
      }

      .gold {
        width: 140px;
        left: 0;
        top: 40px;
        opacity: .65;
      }

      .champion {
        width: 180px;
        left: 85px;
        top: 20px;
      }

      .legend {
        width: 230px;
        right: -10px;
        top: -10px;
      }
    }

    p {
      margin: 10px 0 0;
      color: var(--meta-card-muted);
      font-size: 19px;
    }
  }
}
</style>
