<template>
  <section>
    <CurrentRating :rating="1234" :elite-rating="4445" />

    <div class="vertical">
      <RatingBar :rating="1234" :elite-rating="4445" />
      <Qualification :battles="qualification.battles" :rating="qualification.rating" />
    </div>
    <!-- <div class="item rating">
      <RatingBar :rating="1234" :elite-rating="4445" />
    </div>
    <div class="item">
      <Qualification :battles="qualification.battles" :rating="qualification.rating" />
    </div> -->
    <div class="item">
      <Qualification :battles="qualification.battles" :rating="qualification.rating" />
    </div>
    <!-- <div class="item">
      <Qualification :battles="qualification.battles" :rating="qualification.rating" />
    </div> -->
  </section>
</template>


<script setup lang="ts">
import CurrentRating from './currentRating/CurrentRating.vue'
import RatingBar from './currentRating/RatingBar.vue'
import Qualification from './qualification/Qualification.vue'



const props = defineProps<{
  qualification: {
    battles: { battleIndex: number, result: 'win' | 'loss' | 'draw' }[]
    rating: number
  }
}>()


</script>


<style lang="scss" scoped>
section {
  margin-top: 45px;
  display: flex;
  gap: 10px;

  .vertical {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .item {
    flex: 1;
    border: 1px solid rgba(180, 180, 180, 0.1);
    border-radius: 8px;
    padding: 15px;

    &.rating {
      flex: 2;
    }
  }
}
</style>