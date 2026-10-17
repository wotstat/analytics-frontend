<template>
  <div class="meta-rank-pair">
    <RankIcon rank="fifth_hero" :game :season size="large" loading="eager" class="champion" />
    <RankIcon rank="sixth_hero" :game :season size="large" loading="eager" class="legend" />
  </div>
</template>

<script setup lang="ts">
import RankIcon from '@/shared/game/components/comp7/rank/RankIcon.vue'
import type { GameVendor } from '@/shared/game/domain/wot'

defineProps<{ game: GameVendor, season: string }>()
</script>

<style scoped lang="scss">
.meta-rank-pair {
  position: relative;
  height: 310px;

  img {
    position: absolute;
    filter: drop-shadow(0 16px 32px #0007);
  }

  .champion {
    width: 200px;
    left: -25px;
    bottom: 0;
    opacity: .7;
  }

  .legend {
    width: 290px;
    right: -20px;
    top: -10px;
  }
}
</style>
