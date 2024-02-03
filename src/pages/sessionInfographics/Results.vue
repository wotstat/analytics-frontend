<template>
  <div class="flex ver results" ref="container">
    <div class="card long">
      <GenericInfo :value="results.count" description="Результатов собрано" color="green" />
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

    <h4>Медианные показатели</h4>
    <div class="grid-mini">
      <div class="card flex-1">
        <GenericInfo :value="results.damage" description="Урон" color="yellow" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="results.damageRadio" description="Насвет" color="yellow" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="results.damageTrack" description="Ассист" color="yellow" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="results.stunDuration" description="Время стана" color="yellow" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="results.spotted" description="Обнаруженных" color="yellow" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="results.damageBlacked" description="Натанкованно" color="yellow" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="results.shots" description="Выстрелов" color="yellow" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="results.hits" description="Попаданий" color="yellow" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="results.mileage" description="Дистанция" color="yellow" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="results.health" description="ХП остаётся" color="yellow" />
      </div>
    </div>

    <div class="flex hor-ver-small">
      <div class="card flex-1">
        <GenericInfo :value="[scoreData['win']?.medianTeam ?? 0, scoreData['win']?.medianOpponent ?? 0]"
          description="Счёт при победе" color="green" :processor="t => `${Math.round(t[0])}:${Math.round(t[1])}`" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="[scoreData['lose']?.medianTeam ?? 0, scoreData['lose']?.medianOpponent ?? 0]"
          description="Счёт при поражении" color="red" :processor="t => `${Math.round(t[0])}:${Math.round(t[1])}`" />
      </div>
    </div>


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
        <GenericInfo :value="turboResult.maxTurbo" description="Худшая серия из 10 боёв" mini-data="турбо" color="blue" />
      </div>
    </div>

    <div class="flex hor-ver-small">
      <div class="card flex-1">
        <GenericInfo :value="turboResult.avgTurbo" :processor="t => t.toFixed(2)" mini-data="турбы"
          description="В среднем из серии в 10 боёв" color="blue" />
      </div>
      <div class="card flex-1">
        <GenericInfo :value="turboResult.minTurbo" description="Лучшая серия из 10 боёв" mini-data="турбо" color="blue" />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import GenericInfo from '@/components/widgets/GenericInfo.vue';
import MiniBar from '@/components/widgets/MiniBar.vue';
import { queryAsync, queryAsyncFirst } from "@/db";
import { useElementVisibility } from '@vueuse/core';
import { computed, ref } from 'vue';
import { toRelative, toPercent } from "@/utils";
import PlayerResultTable from "@/components/widgets/PlayerResultTable.vue";
import { usePercentProcessor } from '@/composition/usePercentProcessor';
import { useQueryStatParams, whereClause } from '@/composition/useQueryStatParams';

const container = ref<HTMLElement | null>(null);
const visible = useElementVisibility(container);
const params = useQueryStatParams();

const places = new Array(15).fill(0).map((_, i) => i + 1);

const results = queryAsyncFirst(`
select median(personal.damageDealt)                 as damage,
       median(personal.damageAssistedRadio)         as damageRadio,
       median(personal.damageAssistedTrack)         as damageTrack,
       median(personal.stunDuration)                as stunDuration,
       median(personal.spotted)                     as spotted,
       median(personal.damageBlockedByArmor)        as damageBlacked,
       median(personal.shots)                       as shots,
       median(personal.directEnemyHits)             as hits,
       median(personal.piercingEnemyHits)           as piercingHits,
       median(personal.mileage)                     as mileage,
       median(personal.health / personal.maxHealth) as health,
       toUInt32(count())                            as count
from Event_OnBattleResult
${whereClause(params)};
`, { count: 0, damage: 0, damageRadio: 0, damageTrack: 0, stunDuration: 0, spotted: 0, damageBlacked: 0, shots: 0, hits: 0, piercingHits: 0, mileage: 0, health: 0, },
  visible);

const scoreResult = queryAsync<{
  result: 'win' | 'lose' | 'tie',
  medianTeam: number,
  medianOpponent: number,
  avgTeam: number,
  avgOpponent: number,
  turbo: number,
}>(`
select result,
       median(playerTeamFrags)   as medianTeam,
       median(opponentTeamFrags) as medianOpponent,
       avg(playerTeamFrags)      as avgTeam,
       avg(opponentTeamFrags)    as avgOpponent,
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
      from Event_OnBattleResult
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
</script>


<style lang="scss" scoped>
@import '@/styles/mixins.scss';

h4 {
  margin: 10px 0 0 0;
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