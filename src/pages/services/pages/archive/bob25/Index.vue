<template>
  <div class="bob-results">
    <div class="bloggers" ref="portraits">
      <Blogger blogger="nearyou" />
      <Blogger blogger="lebwa" />
      <Blogger blogger="jove" />
      <Blogger blogger="yusha" />
    </div>

    <div class="sub-header" ref="subHeader" :class="{ 'visible': shouldDisplaySubHeader }"
      :style="{ '--nickname-offset': `${nicknameOffset}px` }">
      <BloggerName :blogger="'nearyou'" />
      <BloggerName :blogger="'lebwa'" />
      <BloggerName :blogger="'jove'" />
      <BloggerName :blogger="'yusha'" />
    </div>

    <div class="lines">
      <div class="card">
        <p>
          Статистика собирается из боёв, в которых <b>хотя бы у одного</b> игрока был установлен мод
          <a href="/install?preset=analytics" target="_blank" rel="noopener noreferrer">WotStat Аналитика</a>.
        </p>
      </div>
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
        <TimeSeriesChart :labels="winrateChart.labels" :data="winrateChart.data" :min="0"
          :processor="t => `${(t * 100).toFixed(2)}%`" :y-values="[0.35, 0.5, 0.65]" y-is-percent smooth-if-need />
        <p class="footnote">*Рекомендуется шаг не менее 10 минут, иначе график шумный</p>
      </template>

      <CrossTable title="Перекрёстный винрейт" :percents="crossTables.winrate" :digits="1" />
      <CrossTable title="Перекрёстное количество боёв" :percents="crossTables.battles" :digits="0" />
      <p class="footnote">
        Читать построчно. То есть, если в строке <b>Near_You</b> и столбце <b>Yusha</b> стоит 13%, это значит, что
        команда <b>Near_You</b> провела 13% боёв против команды <b>Yusha</b>.
      </p>

      <BattlesPerWinrate v-if="playerDistribution.data" :data="playerDistribution.data" />
      <p class="footnote">
        Среди игроков, которые попались в бои с модом более 100 раз
      </p>

      <TopByDamage />
      <p class="footnote">
        Среди боёв, в которых хотя бы один игрок был с модом
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
import { useBackground } from '@/shared/uiKit/pageBackground/useBackground'
import Bob25Background from './Bob25Background.vue'
import Blogger from './components/blogger/Blogger.vue'
import BloggersLine from './components/BloggersLine.vue'
import { useElementBounding, useLocalStorage, useResizeObserver } from '@vueuse/core'
import TopTanks from './components/TopTanks.vue'
import TimeSeriesChart from './components/TimeSeriesChart.vue'
import {
  step, useAvgBattleDuration, useAvgBattleDurationChart, useCrossTables, usePlayerDistribution,
  usePopularTanks, useScoredPopularTanks, useScoredTanks, useTotalBattles, useTotalBattlesChart, useTotalPlayers,
  useTotalPlayersChart, useTotalScore, useTotalScoreChart, useTotalWinrate, useWinrateChart,
} from './components/queryLoader'
import ServerStatusWrapper from '@/pages/infographics/shared/ServerStatusWrapper.vue'
import BloggerName from './components/blogger/BloggerName.vue'
import { computed, ref, watchEffect, useTemplateRef } from 'vue'
import { headerHeight, useAdditionalHeaderHeight } from '@/pages/shared/header/useAdditionalHeaderHeight'
import { displayVariant, preferredLogProcessor } from './store'
import CrossTable from './components/CrossTable.vue'
import BattlesPerWinrate from './components/BattlesPerWinrate.vue'
import TopByDamage from './components/TopByDamage.vue'
import { timeProcessor } from '@/shared/utils/time'



defineOptions({ name: 'BattleOfBloggers2025' })
useBackground(Bob25Background)


const showTotalPlayersChart = useLocalStorage('bob25-show-total-players-chart', false)
const showTotalBattlesChart = useLocalStorage('bob25-show-total-battles-chart', false)
const showTotalScoreChart = useLocalStorage('bob25-show-total-score-chart', true)
const showDurationChart = useLocalStorage('bob25-show-duration-chart', false)
const showWinrateChart = useLocalStorage('bob25-show-winrate-chart', false)
const onlyPopularTanks = useLocalStorage('bob25-only-popular-tanks', false)

const totalScoreDeltaHightFilter = useLocalStorage('bob25-total-score-delta-hight-filter', false)
const totalScoreHightPass = computed(() => totalScoreDeltaHightFilter.value && displayVariant.value === 'delta')
const shouldInterpolateScore = computed(() => displayVariant.value === 'total' && step.value == 'min1')


const portraits = useTemplateRef<HTMLElement>('portraits')
const portraitNickname = computed(() => portraits.value?.querySelector<HTMLElement>('.nickname'))
const subHeader = useTemplateRef<HTMLElement>('subHeader')
const nicknameOffset = ref(0)
useResizeObserver(() => [portraits.value, portraitNickname.value, subHeader.value], () => {
  const row = portraits.value
  const nickname = portraitNickname.value
  const header = subHeader.value
  if (!row || !nickname || !header) return

  const nicknameBounds = nickname.getBoundingClientRect()
  const nicknameCenter = nicknameBounds.top + nicknameBounds.height / 2
  nicknameOffset.value = row.getBoundingClientRect().bottom - nicknameCenter + header.getBoundingClientRect().height / 2
})

const { top: subHeaderTop, height: subHeaderHeight } = useElementBounding(subHeader)
const shouldDisplaySubHeader = computed(() => subHeaderHeight.value > 0 && subHeaderTop.value < headerHeight.value)

const { additionalHeaderHeight } = useAdditionalHeaderHeight()
watchEffect(() => {
  additionalHeaderHeight.value = shouldDisplaySubHeader.value ? subHeaderHeight.value - 5 : 0
})


const totalPlayers = useTotalPlayers()
const totalPlayersChart = useTotalPlayersChart(showTotalPlayersChart)
const totalBattles = useTotalBattles()
const totalBattlesChart = useTotalBattlesChart(showTotalBattlesChart)
const totalScore = useTotalScore()
const totalScoreChart = useTotalScoreChart(showTotalScoreChart)
const avgDuration = useAvgBattleDuration()
const avgBattleDurationChart = useAvgBattleDurationChart(showDurationChart)
const popularTanks = usePopularTanks()
const scoredTanks = useScoredTanks()
const scoredPopularTanks = useScoredPopularTanks()
const totalWinrate = useTotalWinrate()
const winrateChart = useWinrateChart(showWinrateChart)
const crossTables = useCrossTables()
const playerDistribution = usePlayerDistribution()

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
.sub-header {
  position: sticky;
  top: calc(var(--header-height) - 10px);
  display: flex;
  padding: 0 15px;
  margin-top: calc(-1 * var(--nickname-offset));
  margin-bottom: var(--nickname-offset);
  z-index: 10;
  gap: clamp(6px, 2cqw, 16px);
  opacity: 0;
  transition: opacity 0.1s;

  &.visible {
    opacity: 1;
  }

  h2 {
    flex: 1;
    min-width: 0;
    margin: 0;
    text-align: center;
    font-size: clamp(14px, 2.5cqw, 23px);
    line-height: 1;
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


.bloggers {
  display: flex;
  justify-content: space-around;
  max-width: 100%;
  max-height: 400px;
  margin-top: 12px;
  isolation: isolate;

  @media (width > 1100px) {
    :deep(.nickname) {
      transition: opacity 0.1s;
    }

    &:has(+ .sub-header.visible) :deep(.nickname) {
      opacity: 0;
    }
  }
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

  :deep(h3) {
    font-size: 22px;
  }
}

:deep(.card) {
  background: rgb(102 102 102 / 15%);
  box-shadow: none;
}

footer {
  margin: 48px 0 32px;

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
    font-size: 14px;
    white-space: normal;
    overflow-wrap: anywhere;
  }
}
</style>
