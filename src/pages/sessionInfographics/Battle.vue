<template>
  <div class="flex ver battle">
    <div class="card long">
      <GenericInfo :value="dataStart.battleCount" description="Боёв проведено" color="green" />
    </div>
    <div class="flex ver main">
      <div class="grid">
        <div class="card avg-queue">
          <GenericInfo :value="dataStart.avgInQueue" description="Среднее время в очереди" color="green"
            :processor="ms2sec" mini-data="секунд" />
        </div>

        <div class="card avg-battle">
          <GenericInfo :value="dataResult.duration" description="Среднее время боя" color="yellow"
            :processor="sec2minsec" />
        </div>

        <div class="card winrate pie chart">
          <MniiPie :data="winrateData" :color="['green', 'red', 'orange']" :labels="['Победы', 'Поражения', 'Ничьи']"
            :callbacks="{ label: (t) => `${t.formattedValue}%` }" />
          <p class="card-main-info description">Винрейт</p>

        </div>

        <div class="card avg-prebattle">
          <GenericInfo :value="dataStart.avgWaitTime" description="Среднее время в ожидании боя" color="blue"
            :processor="ms2sec" mini-data="секунд" />
        </div>

        <div class="card avg-lifetime">
          <GenericInfo :value="dataResult.lifetime" description="Среднее время жизни" color="orange"
            :processor="sec2minsec" />
        </div>

        <div class="card total-wait">
          <GenericInfo :value="dataStart.waitTime" description="Потрачено в ожидании боя" color="red"
            :processor="sec2hour" mini-data="часов" />
        </div>

        <div class=" card total-play">
          <GenericInfo :value="dataResult.inBattle" description="Потрачено в бою" color="red" :processor="sec2hour"
            mini-data="часов" />
        </div>


        <div class="card u1">
          <p class="info">Тут пусто, я не придумал график:(</p>
          <!-- <GenericInfo :value="dataResult.lifetime" description="Среднее время жизни" color="green"
            :processor="sec2minsec" /> -->
        </div>

        <div class="card chart bar tank-type">
          <MiniBar :data="avgChart" color="blue" :labels="tankLabels"
            :callbacks="{ title: (t) => `В среднем в команде было ${t[0].formattedValue} ${t[0].label}`, label: () => `` }" />
          <p class="card-main-info description">Распределение танков по классам</p>
        </div>

        <div class="card u2">
          <p class="info">Тут пусто, я не придумал график:(</p>
          <!-- <GenericInfo :value="dataResult.lifetime" description="Среднее время жизни" color="green"
            :processor="sec2minsec" /> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GenericInfo from '@/components/widgets/GenericInfo.vue';
import MiniBar from '@/components/widgets/MiniBar.vue';
import MniiPie from '@/components/widgets/MiniPie.vue';
import { query, queryAsync } from "@/db";
import { computedAsync } from '@vueuse/core';
import { computed } from 'vue';

const ms2sec = (ms: number) => (ms / 1000).toFixed();
const sec2minsec = (sec: number) => `${(sec / 60).toFixed()}:${(sec % 60).toFixed()}`;
const sec2hour = (sec: number) => (sec / 60 / 60).toFixed(1);

const tankLabels = ['MT', 'HT', 'AT', 'LT', 'SPG'];

const dataStart = queryAsync(`
select toUInt32((abs(sumIf(battleTime, battleTime < 0)) +
                 sumIf(preBattleWaitTime, preBattleWaitTime < 30000) +
                 sumIf(loadTime, loadTime < 60000) +
                 sumIf(inQueueWaitTime, inQueueWaitTime < 300000)) / 1000) as waitTime,
       toUInt32(count(*))                                                  as battleCount,        
       avg(preBattleWaitTime) + abs(avgIf(battleTime, battleTime < 0))     as avgWaitTime,
       avgIf(inQueueWaitTime, inQueueWaitTime < 300000)                    as avgInQueue
from Event_OnBattleStart;`, { waitTime: 0, avgWaitTime: 0, avgInQueue: 0, battleCount: 0 })

const dataResult = queryAsync(`
select round(avg(personal.lifeTime))    as lifetime,
       round(avg(duration))             as duration,
       toUInt32(sum(personal.lifeTime)) as inBattle
from Event_OnBattleResult;`, { lifetime: 0, duration: 0, inBattle: 0 })

const chartResult = queryAsync(`
select avg(LT) as avgLT, avg(HT) as avgHT, avg(MT) as avgMT, avg(AT) as avgAT, avg(SPG) as avgSPG
from (select length(playersResults.tankType)                                  as tankCount,
             arrayCount(t -> t == 'LT', playersResults.tankType) / tankCount  as LT,
             arrayCount(t -> t == 'HT', playersResults.tankType) / tankCount  as HT,
             arrayCount(t -> t == 'MT', playersResults.tankType) / tankCount  as MT,
             arrayCount(t -> t == 'AT', playersResults.tankType) / tankCount  as AT,
             arrayCount(t -> t == 'SPG', playersResults.tankType) / tankCount as SPG
      from Event_OnBattleResult);
`, { avgLT: 0, avgHT: 0, avgMT: 0, avgAT: 0, avgSPG: 0 })

const winrateData = computedAsync(async () => {
  const { data } = await query<{ count: number, result: 'win' | 'lose' | 'tie' }>(`select toUInt32(count(*)) as count, result from Event_OnBattleResult group by result`)

  const res = {
    win: 0,
    tie: 0,
    lose: 0,
  }

  for (const iterator of data) {
    res[iterator.result] = iterator.count;
  }

  const total = res.win + res.tie + res.lose;

  console.log(res);


  return [res.win / total, res.lose / total, res.tie / total].map(t => Math.round(t * 10000) / 100);
}, [0, 0, 0])


const avgChart = computed(() => {
  const r = chartResult.value;
  return [r.avgMT, r.avgHT, r.avgAT, r.avgLT, r.avgSPG].map(t => t * 30 / 2).map(t => Math.round(t * 100) / 100);
})
</script>


<style lang="scss" scoped>
@import '@/styles/mixins.scss';

.battle {
  .grid {
    display: grid;
    grid-template-columns: 1fr repeat(2, 0.5fr) 1fr;
    grid-gap: 15px;


    .winrate {
      grid-column: 2 / 4;
      grid-row: 1 / 3;
    }

    .total-wait {
      grid-column: 1 / 3;
    }

    .total-play {
      grid-column: 3 / 5;
    }

    .tank-type {
      grid-column: 2 / 4;
    }

    @include less-medium {
      grid-template-columns: repeat(6, minmax(0, 1fr));

      .winrate {
        grid-column: 1 / 3;
        grid-row: 1 / 3;
      }

      .avg-battle {
        grid-column: 3 / 5;
      }

      .avg-lifetime {
        grid-column: 5 / 7;
      }

      .avg-prebattle {
        grid-column: 5 / 7;
        grid-row: 1;
      }

      .avg-queue {
        grid-column: 3 / 5;
      }

      .total-wait {
        grid-column: 1 / 4;
      }

      .total-play {
        grid-column: 4 / 7;
      }

      .tank-type {
        grid-column: 3 / 5;
      }

      .u1 {
        grid-column: 1 / 3;
      }

      .u2 {
        grid-column: 5 / 7;
      }
    }

    @include less-small {
      grid-template-columns: 1fr;

      .winrate,
      .avg-battle,
      .avg-lifetime,
      .avg-prebattle,
      .avg-queue,
      .total-wait,
      .total-play,
      .tank-type,
      .u1,
      .u2 {
        grid-column: auto;
        grid-row: auto;
      }

      .winrate {
        grid-row: 1;
      }

      .avg-prebattle {
        grid-row: 3;
      }

      .u1 {
        grid-row: 9;
      }
    }
  }

  .chart {
    display: flex;
    flex-direction: column;
    text-align: center;
    padding: 15px;

    &.bar {
      height: 180px;
      padding: 10px 15px 15px 15px;
    }

    &.pie {
      height: 250px;
    }

    &.winrate {
      padding: 0 0 15px 0;

      .description {
        margin-top: -10px;
      }
    }

  }
}
</style>