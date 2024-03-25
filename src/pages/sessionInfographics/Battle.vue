<template>
  <h2 class="page-title">Бои</h2>
  <div class="flex ver battle" ref="container">
    <div class="card long">
      <GenericInfo :status="dataStart.status" :value="dataStart.data.battleCount" :processor="useFixedSpaceProcessor(0)"
        description="Боёв проведено" color="green" />
    </div>
    <div class="flex ver main">
      <div class="grid">
        <div class="card avg-queue">
          <GenericInfo :status="dataStart.status" :value="dataStart.data.avgInQueue"
            description="Среднее время в очереди" color="green" :processor="ms2sec" :mini-processor="secProcessor" />
        </div>

        <div class="card avg-battle">
          <GenericInfo :status="dataResult.status" :value="dataResult.data.duration" description="Среднее время боя"
            color="yellow" :processor="sec2minsec" />
        </div>

        <div class="card winrate pie chart">
          <MniiPie :status="winrateResult.status" :data="winrateData" :color="['green', 'red', 'orange']"
            :labels="['Победы', 'Поражения', 'Ничьи']" :callbacks="{ label: (t) => `${t.formattedValue}%` }" />
          <p class="card-main-info description">Винрейт</p>

        </div>

        <div class="card avg-prebattle">
          <GenericInfo :status="dataStart.status" :value="dataStart.data.avgWaitTime"
            description="Среднее время в ожидании боя" color="blue" :processor="ms2sec"
            :mini-processor="secProcessor" />
        </div>

        <div class="card avg-lifetime">
          <GenericInfo :status="dataResult.status" :value="dataResult.data.lifetime" description="Среднее время жизни"
            color="orange" :processor="sec2minsec" />
        </div>

        <div class="card total-wait">
          <GenericInfo :status="dataStart.status" :value="dataStart.data.waitTime"
            description="Потрачено в ожидании боя" color="red" :processor="sec2hour" mini-data="часа" />
        </div>

        <div class=" card total-play">
          <GenericInfo :status="dataResult.status" :value="dataResult.data.inBattle" description="Потрачено в бою"
            color="red" :processor="sec2hour" mini-data="часа" />
        </div>


        <div class="card u1 chart bar">
          <MiniBar :status="durationResult.status" :data="durationData.p" color="green" :labels="durationData.labels"
            :callbacks="{ title: (t) => `Было ${Math.round((t[0].raw as number) * 100)}% боёв ${Number.parseInt(t[0].label) - 1}-${t[0].label} минут`, label: () => `` }" />
          <p class="card-main-info description">Продолжительность боя</p>
        </div>

        <div class="card chart bar tank-type">
          <MiniBar :status="avgTypeResult.status" :data="avgChart" color="blue" :labels="tankLabels" :callbacks="{
        title: (t) => `В среднем в команде было ${t[0].formattedValue} ${t[0].label}`, label: () => ``
      }" />
          <p class="card-main-info description">Классов танков в командах</p>
        </div>

        <div class="card u2 chart bar">
          <MiniBar :status="durationResult.status" :data="durationData.l" color="yellow" :labels="durationData.labels"
            :callbacks="{ title: (t) => `В боях ${Number.parseInt(t[0].label) - 1}-${t[0].label} минут вы жили ${Math.round(t[0].raw as number * 10) / 10} мин `, label: () => `` }" />
          <p class="card-main-info description">Время жизни по длине боя</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GenericInfo from '@/components/widgets/GenericInfo.vue';
import MiniBar from '@/components/widgets/MiniBar.vue';
import MniiPie from '@/components/widgets/MiniPie.vue';
import { useQueryStatParams, whereClause } from '@/composition/useQueryStatParams';
import { queryAsync, queryAsyncFirst } from "@/db";
import { useElementVisibility } from '@vueuse/core';
import { computed, ref } from 'vue';

import { ms2sec, sec2minsec, secProcessor, sec2hour } from "@/utils";
import { useFixedSpaceProcessor } from '@/composition/usePercentProcessor';

const container = ref<HTMLElement | null>(null);
const visible = useElementVisibility(container);
const params = useQueryStatParams();

const tankLabels = ['СТ', 'ТТ', 'ПТ', 'ЛТ', 'САУ'];

const dataStart = queryAsyncFirst(`
select toUInt32(sum(inQueueWaitTime + loadTime + preBattleWaitTime) / 1000)          as waitTime,
       toUInt32(count(*))                                                            as battleCount,        
       avg(preBattleWaitTime + 
          if(battleTime < 0 and preBattleWaitTime + battleTime < 0, -battleTime, 0)) as avgWaitTime,
       avgIf(inQueueWaitTime, inQueueWaitTime < 300000)                              as avgInQueue
from Event_OnBattleStart
${whereClause(params, { isBattleStart: true })}
`, { waitTime: 0, avgWaitTime: 0, avgInQueue: 0, battleCount: 0 }, visible)

const dataResult = queryAsyncFirst(`
select round(avg(personal.lifeTime))    as lifetime,
       round(avg(duration))             as duration,
       toUInt32(sum(personal.lifeTime)) as inBattle
from Event_OnBattleResult
${whereClause(params)};`, { lifetime: 0, duration: 0, inBattle: 0 }, visible)

const durationResult = queryAsync<{ percent: number, duration: number, lifetime: number }>(`
select duration, lifetime, count / sum(count) over () as percent
from (select ceil(duration / 60)         as duration,
             count(*)                    as count,
             avg(personal.lifeTime) / 60 as lifetime
      from Event_OnBattleResult
      ${whereClause(params)}
      group by duration
      order by duration)`, visible)

const avgTypeResult = queryAsyncFirst(`
with length(playersResults.tankType) as tankCount
select avg(ltCount / tankCount) as LT,
      avg(htCount / tankCount) as HT,
      avg(mtCount / tankCount) as MT,
      avg(atCount / tankCount) as AT,
      avg(spgCount / tankCount) as SPG
from Event_OnBattleResult
${whereClause(params)};
`, { LT: 0, HT: 0, MT: 0, AT: 0, SPG: 0 }, visible)

const winrateResult = queryAsync<{
  count: number, result: 'win' | 'tie' | 'lose'
}>(`select toUInt32(count(*)) as count, result from Event_OnBattleResult ${whereClause(params)} group by result`, visible);

const winrateData = computed(() => {
  const res = {
    win: 0,
    tie: 0,
    lose: 0,
  }

  const { data } = winrateResult.value;

  for (const iterator of data) {
    res[iterator.result] = iterator.count;
  }

  const total = res.win + res.tie + res.lose;
  return [res.win / total, res.lose / total, res.tie / total].map(t => Math.round(t * 10000) / 100);
})

const avgChart = computed(() => {
  const { data: r } = avgTypeResult.value;
  return [r.MT, r.HT, r.AT, r.LT, r.SPG].map(t => t * 30 / 2).map(t => Math.round(t * 100) / 100);
})

const durationData = computed(() => {
  const { data: durations } = durationResult.value;

  const keyed = durations.reduce((prev, curr) => {
    prev[curr.duration] = { p: curr.percent, l: curr.lifetime };
    return prev;
  }, {} as any);

  for (let i = 1; i < 15; i++) {
    if (!(i in keyed)) {
      keyed[i] = { p: 0, l: 0 };
    }
  }

  return {
    labels: Object.keys(keyed),
    p: Object.values(keyed).map((t: any) => t.p),
    l: Object.values(keyed).map((t: any) => t.l),
  }
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
      height: 200px;
      padding: 10px 15px 15px 15px;
    }

    &.pie {
      @include less-small {
        height: 250px;
      }
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