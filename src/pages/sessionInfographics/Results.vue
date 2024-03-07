<template>
  <h2>Результаты</h2>
  <div class="flex ver results" ref="container">
    <div class="card long">
      <GenericInfo :value="results.count" description="Результатов собрано" color="green" />
    </div>
    <div class="card">
      <p class="card-main-info description top">Распределение по уровню боя</p>
      <TeamLevelTable :params="params" />
    </div>

    <div class="flex hor-ver-small">
      <div class="card chart bar flex-1 flex ver gap-0">
        <MiniBar :data="playerDamageDistribution" color="orange" :labels="places"
          :callbacks="{ title: (t) => `В ${toPercent(t)} боёв вы были топ-${t[0].label} по урону`, label: () => `` }" />
        <p class="card-main-info description">Место по урону</p>
      </div>

      <div class="card chart bar flex-1 flex ver gap-0">
        <MiniBar :data="playerAssistedDistribution" color="orange" :labels="places"
          :callbacks="{ title: (t) => `В ${toPercent(t)} боёв вы были топ-${t[0].label} по насвету`, label: () => `` }" />
        <p class="card-main-info description">Место по насвету</p>
      </div>

      <div class="card chart bar flex-1 flex ver gap-0">
        <MiniBar :data="playerKillDistribution" color="orange" :labels="places"
          :callbacks="{ title: (t) => `В ${toPercent(t)} боёв вы были топ-${t[0].label} по фрагам`, label: () => `` }" />
        <p class="card-main-info description">Место по фрагам</p>
      </div>
    </div>

    <div class="card">
      <PlayerResultTable :params="params" />
    </div>

    <div class="grid-mini">
      <div class="card flex-1">
        <GenericInfo :value="results.hitPerShot" description="Попаданий/Выстрелов" color="green"
          :processor="usePercentProcessor()" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="results.piercingPerHit" description="Пробитий/Попаданий" color="green"
          :processor="usePercentProcessor()" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="results.DR" description="Коэф. урона" color="green" :processor="useFixedProcessor()" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="results.KD" description="Коэф. уничтожения" color="green"
          :processor="useFixedProcessor()" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="results.TR" description="Коэф. исп. брони" color="green"
          :processor="useFixedProcessor()" />
      </div>
    </div>

    <div class="flex hor">
      <div class="select-container">
        <svg viewBox="0 0 65 64" class="dropdown-arrow">
          <path id="Vector 1 (Stroke)" fill-rule="evenodd"
            d="M5.084 20.305a5 5 0 0 1 7.02-.851L31.02 34.276l18.915-14.822a5 5 0 1 1 6.168 7.871l-22 17.24a5 5 0 0 1-6.167 0l-22-17.24a5 5 0 0 1-.852-7.02Z" />
        </svg>
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
        <GenericInfo :value="teamScore(true)" description="Счёт при победе" color="green"
          :processor="t => `${Math.round(t[0])}:${Math.round(t[1])}`" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="teamScore(false)" description="Счёт при поражении" color="red"
          :processor="t => `${Math.round(t[0])}:${Math.round(t[1])}`" />
      </div>
    </div>

    <!-- <h4>Паттерны команд</h4>

    <div class="card">
      <p class="card-main-info description top">Распределение по уровню боя</p>
      <TeamLevelTable :params="params" />
    </div> -->

    <h4>Турбобои</h4>
    <p>Бои длинною менее 5 минут и разницей счёта больше 10 (проигравшая команда имеет не более 4 фрагов)</p>
    <div class="card long">
      <GenericInfo :value="turboResult.count" description="Всего турбобоёв" color="blue" />
    </div>
    <div class="flex hor-ver-small">
      <div class="card flex-1">
        <GenericInfo :value="turboPercent" description="Турбо боёв в среднем" color="blue"
          :processor="usePercentProcessor(1)" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="turboResult.maxTurbo" description="Худшая серия из 10 боёв" mini-data="турбо"
          color="blue" />
      </div>
    </div>

    <div class="flex hor-ver-small">
      <div class="card flex-1">
        <GenericInfo :value="turboResult.avgTurbo" :processor="t => t.toFixed(2)" mini-data="турбы"
          description="В среднем из серии в 10 боёв" color="blue" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="turboResult.minTurbo" description="Лучшая серия из 10 боёв" mini-data="турбо"
          color="blue" />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import GenericInfo from '@/components/widgets/GenericInfo.vue';
import MiniBar from '@/components/widgets/MiniBar.vue';
import { queryAsync, queryAsyncFirst } from "@/db";
import { useElementVisibility, useLocalStorage } from '@vueuse/core';
import { computed, ref } from 'vue';
import { toRelative, toPercent } from "@/utils";
import PlayerResultTable from "@/components/widgets/PlayerResultTable.vue";
import { usePercentProcessor, useFixedProcessor } from '@/composition/usePercentProcessor';
import { useQueryStatParams, whereClause } from '@/composition/useQueryStatParams';
import TeamLevelTable from '@/components/widgets/TeamLevelTable.vue';

const variantSelector = ref<HTMLSelectElement | null>(null);

const container = ref<HTMLElement | null>(null);
const visible = useElementVisibility(container);
const params = useQueryStatParams();

const places = new Array(15).fill(0).map((_, i) => i + 1);

const infoVariant = useLocalStorage<'avg' | 'med' | 'max' | 'q3' | 'q7'>('infoResultsVariant', 'avg')


const resultsList = [
  ['personal.damageDealt', 'damage'],
  ['personal.damageAssistedRadio', 'damageRadio'],
  ['personal.damageAssistedTrack', 'damageTrack'],
  ['personal.stunDuration', 'stunDuration'],
  ['(personal.damageDealt + max2(personal.damageAssistedRadio, personal.damageAssistedTrack))', 'mgSum'],
  ['personal.spotted', 'spotted'],
  ['personal.damageBlockedByArmor', 'damageBlocked'],
  ['personal.shots', 'shots'],
  ['personal.directEnemyHits', 'hits'],
  ['personal.mileage', 'mileage'],
  ['personal.health / personal.maxHealth', 'health']
] as const

const results = queryAsyncFirst(`select 
      ${resultsList.map(t => `avg(${t[0]}) as avg_${t[1]}`).join(',\n')},
      ${resultsList.map(t => `median(${t[0]}) as med_${t[1]}`).join(',\n')},
      ${resultsList.map(t => `max(${t[0]}) as max_${t[1]}`).join(',\n')},
      ${resultsList.map(t => `quantile(0.3)(${t[0]}) as q3_${t[1]}`).join(',\n')},
      ${resultsList.map(t => `quantile(0.7)(${t[0]}) as q7_${t[1]}`).join(',\n')},
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
`, { count: 0, piercingHits: 0, piercingPerHit: 0, hitPerShot: 0, KD: 0, DR: 0, TR: 0 }, visible);

function getValue(param: typeof resultsList[number][1]) {
  if (!results.value) return 0;
  return (results.value as any)[`${infoVariant.value}_${param}`] ?? 0;
}

const scoreResult = queryAsync<{
  result: 'win' | 'lose' | 'tie',
  medianTeam: number,
  medianOpponent: number,
  avgTeam: number,
  avgOpponent: number,
  turbo: number,
}>(`
select result,
       median(playerTeamFrags)   as medTeam,
       median(opponentTeamFrags) as medOpponent,
       avg(playerTeamFrags)      as avgTeam,
       avg(opponentTeamFrags)    as avgOpponent,
       max(playerTeamFrags)      as maxTeam,
       max(opponentTeamFrags)    as maxOpponent,
       quantile(0.3)(playerTeamFrags)      as q3Team,
       quantile(0.3)(opponentTeamFrags)    as q3Opponent,
       quantile(0.7)(playerTeamFrags)      as q7Team,
       quantile(0.7)(opponentTeamFrags)    as q7Opponent,
       toUInt32(countIf(duration < 5 * 60 and abs(opponentTeamFrags - playerTeamFrags) > 10)) as turbo
from (select arrayZip(playersResults.isAlive, playersResults.team)          as aliveTeam,
             arrayFilter(t -> t.2 = playerTeam, aliveTeam)                  as playerTeamAliveList,
             arrayFilter(t -> t.2 != playerTeam, aliveTeam)                 as opponentTeamAliveList,
             length(arrayFilter(t -> t = playerTeam, playersResults.team))  as playerTeamCount,
             length(arrayFilter(t -> t != playerTeam, playersResults.team)) as opponentTeamCount,
             playerTeamCount - arrayCount(t -> t.1, playerTeamAliveList)             as opponentTeamFrags,
             opponentTeamCount - arrayCount(t -> t.1, opponentTeamAliveList)         as playerTeamFrags,
             result                                                                  as result,
             duration                                                                as duration     
      from Event_OnBattleResult
      ${whereClause(params)})
group by result;
`, visible);

const turboResult = queryAsyncFirst(`
select max(countTurbo)    as maxTurbo,
       min(countTurbo)    as minTurbo,
       avg(countTurbo)    as avgTurbo,
       median(countTurbo) as medTurbo,
       sum(isTurbo)       as count
from (select arrayZip(playersResults.isAlive, playersResults.team)                        as aliveTeam,
             arrayFilter(t -> t.2 = playerTeam, aliveTeam)                                as playerTeamAliveList,
             arrayFilter(t -> t.2 != playerTeam, aliveTeam)                               as opponentTeamAliveList,
             length(arrayFilter(t -> t = playerTeam, playersResults.team))                as playerTeamCount,
             length(arrayFilter(t -> t != playerTeam, playersResults.team))               as opponentTeamCount,
             playerTeamCount - arrayCount(t -> t.1, playerTeamAliveList)                  as opponentTeamFrags,
             opponentTeamCount - arrayCount(t -> t.1, opponentTeamAliveList)              as playerTeamFrags,
             duration < 5 * 60 and abs(opponentTeamFrags - playerTeamFrags) > 10          as isTurbo,
             countIf(isTurbo) over (order by id rows between 9 preceding and current row) as countTurbo
      from Event_OnBattleResult
      ${whereClause(params)});`, { count: 0, maxTurbo: 0, avgTurbo: 0, medTurbo: 0, minTurbo: 0 }, visible);

function usePlayerDistribution(value: string) {
  const playerDamageDistribution = queryAsync<{ playerPosition: number, count: number }>(`
select playerPosition, toUInt32(count()) as count
from (select arrayZip(playersResults.name, playersResults.${value}, playersResults.team) as p,
             arrayReverseSort(t -> t.2, arrayFilter(t -> t.3 = playerTeam, p)).1            as playerTeamList,
             indexOf(playerTeamList, playerName)                                            as playerPosition
      from Event_OnBattleResult sample 10000
      ${whereClause(params)})
group by playerPosition;`, visible);

  return computed(() => {
    const countMap = Object.fromEntries(playerDamageDistribution.value.map(r => [r.playerPosition, r.count]))
    return toRelative(places.map((_, i) => countMap[i + 1] ?? 0));
  });
}

const playerDamageDistribution = usePlayerDistribution('damageDealt');
const playerAssistedDistribution = usePlayerDistribution('damageAssistedRadio');
const playerKillDistribution = usePlayerDistribution('kills');


const scoreData = computed(() => Object.fromEntries(scoreResult.value.map(r => [r.result, r])));
const turboPercent = computed(() => results.value.count ? turboResult.value.count / results.value.count : 0);

function teamScore(win: boolean) {
  const t = scoreData.value[win ? 'win' : 'lose'] as any
  return [t?.[`${infoVariant.value}Team`] ?? 0, t?.[`${infoVariant.value}Opponent`] ?? 0];
}
</script>


<style lang="scss" scoped>
@import '@/styles/mixins.scss';
@import '@/styles/textColors.scss';

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