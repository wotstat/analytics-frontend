<template>
  <div class="rating-tooltip">
    <p>За победу: <span class="value green mt-font">+{{ roundProcessor(ratingWin) }}</span></p>
    <p>За поражение: <span class="value red mt-font">{{ roundProcessor(ratingLose) }}</span></p>
    <hr>
    <p>Текущий рейтинг: <span class="value mt-font">
        <RankIcon :rank="last" :size="'small'" class="rank-icon" :season :game />
        {{ last[0] }}
      </span>
    </p>
    <p>Всего очков:
      <span class='value delta green mt-font' v-if="totalIncome > 0">+{{ totalIncome }}</span>
      <span class='value delta red mt-font' v-else-if="totalIncome < 0">{{ totalIncome }}</span>
    </p>
  </div>
</template>


<script setup lang="ts">
import { createFixedProcessor } from '@/shared/utils/processors/processors'
import RankIcon from '@/shared/game/comp7/rank/RankIcon.vue'
import { GameVendor } from '@/shared/game/wot'

const props = defineProps<{
  last: [rating: number, eliteRating: number]
  totalIncome: number
  ratingWin: number
  ratingLose: number
  season?: string
  game?: GameVendor
}>()


const roundProcessor = createFixedProcessor(2)
</script>


<style lang="scss" scoped>
.rating-tooltip {
  width: 200px;
}

p {
  margin: 0;
  font-size: 14px;
  line-height: 1.3;
}

.value {
  font-weight: bold;
  font-size: 15px;
  line-height: 1;

  .rank-icon {
    height: 20px;
    margin: -4px;
    margin-right: -2px;
    filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.2));
  }
}

.rating-delta {
  font-size: 14px;
  line-height: 1;
  margin-left: 5px;
  color: #aaaaaa;
  font-weight: normal;
}

.green {
  color: #4aff62;
}

.red {
  color: #ff6262;
}

hr {
  margin: 5px 0;

  border: none;
  border-bottom: 1px solid var(--color-separator, #54545899);
}
</style>