<template>
  <section :class="`game-${game}`">
    <div class="item rating-progress">
      <h3>Текущий рейтинг</h3>
      <RatingBar :rating="currentRating.rating" :rank="currentRating.rank" :legendThresholds="currentRating.legendThresholds" :top1="currentRating.top1"
        :top10="currentRating.top10" :top100="currentRating.top100" :qualIndex="currentRating.qualIndex" :game
        :season />
    </div>
    <div class="item qualification">
      <h3>Квалификация</h3>
      <Qualification :battles="qualification.battles" :rating="qualification.rating" :rank="qualification.rank" :game :season
        :version="qualification.version" />
    </div>

  </section>
</template>


<script setup lang="ts">
import type { RankTag } from '@/shared/game/domain/comp7/utils'
import { GameVendor } from '@/shared/game/domain/wot'
import RatingBar from './currentRating/RatingBar.vue'
import Qualification from './qualification/Qualification.vue'


const props = defineProps<{
  qualification: {
    battles: { battleIndex: number, result: 'win' | 'loss' | 'draw' }[]
    rating: number | null
    rank: RankTag | null
    version?: string
  },
  currentRating: {
    rating: number | null
    rank: RankTag | null
    legendThresholds: { C: number, B: number, A: number }
    qualIndex: number
    top1: number
    top10: number
    top100: number
  },
  game: GameVendor
  season: string
}>()


</script>


<style lang="scss" scoped>
section {
  margin-top: 45px;
  display: flex;
  gap: 80px;


  .item {
    display: flex;
    justify-content: center;
    flex-direction: column;

    h3 {
      font-size: 16px;
      color: #e3e3e3;
      margin: 0;
      margin-bottom: 5px;
    }
  }

  .rating-progress {
    flex: 1;
  }

  &.game-mt {
    @container content (max-width: 750px) {
      flex-direction: column;

      .qualification {
        flex: 1;
        justify-content: flex-start;
      }
    }

    @container content (max-width: 900px) {
      gap: 30px;
    }
  }

  &.game-wot {
    @container content (max-width: 800px) {
      flex-direction: column;

      .qualification {
        flex: 1;
        justify-content: flex-start;
      }
    }

    @container content (max-width: 950px) {
      gap: 30px;
    }

  }
}
</style>