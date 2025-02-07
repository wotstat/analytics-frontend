<template>
  <div class="bob-center-container">
    <img :src="Background" class="background" alt="background" />
    <h1>Битва Блогеров 2025</h1>

    <!-- <div>
      <h2>Near_You</h2>
    </div> -->
    <div class="bloggers">
      <Blogger blogger="nearyou" />
      <Blogger blogger="jove" />
      <Blogger blogger="yusha" />
      <Blogger blogger="lebwa" />
    </div>

    <div class="lines">
      <InstallMod />
      <BloggersLine title="Всего игроков" :values="totalPlayers" withPercent
        v-model:show-chart="showTotalPlayersChart" />
      <TimeSeriesChart v-if="showTotalPlayersChart" :labels="totalPlayersChart.labels" :data="totalPlayersChart.data"
        showDisplayVariant />

      <BloggersLine title="Всего очков" :values="totalScore" withPercent v-model:show-chart="showTotalScoreChart" />
      <TimeSeriesChart v-if="showTotalScoreChart" :labels="totalScoreChart.labels" :data="totalScoreChart.data"
        showDisplayVariant />

      <!-- <BloggersLine title="Прирост очков за 24 часа" :values="dayTotalScoreDelta" with-percent /> -->

      <BloggersLine title="Прирост очков за 60 минут" :values="hourTotalScoreDelta" with-percent />
      <BloggersLine title="Средне время боя" :values="avgDuration" :processor="t => timeProcessor(t).join(':')"
        v-model:show-chart="showDurationChart" less-is-better />
      <TimeSeriesChart v-if="showDurationChart" :labels="avgBattleDurationChart.labels"
        :data="avgBattleDurationChart.data" showDisplayVariant :min="0" :max="600"
        :processor="t => timeProcessor(t).join(':')" />

      <!-- <BloggersLine title="Винрейт" :values="playersCount.map(t => 100 * Math.random())"
        :processor="t => `${t.toFixed(2)}%`" /> -->

      <ServerStatusWrapper :status="popularTanks.status" v-slot="{ showError, status }">
        <TopTanks title="Популярная техника" :data="popularTanks.data" v-if="popularTanks.data"
          :value-type="'percent'" />
      </ServerStatusWrapper>


      <ServerStatusWrapper :status="scoredTanks.status" v-slot="{ showError, status }">
        <TopTanks title="В среднем очков" :data="scoredTanks.data" v-if="scoredTanks.data" :value-type="'score'" />
      </ServerStatusWrapper>

      <AwaitUpdates />
    </div>

    <footer>

    </footer>

  </div>
</template>


<script setup lang="ts">
import Background from "./assets/background.webp";
import Blogger from "./components/blogger/Blogger.vue";
import BloggersLine from "./components/BloggersLine.vue";
import { useLocalStorage } from "@vueuse/core";
import TopTanks from "./components/TopTanks.vue";
import TimeSeriesChart from "./components/TimeSeriesChart.vue";
import { use24HourTotalScoreDelta, useAvgBattleDuration, useAvgBattleDurationChart, useHourTotalScoreDelta, usePopularTanks, useScoredTanks, useTotalPlayers, useTotalPlayersChart, useTotalScore, useTotalScoreChart } from "./components/queryLoader";
import ServerStatusWrapper from "@/components/ServerStatusWrapper.vue";
import { timeProcessor } from "@/utils";
import InstallMod from "./components/InstallMod.vue";
import AwaitUpdates from "./components/AwaitUpdates.vue";


const showTotalPlayersChart = useLocalStorage('bob25-show-total-players-chart', false);
const showTotalScoreChart = useLocalStorage('bob25-show-total-score-chart', true);
const showDurationChart = useLocalStorage('bob25-show-duration-chart', false);


const totalPlayers = useTotalPlayers()
const totalPlayersChart = useTotalPlayersChart()
const totalScore = useTotalScore()
const totalScoreChart = useTotalScoreChart()
const hourTotalScoreDelta = useHourTotalScoreDelta()
const dayTotalScoreDelta = use24HourTotalScoreDelta()
const avgDuration = useAvgBattleDuration()
const avgBattleDurationChart = useAvgBattleDurationChart()
const popularTanks = usePopularTanks()
const scoredTanks = useScoredTanks()

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

h2 {
  position: sticky;
  top: 100px;
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

.lines {
  div {
    margin-bottom: 20px;
  }
}

h3 {
  margin: 0;
  margin-bottom: 5px;
}

:deep(.card) {
  background: rgb(102 102 102 / 15%);
  box-shadow: none;
}

footer {
  margin-top: 200px;
}
</style>