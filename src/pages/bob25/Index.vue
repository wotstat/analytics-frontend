<template>
  <div class="bob-center-container">
    <img :src="Background" class="background" alt="background" />
    <h1>Битва Блогеров 2025</h1>

    <div class="bloggers">
      <Blogger blogger="nearyou" />
      <Blogger blogger="jove" />
      <Blogger blogger="yusha" />
      <Blogger blogger="lebwa" />
    </div>

    <BloggersLine title="Всего игроков" :values="playersCount" withPercent />
    <br>
    <BloggersLine title="Всего очков" :values="playersCount" withPercent v-model:show-chart="showTotalScoreChart" />
    <br>
    <TotalScoreChart v-if="showTotalScoreChart" />
    <br>
    <BloggersLine title="Прирост очков за 24 часа" :values="playersCount" with-percent />
    <br>
    <BloggersLine title="Прирост очков за 60 минут" :values="playersCount" with-percent />
    <!-- <br> -->
    <!-- <TotalScoreChart /> -->
    <br>
    <BloggersLine title="Винрейт" :values="playersCount.map(t => 100 * Math.random())"
      :processor="t => `${t.toFixed(2)}%`" />
    <br>
    <TopTanks title="Популярная техника" />
    <br>
    <br>
    <br>
    <br>
    <br>
    <br>

  </div>
</template>


<script setup lang="ts">
import Background from "./assets/background.webp";
import Blogger from "./components/blogger/Blogger.vue";
import BloggersValues from "./components/BloggersValues.vue";
import BloggersLine from "./components/BloggersLine.vue";
import { computed, ref } from "vue";
import { useLocalStorage, useTimestamp } from "@vueuse/core";
import TotalScoreChart from "./components/TotalScoreChart.vue";
import TopTanks from "./components/TopTanks.vue";


const showTotalScoreChart = useLocalStorage('bob25-show-total-score-chart', false);

const time = useTimestamp();
const offset = computed(() => Math.round((time.value - 1738373302152) / 3000));
const playersCount = computed(() => [
  100 + offset.value * 400 * Math.random(),
  200 + offset.value * 400 * Math.random(),
  300 + offset.value * 400 * Math.random(),
  400 + offset.value * 400 * Math.random(),]
);


</script>


<style lang="scss" scoped>
.bob-center-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}


h1 {
  color: white;
  text-align: center;
  text-shadow:
    0.5px 0.3px 8px rgba(0, 195, 255, 0.3),
    -0.5px -0.5px 8px rgba(225, 0, 255, 0.3),
    0.5px 0.5px 3px rgb(0, 195, 255, 0.6),
    -0.5px -0.3px 3px rgb(225, 0, 255, 0.6);

  @media screen and (max-width: 900px) {
    font-size: 40px;
  }

  @media screen and (max-width: 600px) {
    font-size: 30px;
  }
}

.background {
  position: fixed;
  transform: translate3d(0, 0, 0);
  left: 0;
  top: 0;
  width: 100%;
  height: 900px;
  object-fit: cover;
  z-index: -1;

  filter: brightness(0.8) blur(30px);
  opacity: 0.3;
  mask-image: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.4) 45%, rgba(0, 0, 0, 0) 100%);
  pointer-events: none;
  user-select: none;
}

.bloggers {
  display: flex;
  justify-content: space-around;
  max-width: 100%;
  max-height: 400px;
  padding: 0 15px;
}

h3 {
  margin: 0;
  margin-bottom: 5px;
}

:deep(.card) {
  background: rgb(102 102 102 / 15%);
  box-shadow: none;
}
</style>