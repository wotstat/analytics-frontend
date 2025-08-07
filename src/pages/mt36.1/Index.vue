<template>
  <div class="mt26-1-center-container">
    <div class="background">
      <div class="blue-gradient"></div>
      <div class="green-gradient"></div>
    </div>
    <h1>Сравнительная аналитика<br />обновления 1.36.1</h1>
    <h2 class="description">
      В обновление Мира Танков 1.26.1 были внесены существенные изменения в серверную часть игры. <br> На этой странице
      можно оценить, как эти обновления повлияли на игру.
    </h2>

    <section>
      <h3>Что изменили</h3>
      <ul>
        <li>+- 1-го уровень боёв</li>
        <li>Не больше 2 САУ, 5 ПТ, 2 ЛТ</li>
        <li>Пробитие +/- 15%</li>
        <li>Урон +/- 10%</li>
        <li>Убрали оглушение у САУ</li>
        <li>Уменьшили разброс снарядов в прицеле</li>
      </ul>
    </section>

    <section>
      <h3>Распределение снарядов</h3>

      <div class="info">
        В РАЗРАБОТКЕ. Скоро будет добавлено.
      </div>
    </section>


    <section class="damage-distribution">
      <h3>Распределение урона</h3>

      <div class="controls">
        <div class="line">
          <button @click="selectedPreset = 'target'" :class="{ 'active': selectedPreset == 'target' }">Базовый
            урон</button>
          <button @click="selectedPreset = 'kv2'" :class="{ 'active': selectedPreset == 'kv2' }">КВ2 фугас</button>
          <button @click="selectedPreset = 'fv'" :class="{ 'active': selectedPreset == 'fv' }">FV4005, FV215b
            фугас</button>
          <button @click="selectedPreset = 'grille'" :class="{ 'active': selectedPreset == 'grille' }">Grille
            15</button>
        </div>

        <div class="line" v-if="selectedPreset == 'target'">
          <button v-for="target in possibleTargets" :key="target" @click="selectedTarget = target"
            :class="{ 'active': selectedTarget == target }">{{ target }}</button>
        </div>

        <div class="line" v-if="selectedPreset == 'kv2' || selectedPreset == 'fv'">
          <label>
            <input type="checkbox" v-model="selectedCantKill" />
            Учитывать урон по танкам, которые невозможно было добить выстрелом <i>(ХП цели > 1.25 урона)</i>
          </label>
        </div>
      </div>

      <div class="card flex">
        <div class="chart-container">
          <ShadowLine :data="damageDistributionChartData" :options="damageDistributionOptions" />
        </div>
      </div>
    </section>

    <section>
      <h3>Уровни боёв</h3>
      <LevelSwitcher v-model="selectedLevels" />
      <div class="cards">
        <div class="card">
          <p class="card-main-info description top">{{ leftVersionString }}</p>
          <TeamLevelTable :status="teamLevelTableData.status" :data="leftTeamLevelTableData" />
        </div>
        <div class="card">
          <p class="card-main-info description top">{{ rightVersionString }}</p>
          <TeamLevelTable :status="teamLevelTableData.status" :data="rightTeamLevelTableData" />
        </div>
      </div>
    </section>

    <section class="type-distribution">
      <h3>Распределение типов танков по боям</h3>
      <LevelSwitcher v-model="selectedLevels" />
      <div class="cards">
        <div class="card flex" v-for="chart in typeDistributionData">
          <div class="chart-container flex-1">
            <ShadowBar :data="chart.data" :options="typeDistributionOptions" />
          </div>
          <p class="card-main-info description bottom">{{ chart.chart.label }}</p>
        </div>
      </div>
    </section>

    <footer>

    </footer>

  </div>
</template>


<script setup lang="ts">
import { setFeatureVisit } from '@/components/newFeatureBadge/newFeatureBadge';
import TeamLevelTable from '@/components/widgets/TeamLevelTable.vue';
import { LONG_CACHE_SETTINGS, queryComputed } from '@/db';
import { computed, ref } from 'vue';
import LevelSwitcher from './LevelSwitcher.vue';
import { useDebounce } from '@vueuse/core';
import { ShadowBar } from '@/components/widgets/charts/ShadowBarController';
import { ShadowLine } from '@/components/widgets/charts/ShadowLineController';
import { ChartProps } from 'vue-chartjs';



setFeatureVisit('mt-36-1');


const leftVersions = new Set(['ru_1.36.0']);
const rightVersions = new Set(['ru_1.36.1']);

const selectedLevels = ref(new Set<number>([10]));
const gameVersionFilter = computed(() => {
  return [...leftVersions, ...rightVersions].map(v => `'${v}'`).join(', ');
});

const leftVersionString = [...leftVersions].map(t => t.split('_')[1]).join(', ');
const rightVersionString = [...rightVersions].map(t => t.split('_')[1]).join(', ');

const levelDebounce = useDebounce(selectedLevels)

const teamLevelTableData = queryComputed<{
  battleType: 1 | 2 | 3,
  position: 0 | -1 | -2,
  percent: number,
  gameVersion: string,
}>(() => `
with levelDistribution as
  (
    select 
      visibleLevels,
      tankLevel,
      tankLevel - arrayMax(visibleLevels) as position,
      countMerge(count) as count,
      gameVersion
    from "MT-36-1".BattleLevelDistribution
    where battleMode = 'REGULAR' 
      and region = 'RU' 
      and gameVersion in (${gameVersionFilter.value})
      ${levelDebounce.value.size == 0 ? '' : `and tankLevel in (${[...levelDebounce.value.values()].join(', ')})`} 
    group by visibleLevels, tankLevel, gameVersion
  )
select length(visibleLevels)      as battleType,
       position,
       sum(count)                 as count,
       count / sum(count) over (partition by gameVersion) as percent,
       gameVersion
from levelDistribution
group by battleType, position, gameVersion
order by battleType, position, gameVersion;
`, { settings: LONG_CACHE_SETTINGS })

const leftTeamLevelTableData = computed(() => teamLevelTableData.value.data.filter(item => leftVersions.has(item.gameVersion)));
const rightTeamLevelTableData = computed(() => teamLevelTableData.value.data.filter(item => rightVersions.has(item.gameVersion)));

const byTankTypeDistributionData = queryComputed<{
  type: 'lt' | 'at' | 'spg',
  count: number,
  battles: number,
  gameVersion: string,
}>(() => `
  with
      data as (
          select ltCount, atCount, spgCount, gameVersion
          from Event_OnBattleResult
          where battleMode = 'REGULAR' and region = 'RU' 
          and gameVersion in (${gameVersionFilter.value})
          ${levelDebounce.value.size == 0 ? '' : `and tankLevel in (${[...levelDebounce.value.values()].join(', ')})`} 
      ),
    lt as (select 'lt' as type, ltCount / 2 as count, count() / sum(count()) over (partition by gameVersion) as battles, gameVersion from data where ltCount % 2 = 0 group by ltCount, gameVersion),
    at as (select 'at' as type, atCount / 2 as count, count() / sum(count()) over (partition by gameVersion) as battles, gameVersion from data where atCount % 2 = 0 group by atCount, gameVersion),
    spg as (select 'spg' as type, spgCount / 2 as count, count() / sum(count()) over (partition by gameVersion) as battles, gameVersion from data where spgCount % 2 = 0 group by spgCount, gameVersion)
  select * from lt
  union all select * from at
  union all select * from spg;
`, { settings: LONG_CACHE_SETTINGS })

const typeDistributionData = computed<{ chart: { key: string, label: string }, data: ChartProps<'bar'>['data'] }[]>(() => {
  return [
    { key: 'spg', label: 'САУ' },
    { key: 'at', label: 'ПТ' },
    { key: 'lt', label: 'ЛТ' }
  ].map(chart => {
    const data = byTankTypeDistributionData.value.data.filter(t => t.type == chart.key)
    const targetLabels = [...new Set(data.map(item => item.count)).values()].sort((a, b) => a - b).map(String);

    const left = data.filter(t => leftVersions.has(t.gameVersion));
    const right = data.filter(t => rightVersions.has(t.gameVersion));

    return {
      chart,
      data: {
        labels: targetLabels,
        datasets: [
          {
            label: leftVersionString,
            data: targetLabels.map(label => left.find(t => t.count == Number(label))?.battles || 0),
            backgroundColor: '#4a90e2',
            meta: { label: chart.label }
          },
          {
            label: rightVersionString,
            data: targetLabels.map(label => right.find(t => t.count == Number(label))?.battles || 0),
            backgroundColor: '#50e3c2',
            meta: { label: chart.label }
          },
        ]
      }
    }
  })

})

const typeDistributionOptions = computed<ChartProps<'bar'>['options']>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      display: false,
      min: 0,
    },
    x: {
      grid: { display: false },
      min: 0,
    }
  },
  interaction: {
    mode: 'index'
  },
  plugins: {
    tooltip: {
      callbacks: {
        title: function (context) {
          return `Боёв с ${context[0].label} ${(context[0].chart.data.datasets[0] as any).meta.label} на команду`
        },
        label: function (context) {
          return `${context.dataset.label}: ${(Math.round(context.raw as number * 1000) / 10).toFixed(1)}%`
        }
      }
    }
  }
}))


const possibleTargets = [
  750,
  490,
  440,
  400,
  390,
  360,
  320,
  240,
  135,
  85,
  11,
];
const selectedTarget = ref<number>(390);
const selectedCantKill = ref<boolean>(true);
const selectedPreset = ref<'target' | 'kv2' | 'fv' | 'grille'>('target');
const damageDistributionDataSettings = computed(() => {

  if (selectedPreset.value == 'target') return {
    targetDamage: selectedTarget.value || 390,
    limitDamage: true,
    targetShells: ['ARMOR_PIERCING_CR', 'ARMOR_PIERCING', 'HOLLOW_CHARGE'],
    cantKill: true,
  }

  if (selectedPreset.value == 'kv2') return {
    targetDamage: 910,
    limitDamage: false,
    targetShells: ['HIGH_EXPLOSIVE'],
    targetTank: ['ussr:R77_KV2'],
    cantKill: selectedCantKill.value,
  }

  if (selectedPreset.value == 'fv') return {
    targetDamage: 1750,
    limitDamage: false,
    targetShells: ['HIGH_EXPLOSIVE'],
    targetTank: ['uk:GB83_FV4005', 'uk:GB48_FV215b_183'],
    cantKill: selectedCantKill.value,
  }

  if (selectedPreset.value == 'grille') return {
    targetDamage: 750,
    limitDamage: true,
    targetShells: ['ARMOR_PIERCING_CR', 'ARMOR_PIERCING', 'HOLLOW_CHARGE'],
    targetTank: ['germany:G121_Grille_15_L63'],
    cantKill: true,
  }

  return {
    targetDamage: 1750,
    limitDamage: false,
    targetShells: ['HIGH_EXPLOSIVE'],
  }
})

const damageDistributionData = queryComputed<{
  shotDamage: number;
  count: number;
  percent: number;
  gameVersion: string;
}>(() => {
  const params = damageDistributionDataSettings.value;
  return `
    with
      ${params.targetDamage} as TARGET,
      (${params.targetShells.map(shell => `'${shell}'`).join(', ')}) as TARGET_SHELL
    select shotDamage,
          countMerge(count) as count,
          count / sum(count) over (partition by gameVersion) as percent,
          gameVersion
    from "MT-36-1".ShotDamageDistribution
    where region = 'RU' and battleMode = 'REGULAR' and shotDamage > 0 and not isAmmoBayDestroyed and not isKill
      and shellDamage = TARGET and shellTag in TARGET_SHELL and gameVersion in (${gameVersionFilter.value})
      ${!params.limitDamage ? '' : `and shotDamage >= round(TARGET * 0.75) and shotDamage <= round(TARGET * 1.2501)`}
      ${params.targetTank ? `and tankTag in (${params.targetTank.map(t => `'${t}'`).join(', ')})` : ''}
      ${params.cantKill ? 'and not canKill' : ''}
    group by shotDamage, gameVersion
    order by shotDamage, gameVersion;
`


}, { settings: LONG_CACHE_SETTINGS })

const damageDistributionChartData = computed<ChartProps<'line'>['data']>(() => {

  const data = damageDistributionData.value.data;

  const labels = new Set(data.map(item => item.shotDamage));

  const labelsText = [...labels].sort((a, b) => a - b).map(String);

  const leftData = new Map<string, number>(data.filter(item => leftVersions.has(item.gameVersion)).map(item => [String(item.shotDamage), 100 * item.percent]));
  const rightData = new Map<string, number>(data.filter(item => rightVersions.has(item.gameVersion)).map(item => [String(item.shotDamage), 100 * item.percent]));

  return {
    labels: labelsText,
    datasets: [
      {
        label: leftVersionString,
        data: labelsText.map(label => leftData.get(label) ?? null),
        backgroundColor: '#4a90e2',
        borderColor: '#4a90e200',
        fill: true,
      },
      {
        label: rightVersionString,
        data: labelsText.map(label => rightData.get(label) ?? null),
        backgroundColor: '#50e3c2',
        borderColor: '#50e3c200',
        fill: true,
      }
    ]
  }
})

const damageDistributionOptions = computed<ChartProps<'line'>['options']>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  scales: {
    y: {
      display: false,
      min: 0,
    },
    x: {
      grid: { display: false },
    }
  },
  interaction: {
    intersect: false,
    mode: 'index',
  },
  plugins: {
    tooltip: {
      callbacks: {
        title: function (context) {
          return `Нанесено ${context[0].label} урона`
        },
        label: function (context) {
          return `${context.dataset.label}: ${(Math.round(context.raw as number * 100) / 100).toFixed(2)}%`
        }
      }
    },
    // @ts-ignore
    centerLine: [...new Set(damageDistributionData.value.data.map(item => item.shotDamage)).values()].indexOf(damageDistributionDataSettings.value.targetDamage)
  }
}))

</script>


<style lang="scss" scoped>
.mt26-1-center-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;

  h1 {
    color: white;
    text-align: center;

    @media screen and (max-width: 900px) {
      font-size: 40px;
    }

    @media screen and (max-width: 600px) {
      font-size: 30px;
    }
  }

  h2.description {
    text-align: center;
    margin-top: 20px;
    font-size: 22px;
    line-height: 1.4;
    font-weight: normal;

    @media screen and (max-width: 900px) {
      font-size: 16px;
    }

    @media screen and (max-width: 600px) {
      font-size: 14px;
    }
  }

  .background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    overflow: hidden;

    .blue-gradient {
      position: absolute;
      top: -100vw;
      right: -100vw;
      width: 200vw;
      height: 200vw;
      opacity: 0.1;
      background: radial-gradient(closest-side,
          rgba(0, 115, 255, 1) 0%,
          rgba(0, 115, 255, 0) 100%);
    }

    .green-gradient {
      position: absolute;
      top: 50vw;
      left: -130vw;
      width: 200vw;
      height: 200vw;
      opacity: 0.05;
      background: radial-gradient(closest-side,
          rgb(0, 255, 132) 0%,
          rgba(0, 255, 132, 0) 100%);
    }
  }

  .cards {
    display: flex;
    gap: 1em;
    flex-wrap: wrap;
  }

  .card {
    flex: 1;
    background: rgba(102, 102, 102, 0.15);
    box-shadow: none;
  }

  .levels {
    margin-bottom: 1em;
  }

  .type-distribution {
    .cards {
      display: flex;
      gap: 1em;
      flex-wrap: wrap;

      @media screen and (max-width: 800px) {
        flex-direction: column;
      }

      .card {
        flex-direction: column;
        height: 300px;
        min-height: 300px;
        gap: 0;
      }
    }
  }

  .damage-distribution {

    .card {
      display: flex;
      flex-direction: column;
      aspect-ratio: 2;
    }

    .chart-container {
      flex: 1;
    }

    .controls {
      .line {
        display: flex;
        gap: 0.5em;
        margin-bottom: 1em;

        button {
          background: rgba(102, 102, 102, 0.15);
          box-shadow: none;
          cursor: pointer;
          transition: background-color 0.2s;
          border: none;
          flex: 1;
          border-radius: 15px;

          &:hover {
            background-color: rgba(102, 102, 102, 0.3);
          }

          &.active {
            background-color: #4a90e2;
          }
        }
      }
    }
  }

  section {
    margin-bottom: 2em;

    h3 {
      margin: 0;
      margin-bottom: 0.5em;
    }
  }

  footer {
    margin-top: 30vh;
  }
}
</style>