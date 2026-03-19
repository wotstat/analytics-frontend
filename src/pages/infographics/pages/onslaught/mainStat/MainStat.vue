<template>
  <div class="stats" :style="{ '--cols': items.length }">
    <div class="items">
      <template v-for="item in items">
        <TopRating v-if="item.type === 'top-rating'" :day="item.dayIndex" :value="item.rating" :season="item.season"
          :eliteRating="item.eliteRating" :game @selectDay="emit('selectDay', $event)" />
        <SimpleItem v-else-if="item.type === 'simple'" :icon="item.icon" :value="item.value" :text="item.text"
          :tooltipComponent="item.tooltipComponent" />
        <Winrate v-else-if="item.type === 'winrate'" :value="item.value" :text="item.text"
          :tooltipComponent="item.tooltipComponent" />
        <RatingDelta v-else-if="item.type === 'rating-delta'" :value="item.rating" :eliteRating="item.eliteRating"
          :delta="item.delta" :season="item.season" :game />
      </template>
    </div>
  </div>
</template>


<script setup lang="ts">
import { GameVendor } from '@/shared/game/wot'
import { StatItem } from './useMainStat'
import SimpleItem from './items/SimpleItem.vue'
import TopRating from './items/TopRating.vue'
import Winrate from './items/Winrate.vue'
import RatingDelta from './items/RatingDelta.vue'

const props = defineProps<{
  items: StatItem[]
  game?: GameVendor
}>()

const emit = defineEmits<{
  (e: 'selectDay', dayIndex: number): void
}>()
</script>


<style lang="scss" scoped>
.stats {
  margin-top: 20px;
  container: main-stats / inline-size;
  color: #fffef7;

  .items {
    display: grid;
    grid-template-columns: repeat(var(--cols), 1fr);
    gap: 20px 30px;

    @container main-stats (width < 800px) {
      grid-template-columns: repeat(calc(var(--cols) / 2), 1fr);
    }

    @container main-stats (width < 450px) {
      gap: 10px;
      grid-template-columns: repeat(2, 1fr);
    }

    @container main-stats (width < 350px) {
      grid-template-columns: 1fr;
    }
  }
}
</style>