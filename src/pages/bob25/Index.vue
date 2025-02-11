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

    <div class="sub-header" ref="subHeader" :class="{ 'visible': shouldDisplaySubHeader }">
      <BloggerName :blogger="'nearyou'" />
      <BloggerName :blogger="'jove'" />
      <BloggerName :blogger="'yusha'" />
      <BloggerName :blogger="'lebwa'" />
    </div>

    <div class="lines">
      <InstallMod />
      <BloggersLine title="Всего игроков" :values="totalPlayers" withPercent
        v-model:show-chart="showTotalPlayersChart" />
      <TimeSeriesChart v-if="showTotalPlayersChart" :labels="totalPlayersChart.labels" :data="totalPlayersChart.data"
        showDisplayVariant />

      <BloggersLine title="Всего очков" :values="totalScore" withPercent collapse-to-log
        v-model:show-chart="showTotalScoreChart" />
      <TimeSeriesChart v-if="showTotalScoreChart" :labels="totalScoreChart.labels" :data="totalScoreChart.data"
        showDisplayVariant :hightFilter="totalScoreHightPass" :should-stepped-interpolation="shouldInterpolateScore" />
      <p class="footnote" v-if="showTotalScoreChart && displayVariant == 'delta'">
        <input type="checkbox" v-model="totalScoreDeltaHightFilter">
        Скрыть пики от рискованных атак
      </p>

      <BloggersLine title="Отрыв" :values="delta.map(t => t[0])" collapse-to-log>
        <template #subline="{ item, i }">
          <p class="subline-blogger nowrap">
            <span v-if="item > 0">От </span><span v-else>До </span>
            <BloggerName :blogger="delta[i][1]" small-bloom />
          </p>
        </template>
      </BloggersLine>


      <BloggersLine title="Прирост очков за 60 минут" :values="hourTotalScoreDelta" with-percent />
      <BloggersLine title="Заработано очков вчера" :values="yesterdayTotalScoreDelta" with-percent>
        <template #subline="{ item, processor }">
          <p class="subline">7% =
            <TweenValue :value="Math.round(item * 0.07)" :processor="processor" space />
          </p>
        </template>
      </BloggersLine>

      <BloggersLine title="Среднее время боя" :values="avgDuration" :processor="t => timeProcessor(t).join(':')"
        v-model:show-chart="showDurationChart" less-is-better />

      <template v-if="showDurationChart">
        <TimeSeriesChart :labels="avgBattleDurationChart.labels" :data="avgBattleDurationChart.data" :min="200"
          :max="300" :processor="t => timeProcessor(t).join(':')" />
        <p class="footnote">*Рекомендуется шаг не менее 10 минут, иначе график шумный</p>
      </template>

      <BloggersLine title="Винрейт" :values="totalWinrate.map(t => t * 100)" :processor="t => `${t.toFixed(2)}%`"
        v-model:show-chart="showWinrateChart" />

      <template v-if="showWinrateChart">
        <TimeSeriesChart :labels="winrateChart.labels" :data="winrateChart.data"
          :processor="t => `${(t * 100).toFixed(2)}%`" :y-values="[0.35, 0.5, 0.65]" y-is-percent />
        <p class="footnote">*Рекомендуется шаг не менее 10 минут, иначе график шумный</p>
      </template>

      <ServerStatusWrapper :status="popularTanks.status" v-slot="{ showError, status }">
        <TopTanks title="Популярная техника" :data="popularTanks.data" v-if="popularTanks.data"
          :value-type="'percent'" />
      </ServerStatusWrapper>


      <ServerStatusWrapper :status="scoredTanks.status" v-slot="{ showError, status }">
        <TopTanks title="В среднем очков" :data="scoredTanks.data" v-if="scoredTanks.data" :value-type="'score'" />
      </ServerStatusWrapper>

      <!-- <AwaitUpdates /> -->
    </div>

    <footer>
      <h5>Почему данным можно доверять</h5>
      <p>Статистика собирается модом, однако, учитывает не только игрока у которого мод установлен, а полный результат
        боя для обеих команд.</p>
      <p>На данный момент, известно о каждом втором сыгранном бое, при этом бои распределены между командами
        пропорционально их
        очкам.</p>
      <p>Если в бою присутствует более одного игрока с модом, бой всё равно засчитывается только один раз.</p>

      <br>
      <h5>Почему нет количества боёв</h5>
      <p>При используемом подходе сбора данных, только относительные метрики могут быть репрезентативными. Например,
        количество <b>известных</b> побед относительно количества <b>известных</b> боёв (получается винрейт)</p>
      <p>Количество боёв это абсолютная величина, и она может зависеть как за счёт бОльшего количества проведённых боёв,
        так и за счёт числа игроков с установленным модом.</p>

      <hr>
      <div class="flex settings">
        <input type="checkbox" v-model="preferredLogProcessor">
        <p>Предпочитать сокращение чисел до <b>М</b>иллионов. 123 456 789 => 123.4M</p>
      </div>
    </footer>


  </div>
</template>


<script setup lang="ts">
import Background from "./assets/background.webp";
import Blogger from "./components/blogger/Blogger.vue";
import BloggersLine from "./components/BloggersLine.vue";
import { useElementBounding, useLocalStorage } from "@vueuse/core";
import TopTanks from "./components/TopTanks.vue";
import TimeSeriesChart from "./components/TimeSeriesChart.vue";
import { period, step, useAvgBattleDuration, useAvgBattleDurationChart, useHourTotalScoreDelta, usePopularTanks, useScoredTanks, useTotalPlayers, useTotalPlayersChart, useTotalScore, useTotalScoreChart, useTotalWinrate, useWinrateChart, useYesterdayTotalScoreDelta } from "./components/queryLoader";
import ServerStatusWrapper from "@/components/ServerStatusWrapper.vue";
import { timeProcessor } from "@/utils";
import InstallMod from "./components/InstallMod.vue";
import BloggerName from "./components/blogger/BloggerName.vue";
import { computed, ref, watchEffect } from "vue";
import { headerHeight, useAdditionalHeaderHeight } from '@/composition/useAdditionalHeaderHeight';
import { displayVariant, preferredLogProcessor } from "./store";
import { useMeta } from "@/composition/useMeta";
import { spaceProcessor } from "@/composition/processors/useSpaceProcessor";
import TweenValue from "@/components/tween/TweenValue.vue";

useMeta({
  title: 'Статистика Битва Блогеров 2025 ',
  description: 'Статистика по битве блогеров 2025 в игре Мир Танков',
  keywords: 'битва блогеров, блогеры, статистика, wot, Джов, Юша, Левша, Нирю, Jove, Yusha, Lebwa, Nearyou',
})


const showTotalPlayersChart = useLocalStorage('bob25-show-total-players-chart', false);
const showTotalScoreChart = useLocalStorage('bob25-show-total-score-chart', true);
const showDurationChart = useLocalStorage('bob25-show-duration-chart', false);
const showWinrateChart = useLocalStorage('bob25-show-winrate-chart', false);

const totalScoreDeltaHightFilter = useLocalStorage('bob25-total-score-delta-hight-filter', false);
const totalScoreHightPass = computed(() => totalScoreDeltaHightFilter.value && displayVariant.value === 'delta')
const shouldInterpolateScore = computed(() => displayVariant.value === 'total' && step.value == 'min1' && period.value != 'lastHour')


const subHeader = ref<HTMLElement | null>(null);
const { top: subHeaderTop, y: menuY, height: menuH } = useElementBounding(subHeader)
const headerOffset = computed(() => headerHeight.value)
const shouldDisplaySubHeader = computed(() => subHeaderTop.value < headerOffset.value)

const { additionalHeaderHeight } = useAdditionalHeaderHeight();
watchEffect(() => {
  if (menuY.value == 0) return additionalHeaderHeight.value = 0;
  if (subHeaderTop.value > headerOffset.value) return additionalHeaderHeight.value = 0;
  additionalHeaderHeight.value = menuH.value - 5
})



const totalPlayers = useTotalPlayers()
const totalPlayersChart = useTotalPlayersChart(showTotalPlayersChart)
const totalScore = useTotalScore()
const totalScoreChart = useTotalScoreChart(showTotalScoreChart)
const hourTotalScoreDelta = useHourTotalScoreDelta()
const yesterdayTotalScoreDelta = useYesterdayTotalScoreDelta()
const avgDuration = useAvgBattleDuration()
const avgBattleDurationChart = useAvgBattleDurationChart(showDurationChart)
const popularTanks = usePopularTanks()
const scoredTanks = useScoredTanks()
const totalWinrate = useTotalWinrate()
const winrateChart = useWinrateChart(showWinrateChart)


const delta = computed(() => {
  const s = totalScore.value

  const sorted = s.map((t, i) => [i, t])
    .toSorted((a, b) => b[1] - a[1])


  const delta = sorted.map((t, i) => {
    if (i === 0) return [t[0], t[1] - sorted[i + 1][1], sorted[i + 1][0]]
    return [t[0], t[1] - sorted[i - 1][1], sorted[i - 1][0]]
  })
    .sort((a, b) => a[0] - b[0])
    .map(t => [t[1], t[2]])


  return delta
})

</script>


<style lang="scss" scoped>
.bob-center-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;

  .sub-header {
    position: sticky;
    top: calc(var(--header-height) - 10px);
    display: flex;
    padding: 0 15px;
    z-index: 10;
    margin-top: -130px;
    margin-bottom: 110px;
    gap: 1rem;

    opacity: 0;
    transition: opacity 0.1s;

    &.visible {
      opacity: 1;
    }

    h2 {
      margin: 0;
      flex: 1;
      text-align: center;
      font-size: 23px;
    }

    @media screen and (max-width: 990px) {
      margin-top: -13.5vw;
      margin-bottom: calc(13.5vw - 20px);
    }

    @media screen and (max-width: 900px) {
      h2 {
        font-size: 20px;
      }
    }

    @media screen and (max-width: 500px) {
      h2 {
        font-size: 16px;
      }
    }
  }
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

.subline-blogger {
  h2 {
    margin: 0;
    font-size: 1.2em;
    display: inline;
  }
}

.subline {
  opacity: 0.8;
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

  .footnote {
    margin-top: -15px;
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
  margin-bottom: 100px;

  h5 {
    margin: 10px 0;
    font-size: 16px;
  }

  .settings {
    gap: 0.5em;
  }

  input[type="checkbox"] {
    cursor: pointer;
  }
}
</style>