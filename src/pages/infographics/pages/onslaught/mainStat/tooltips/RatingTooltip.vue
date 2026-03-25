<template>
  <div class="rating-tooltip">
    <p>За победу: <span class="value green mt-font">+{{ roundProcessor(ratingWin) }}</span></p>
    <p>За поражение: <span class="value red mt-font">{{ roundProcessor(ratingLose) }}</span></p>
    <hr>
    <p v-if="min[0] != 0">Минимум: <span class="value mt-font">
        <RankIcon :rank="min" :size="'small'" class="rank-icon" :season :game />
        {{ min[0] }}
      </span>
      <span class="rating-delta value mt-font" v-if="minDelta != 0">
        ({{ minDelta > 0 ? '+' : '' }}{{ minDelta }})
      </span>
    </p>
    <p>Максимум: <span class="value mt-font">
        <RankIcon :rank="max" :size="'small'" class="rank-icon" :season :game />
        {{ max[0] }}
      </span>
      <span class="rating-delta value mt-font" v-if="maxDelta != 0">
        ({{ maxDelta > 0 ? '+' : '' }}{{ maxDelta }})
      </span>
    </p>
  </div>
</template>


<script setup lang="ts">
import { createFixedProcessor } from '@/shared/utils/processors/processors'
import RankIcon from '@/shared/game/comp7/rank/RankIcon.vue'
import { computed } from 'vue'
import { GameVendor } from '@/shared/game/wot'

const props = defineProps<{
  min: [rating: number, eliteRating: number]
  max: [rating: number, eliteRating: number]
  current: number
  ratingWin: number
  ratingLose: number
  season?: string
  game?: GameVendor
}>()


const roundProcessor = createFixedProcessor(2)
const maxDelta = computed(() => props.max[0] - props.current)
const minDelta = computed(() => props.min[0] - props.current)
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