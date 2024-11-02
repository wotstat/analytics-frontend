<template>
  <h2 class="page-title">Результаты</h2>

  <div class="flex ver results" ref="container">
    <div class="card long">
      <GenericInfo :status="resultsInfo.status" :value="resultsInfo.data.count" :processor="useFixedSpaceProcessor(0)"
        description="Результатов собрано" color="green" />
    </div>
    <div class="card">
      <p class="card-main-info description top">Распределение по уровню боя</p>
      <TeamLevelTable :params="params" />
    </div>

    <div class="flex hor-ver-small">
      <div class="card chart bar flex-1 flex ver gap-0">
        <MiniBar :status="playerDamageDistribution.status" :data="playerDamageDistribution.data" color="orange"
          :labels="places"
          :callbacks="{ title: t => `В ${toPercent(t, 1)} боёв вы были топ-${t[0].label} по урону`, label: () => ``, afterBody: positionChartAfterBody(playerDamageDistribution) }" />
        <p class="card-main-info description">Место по урону</p>
      </div>

      <div class="card chart bar flex-1 flex ver gap-0">
        <MiniBar :status="playerAssistedDistribution.status" :data="playerAssistedDistribution.data" color="orange"
          :labels="places"
          :callbacks="{ title: (t) => `В ${toPercent(t, 1)} боёв вы были топ-${t[0].label} по насвету`, label: () => ``, afterBody: positionChartAfterBody(playerAssistedDistribution) }" />
        <p class="card-main-info description">Место по насвету</p>
      </div>

      <div class="card chart bar flex-1 flex ver gap-0">
        <MiniBar :status="playerKillDistribution.status" :data="playerKillDistribution.data" color="orange"
          :labels="places"
          :callbacks="{ title: (t) => `В ${toPercent(t, 1)} боёв вы были топ-${t[0].label} по фрагам`, label: () => ``, afterBody: positionChartAfterBody(playerKillDistribution) }" />
        <p class="card-main-info description">Место по фрагам</p>
      </div>
    </div>

    <div class="card">
      <PlayerResultTable :params="params" />
    </div>

    <div class="grid-mini">
      <div class="card flex-1">
        <GenericInfo :status="resultsInfo.status" :value="resultsInfo.data.hitPerShot" description="Попаданий/Выстрелов"
          color="green" :processor="usePercentProcessor()" />
      </div>
      <div class="card flex-1">
        <GenericInfo :status="resultsInfo.status" :value="resultsInfo.data.piercingPerHit"
          description="Пробитий/Попаданий" color="green" :processor="usePercentProcessor()" />
      </div>
      <div class="card flex-1">
        <GenericInfo :status="resultsInfo.status" :value="resultsInfo.data.DR" description="Коэф. урона" color="green"
          :processor="useFixedProcessor()" />
      </div>
      <div class="card flex-1">
        <GenericInfo :status="resultsInfo.status" :value="resultsInfo.data.KD" description="Коэф. уничтожения"
          color="green" :processor="useFixedProcessor()" />
      </div>
      <div class="card flex-1">
        <GenericInfo :status="resultsInfo.status" :value="resultsInfo.data.TR" description="Коэф. исп. брони"
          color="green" :processor="useFixedProcessor()" />
      </div>
    </div>

    <div class="flex hor">
      <div class="select-container">
        <ArrowDownIcon class="dropdown-arrow" />
        <select class="h4" v-model="infoVariant" ref="variantSelector">
          <option value="avg">Средние показатели</option>
          <option value="max">Максимальные показатели</option>
          <option value="q3">Квантиль 30</option>
          <option value="med">Медианные показатели</option>
          <option value="q7">Квантиль 70</option>
        </select>
      </div>
    </div>
    <p v-if="infoVariant == 'med'">В половине боёв показатели были меньше</p>
    <p v-else-if="infoVariant == 'q3'">В 30% боёв показатели были меньше</p>
    <p v-else-if="infoVariant == 'q7'">В 30% боёв показатели были больше</p>
    <!-- <h4>Средние показатели</h4> -->
    <div class="grid-mini">
      <div class="card flex-1">
        <GenericInfo :value="getValue('damage')" description="Урон" color="yellow" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="getValue('damageRadio')" description="Насвет" color="yellow" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="getValue('damageTrack')" description="Ассист" color="yellow" />
      </div>
      <!-- <div class="card flex-1">
        <GenericInfo :value="getValue('stunDuration')" description="Время стана" color="yellow" />
      </div> -->
      <div class="card flex-1">
        <GenericInfo :value="getValue('mgSum')" description="Сумма отметки" color="yellow" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="getValue('spotted')" :processor="useFixedProcessor(1)" description="Обнаруженных"
          color="yellow" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="getValue('damageBlocked')" description="Натанкованно" color="yellow" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="getValue('shots')" description="Выстрелов" color="yellow" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="getValue('hits')" description="Попаданий" color="yellow" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="getValue('mileage')" description="Дистанция" color="yellow" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="getValue('health')" :processor="usePercentProcessor()" description="ХП остаётся"
          color="yellow" />
      </div>
    </div>

    <div class="flex hor-ver-small">
      <div class="card flex-1">
        <GenericInfo :status="functionalResults.status" :value="teamScore(true)" description="Счёт при победе"
          color="green" :processor="t => `${Math.round(t[0])}:${Math.round(t[1])}`" />
      </div>
      <div class="card flex-1">
        <GenericInfo :status="functionalResults.status" :value="teamScore(false)" description="Счёт при поражении"
          color="red" :processor="t => `${Math.round(t[0])}:${Math.round(t[1])}`" />
      </div>
    </div>

    <template v-if="params.player">
      <h4 ref="turboContainer">Турбобои</h4>
      <p>Бои длинною менее 5 минут и разницей счёта больше 10 (проигравшая команда имеет не более 4 фрагов)</p>
      <div class="card long">
        <GenericInfo :status="turboResult.status" :value="turboResult.data.count" :processor="useFixedSpaceProcessor(0)"
          description="Всего турбобоёв" color="blue" />
      </div>
      <div class="flex hor-ver-small">
        <div class="card flex-1">
          <GenericInfo :status="mergeStatuses(resultsInfo.status, turboResult.status)" :value="turboPercent"
            description="Турбо боёв в среднем" color="blue" :processor="usePercentProcessor(1)" />
        </div>
        <div class="card flex-1">
          <GenericInfo :status="turboResult.status" :value="turboResult.data.maxTurbo"
            description="Худшая серия из 10 боёв" mini-data="турбо" color="blue" />
        </div>
      </div>

      <div class="flex hor-ver-small">
        <div class="card flex-1">
          <GenericInfo :status="turboResult.status" :value="turboResult.data.avgTurbo" :processor="t => t.toFixed(2)"
            mini-data="турбы" description="В среднем из серии в 10 боёв" color="blue" />
        </div>
        <div class="card flex-1">
          <GenericInfo :status="turboResult.status" :value="turboResult.data.minTurbo"
            description="Лучшая серия из 10 боёв" mini-data="турбо" color="blue" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import GenericInfo from '@/components/widgets/GenericInfo.vue';
import MiniBar from '@/components/widgets/MiniBar.vue';
import { LONG_CACHE_SETTINGS, Status, mergeStatuses, queryAsync, queryAsyncFirst, queryComputed } from "@/db";
import { useElementVisibility, useLocalStorage } from '@vueuse/core';
import { computed, ref } from 'vue';
import { toRelative, toPercent } from "@/utils";
import PlayerResultTable from "@/components/widgets/PlayerResultTable.vue";
import { usePercentProcessor, useFixedProcessor, useFixedSpaceProcessor } from '@/composition/usePercentProcessor';
import { useQueryStatParams, useQueryStatParamsCache, whereClause } from '@/composition/useQueryStatParams';
import TeamLevelTable from '@/components/widgets/TeamLevelTable.vue';
import { countLocalize } from '@/utils/i18n';
import { TooltipItem } from 'chart.js';
import ArrowDownIcon from '@/assets/icons/arrow-down.svg'

const variantSelector = ref<HTMLSelectElement | null>(null);

const container = ref<HTMLElement | null>(null);
const enabled = useElementVisibility(container);

const turboContainer = ref<HTMLElement | null>(null);
const turboVisible = useElementVisibility(turboContainer);

const params = useQueryStatParams()
const settings = useQueryStatParamsCache(params)

const places = new Array(15).fill(0).map((_, i) => i + 1);

const infoVariant = useLocalStorage<'avg' | 'med' | 'max' | 'q3' | 'q7'>('infoResultsVariant', 'avg')
const positionChartAfterBody = (distribution: any) => (t: TooltipItem<'bar'>[]) => `${distribution.absolute[t[0].dataIndex]} ${countLocalize(distribution.absolute[t[0].dataIndex], 'бой', 'боя', 'боёв')}`

const resultsList = [
  ['personal.damageDealt', 'damage'],
  ['personal.damageAssistedRadio', 'damageRadio'],
  ['personal.damageAssistedTrack', 'damageTrack'],
  ['personal.stunDuration', 'stunDuration'],
  ['gunMarkSum', 'mgSum'],
  ['personal.spotted', 'spotted'],
  ['personal.damageBlockedByArmor', 'damageBlocked'],
  ['personal.shots', 'shots'],
  ['personal.directEnemyHits', 'hits'],
  ['personal.mileage', 'mileage'],
  ['personal.health / personal.maxHealth', 'health']
] as const


const functionByInfo = {
  'avg': (shouldIf = false) => `avg${shouldIf ? 'If' : ''}`,
  'med': (shouldIf = false) => `median${shouldIf ? 'If' : ''}`,
  'max': (shouldIf = false) => `max${shouldIf ? 'If' : ''}`,
  'q3': (shouldIf = false) => `quantile${shouldIf ? 'If' : ''}(0.3)`,
  'q7': (shouldIf = false) => `quantile${shouldIf ? 'If' : ''}(0.7)`,
} as const

const functionalResults = queryComputed<{
  [K in typeof resultsList[number][1]]: number
} & {
  enemyFragsWin: number,
  allyFragsWin: number,
  enemyFragsLose: number,
  allyFragsLose: number
}>(() => {

  const fn = functionByInfo[infoVariant.value]
  return `
  select 
  ${resultsList.map(t => `${fn()}(${t[0]}) as ${t[1]}`).join(',\n')},
  ${fn(true)}(allyTeamCount - allyTeamSurvivedCount, result = 'win') as enemyFragsWin,
  ${fn(true)}(enemyTeamCount - enemyTeamSurvivedCount, result = 'win') as allyFragsWin,
  ${fn(true)}(allyTeamCount - allyTeamSurvivedCount, result = 'lose') as enemyFragsLose,
  ${fn(true)}(enemyTeamCount - enemyTeamSurvivedCount, result = 'lose') as allyFragsLose
  from Event_OnBattleResult
  ${whereClause(params)}
`}, { settings: settings.value })

const resultsInfo = queryAsyncFirst(`select 
       avg(personal.piercingEnemyHits)           as piercingHits,
       sum(personal.directEnemyHits)             as sumDirect,
       sum(personal.shots)                       as sumShots,
       sum(personal.piercingEnemyHits)           as sumPiercing,
       sum(personal.damageDealt)                 as sumDealt,
       sum(personal.maxHealth - personal.health) as sumReach,
       sum(personal.kills)                       as sumKills,
       sum(personal.damageBlockedByArmor)        as sumTank,
       countIf(not personal.isAlive)             as sumDeath,
       sumDirect / sumShots                      as hitPerShot,
       sumPiercing / sumDirect                   as piercingPerHit,
       sumDealt / sumReach                       as DR,
       sumKills / sumDeath                       as KD,
       sumTank / sumReach                        as TR,
       toUInt32(count())                         as count
from Event_OnBattleResult
${whereClause(params)};
`, { count: 0, piercingHits: 0, piercingPerHit: 0, hitPerShot: 0, KD: 0, DR: 0, TR: 0 }, { enabled, settings: settings.value });

function getValue(param: typeof resultsList[number][1] | 'enemyFragsWin' | 'allyFragsWin' | 'enemyFragsLose' | 'allyFragsLose') {
  return { data: functionalResults.value.data[0]?.[param] ?? 0, status: functionalResults.value.status as Status };
}

const turboResult = queryAsyncFirst(`
select max(countTurbo)    as maxTurbo,
       min(countTurbo)    as minTurbo,
       avg(countTurbo)    as avgTurbo,
       median(countTurbo) as medTurbo,
       sum(isTurbo)       as count
from (select allyTeamCount - allyTeamSurvivedCount                               as opponentTeamFrags,
             enemyTeamCount - enemyTeamSurvivedCount                             as playerTeamFrags,
             duration < 5 * 60 and abs(opponentTeamFrags - playerTeamFrags) > 10 as isTurbo,
             countIf(isTurbo) over (partition by playerName order by playerName, id rows between 9 preceding and current row) as countTurbo
      from Event_OnBattleResult
      ${whereClause(params)});`, { count: 0, maxTurbo: 0, avgTurbo: 0, medTurbo: 0, minTurbo: 0 }, { enabled: turboVisible, settings: params.value.player ? {} : { ...LONG_CACHE_SETTINGS, query_cache_ttl: 3600 } });

function usePlayerDistribution(value: 'Damage' | 'Radio' | 'Kills') {
  const result = queryAsync<{ playerPosition: number, count: number }>(`
  select playerTeamPositionBy${value} as playerPosition, toUInt32(count()) as count
  from Event_OnBattleResult
  ${whereClause(params)}
  group by playerPosition;`, { enabled, settings: settings.value });

  return computed(() => {
    const countMap = Object.fromEntries(result.value.data.map(r => [r.playerPosition, r.count]))
    const absolute = places.map((_, i) => countMap[i] ?? 0);
    return { status: result.value.status as Status, data: toRelative(absolute), absolute };
  });
}

const playerDamageDistribution = usePlayerDistribution('Damage');
const playerAssistedDistribution = usePlayerDistribution('Radio');
const playerKillDistribution = usePlayerDistribution('Kills');


const turboPercent = computed(() => resultsInfo.value.data.count ? turboResult.value.data.count / resultsInfo.value.data.count : 0);

function teamScore(win: boolean) {
  const res = functionalResults.value.data[0]
  if (!res) return [0, 0]

  const left = win ? res.allyFragsWin : res.allyFragsLose
  const right = win ? res.enemyFragsWin : res.enemyFragsLose
  return [left, right]
}
</script>


<style lang="scss" scoped>
@use '/src/styles/mixins.scss' as *;
@use '/src/styles/variables.scss' as *;
@use '/src/styles/textColors.scss';

h4 {
  margin: 10px 0 0 0;
}

.select-container {
  select.h4 {
    appearance: none;
    -webkit-appearance: none;
    border: none;
    background: none;
    padding: 0;
    margin: 0;
    padding-left: 25px;
    padding-right: 25px;
    font-size: 17px;
    font-weight: var(--medium-bold-weight);
    color: inherit;

    option {
      color: var(--font-color);
      background-color: $background-secondary;
    }
  }

  .dropdown-arrow {
    pointer-events: none;
    fill: var(--font-color);
    height: 12px;
    margin-right: -20px;
  }
}

.grid-mini {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-gap: 15px;

  @include less-medium {
    grid-template-columns: 1fr 1fr;
  }

  @include less-x-small {
    grid-template-columns: 1fr;
  }
}

.card.chart {
  text-align: center;
}

.flex {
  .chart.bar {
    height: 200px;

    &.team {
      height: 400px;
    }
  }
}

.hor-ver-small {
  .chart {
    @include less-small {
      min-height: 200px;
    }
  }
}
</style>