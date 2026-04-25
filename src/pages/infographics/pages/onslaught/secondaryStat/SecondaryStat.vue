<template>
  <section>
    <!-- <CurrentRating :rating="1234" :elite-rating="4445" /> -->

    <div class="item rating-progress">
      <h3>Текущий рейтинг</h3>
      <RatingBar :rating="1234" :elite-rating="4445" />
    </div>
    <div class="item qualification">
      <h3>Квалификация</h3>
      <Qualification :battles="qualification.battles" :rating="qualification.rating" />
    </div>

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

  @container content (max-width: 700px) {
    .qualification {
      flex: 1;
      justify-content: flex-start;
    }
  }

  @container content (max-width: 900px) {
    gap: 30px;
  }

  @container content (max-width: 700px) {
    flex-direction: column;
  }
}
</style>