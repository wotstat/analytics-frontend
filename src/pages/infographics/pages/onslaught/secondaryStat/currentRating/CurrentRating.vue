<template>
  <div class="current-rating">
    <RankIcon :rank="[rating, eliteRating]" class="rank-icon" :size="'large'" />
    <p class="mt-font">{{ rating }}</p>
  </div>
</template>


<script setup lang="ts">
import RankIcon from '@/shared/game/comp7/rank/RankIcon.vue'


const props = defineProps<{
  rating: number
  eliteRating: number
}>()
</script>


<style lang="scss" scoped>
.current-rating {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;

  .rank-icon {
    width: 120px;
    height: 120px;
  }

  p {
    margin: 0;
    font-size: 40px;
    font-weight: bold;
    line-height: 1;
    color: #fffef7;
  }
}
</style>