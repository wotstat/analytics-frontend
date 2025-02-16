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

    <div class="skills-header">
      <Skills v-for="skill in skills" :skills="skill" />
    </div>

    <div class="lines">
      <InstallMod />
      <BloggersLine title="Всего игроков" :values="totalPlayers" withPercent
        v-model:show-chart="showTotalPlayersChart" />
      <TimeSeriesChart v-if="showTotalPlayersChart" :labels="totalPlayersChart.labels" :data="totalPlayersChart.data"
        showDisplayVariant />


      <BloggersLine title="Всего боёв" :values="totalBattles" withPercent v-model:show-chart="showTotalBattlesChart" />
      <TimeSeriesChart v-if="showTotalBattlesChart" :labels="totalBattlesChart.labels" :data="totalBattlesChart.data"
        showDisplayVariant smooth-if-need />
      <p class="footnote small">В том числе бои сыгранные <b>без мода</b>*. Обновляется по факту завершения боя, но
        засчитывает по времени начала.</p>

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
      <BloggersLine title="Заработано очков сегодня" :values="todayScoreDelta" with-percent>
        <template #subline="{ item, processor }">
          <p class="subline">7% =
            <TweenValue :value="Math.round(item * 0.07)" :processor="processor" space />
          </p>
        </template>
      </BloggersLine>
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
          :processor="t => `${(t * 100).toFixed(2)}%`" :y-values="[0.35, 0.5, 0.65]" y-is-percent smooth-if-need />
        <p class="footnote">*Рекомендуется шаг не менее 10 минут, иначе график шумный</p>
      </template>

      <CrossTable title="Перекрёстный винрейт" :percents="crossWinrate" :digits="1" v-if="crossWinrate" />
      <CrossTable title="Перекрёстное количество боёв" :percents="crossBattles" :digits="0" v-if="crossBattles" />
      <p class="footnote">
        Читать построчно. То есть, если в строке <b>Near_You</b> и столбце <b>Yusha</b> стоит 13%, это значит, что
        команда <b>Near_You</b> провела 13% боёв против команды <b>Yusha</b>.
      </p>

      <ServerStatusWrapper :status="popularTanks.status" v-slot="{ showError, status }">
        <TopTanks title="Популярная техника" :data="popularTanks.data" v-if="popularTanks.data"
          :value-type="'percent'" />
      </ServerStatusWrapper>


      <ServerStatusWrapper :status="scoredTanks.status" v-slot="{ showError, status }">
        <TopTanks title="В среднем очков" :data="onlyPopularTanks ? scoredPopularTanks.data : scoredTanks.data"
          v-if="scoredTanks.data && scoredPopularTanks.data" :value-type="'score'">
          <div class="flex top-tanks-filter">
            <input type="checkbox" v-model="onlyPopularTanks">
            <label>Среди популярных танков. <i>(топ 30 танков по количеству боёв)</i></label>
          </div>
        </TopTanks>
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
      <h5>*Оценка количества боёв</h5>
      <p>
        На основании количества боёв, в которых присутствует <b>ровно один игрок</b> с модом, и количества боёв, в
        которых присутствует <b>ровно два игрока</b> с модом, можно оценить количество боёв, где с модом ноль игроков.
        Бои, в которых присутствовал взвод с модом исключаются.
        <br>
        От абсолютных значений отклонение может быть, однако вы
        можете сравнивать команды друг между другом и отток пользователей со временем.
        <br>
        <br>
        Для тех кому интересно. Формула: <br>
        <code>t = (n2 / n1) / 6.5</code>
        <br>
        <code>k = 1 - pow(1 - (t / (1 + t)), 14)</code>
        <br>
        <code>total = (n1 + n2 + n3 + n4) / k</code>
        <br>
        Где <code>n1</code> - количество боёв с одним игроком с модом, <code>n2</code> - количество боёв с двумя,
        <code>6.5</code> – отношение числа сочетаний из <code>14 по 2</code> к числу сочетаний из <code>14 по 1</code>
      </p>

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
import { period, step, useAvgBattleDuration, useAvgBattleDurationChart, useCrossBattleCount, useCrossWinrate, useHourTotalScoreDelta, usePopularTanks, useScoredPopularTanks, useScoredTanks, useSkillsHistory, useTodayTotalScoreDelta, useTotalBattles, useTotalBattlesChart, useTotalPlayers, useTotalPlayersChart, useTotalScore, useTotalScoreChart, useTotalWinrate, useWinrateChart, useYesterdayTotalScoreDelta } from "./components/queryLoader";
import ServerStatusWrapper from "@/components/ServerStatusWrapper.vue";
import { timeProcessor } from "@/utils";
import InstallMod from "./components/InstallMod.vue";
import BloggerName from "./components/blogger/BloggerName.vue";
import { computed, onMounted, ref, watchEffect } from "vue";
import { headerHeight, useAdditionalHeaderHeight } from '@/composition/useAdditionalHeaderHeight';
import { displayVariant, preferredLogProcessor } from "./store";
import { useMeta } from "@/composition/useMeta";
import TweenValue from "@/components/tween/TweenValue.vue";
import Skills from "./components/skills/Skills.vue";
import CrossTable from "./components/CrossTable.vue";


useMeta({
  title: 'Статистика Битва Блогеров 2025 ',
  description: 'Статистика по битве блогеров 2025 в игре Мир Танков',
  keywords: 'битва блогеров, блогеры, статистика, wot, Джов, Юша, Левша, Нирю, Jove, Yusha, Lebwa, Nearyou',
})


const showTotalPlayersChart = useLocalStorage('bob25-show-total-players-chart', false);
const showTotalBattlesChart = useLocalStorage('bob25-show-total-battles-chart', false);
const showTotalScoreChart = useLocalStorage('bob25-show-total-score-chart', true);
const showDurationChart = useLocalStorage('bob25-show-duration-chart', false);
const showWinrateChart = useLocalStorage('bob25-show-winrate-chart', false);
const onlyPopularTanks = useLocalStorage('bob25-only-popular-tanks', false);

const totalScoreDeltaHightFilter = useLocalStorage('bob25-total-score-delta-hight-filter', false);
const totalScoreHightPass = computed(() => totalScoreDeltaHightFilter.value && displayVariant.value === 'delta')
const shouldInterpolateScore = computed(() => displayVariant.value === 'total' && step.value == 'min1' && period.value != 'lastHour')


const subHeader = ref<HTMLElement | null>(null);
const loaded = ref(false)
const { top: subHeaderTop, y: menuY, height: menuH, update } = useElementBounding(subHeader)
const headerOffset = computed(() => headerHeight.value)
const shouldDisplaySubHeader = computed(() => loaded.value && subHeaderTop.value < headerOffset.value)

onMounted(async () => {

  async function awaitLoad() {
    for (let i = 0; i < 200; i++) {
      await new Promise(r => setTimeout(r, 1))
      if (subHeaderTop.value > 80) return
      update()
    }
  }

  await awaitLoad()
  loaded.value = true
})


const { additionalHeaderHeight } = useAdditionalHeaderHeight();
watchEffect(() => {
  if (menuY.value == 0) return additionalHeaderHeight.value = 0;
  if (subHeaderTop.value > headerOffset.value) return additionalHeaderHeight.value = 0;
  additionalHeaderHeight.value = menuH.value - 5
})


const totalPlayers = useTotalPlayers()
const totalPlayersChart = useTotalPlayersChart(showTotalPlayersChart)
const totalBattles = useTotalBattles()
const totalBattlesChart = useTotalBattlesChart(showTotalBattlesChart)
const totalScore = useTotalScore()
const totalScoreChart = useTotalScoreChart(showTotalScoreChart)
const hourTotalScoreDelta = useHourTotalScoreDelta()
const yesterdayTotalScoreDelta = useYesterdayTotalScoreDelta()
const todayScoreDelta = useTodayTotalScoreDelta()
const avgDuration = useAvgBattleDuration()
const avgBattleDurationChart = useAvgBattleDurationChart(showDurationChart)
const popularTanks = usePopularTanks()
const scoredTanks = useScoredTanks()
const scoredPopularTanks = useScoredPopularTanks()
const totalWinrate = useTotalWinrate()
const winrateChart = useWinrateChart(showWinrateChart)
const skills = useSkillsHistory()
const crossWinrate = useCrossWinrate()
const crossBattles = useCrossBattleCount()

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
    margin-top: -162px;
    margin-bottom: 20px;
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
      line-height: 1;
    }

    @media screen and (max-width: 900px) {
      margin-top: calc((100vw + 30px) * -0.15 - 20px);

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

  .skills-header {
    display: flex;
    gap: 10px;
    margin-bottom: 30px;

    @media screen and (max-width: 900px) {
      margin-bottom: calc((100vw + 30px) * 0.15 - 110px);
    }

    @media screen and (max-width: 550px) {
      visibility: hidden;
    }

    div {
      flex: 1;
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
  margin-bottom: 15px;
}

.lines {
  div {
    margin-bottom: 20px;
  }

  .top-tanks-filter {
    margin-top: 20px;
    margin-bottom: 0px;
    gap: 0.5em;
    align-items: center;
    line-height: 1.2;

    input {
      cursor: pointer;
    }
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

  code {
    background: #00000040;
    border: 1px solid #8c8c8c40;
    padding: 2px 5px;
    border-radius: 3px;
    font-size: 0.9em;
  }
}
</style>