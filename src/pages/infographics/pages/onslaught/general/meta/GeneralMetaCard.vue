<template>
  <OnslaughtMetaFrame :params :state section="Общая статистика" footer="Общая статистика · По собранным боям сезона">
    <div class="general-content">
      <div class="overview">
        <div class="overview-copy">
          <h2>Общая статистика<br>Натиска</h2>
          <p class="og-caption">{{ state === 'loading' || overview?.players
            ? 'Игроки, бои и рейтинг за сезон'
            : 'Пока нет записанных боёв' }}</p>
        </div>

        <MetaRankPair :game :season="params.season ?? 'latest'" />
      </div>

      <MetaMetrics :items="[
        { label: 'игроков в выборке', value: formatNumber(overview?.players) },
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
import { regionToGame } from '@/shared/game/domain/wot'
import OnslaughtMetaFrame from '../../meta/OnslaughtMetaFrame.vue'
import MetaMetrics from '../../meta/MetaMetrics.vue'
import MetaRankPair from '../../meta/MetaRankPair.vue'
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
    grid-template-columns: minmax(0, 1fr) 330px;
    grid-template-rows: minmax(0, 1fr);
    align-items: center;
    gap: 24px;
  }

  .overview-copy {
    min-width: 0;
    margin-bottom: 32px;

    h2 {
      margin: 0;
      font-size: 64px;
      line-height: 1.06;
      letter-spacing: -2px;
    }
  }
}
</style>
