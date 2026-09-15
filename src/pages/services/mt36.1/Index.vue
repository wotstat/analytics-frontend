<template>
  <div class="mt26-1-center-container">
    <div class="background">
      <div class="blue-gradient"></div>
      <div class="green-gradient"></div>
    </div>
    <h1>Сравнительная аналитика<br />версий игры</h1>

    <h2 class="description">
      На этой странице вы можете сравнить различные версии игры, чтобы понять, как изменения в серверной части повлияли
      на игровой процесс.
    </h2>

    <details class="collapsible-menu">
      <summary class="menu-trigger">Что было в Мир Танков 1.36.1</summary>
      <div class="menu-content">
        <p>
          В обновление Мира Танков 1.36.1 были внесены существенные изменения в серверную часть игры:
        </p>
        <ul>
          <li>+- 1-го уровень боёв</li>
          <li>Не больше 2 САУ, 5 ПТ, 2 ЛТ</li>
          <li>Пробитие +/- 15%</li>
          <li>Урон +/- 10%</li>
          <li>Убрали оглушение у САУ</li>
          <li>Уменьшили разброс снарядов в прицеле</li>
        </ul>
      </div>
    </details>

    <section class="select-version">
      <h3>Выбор версий</h3>
      <div class="selector-vs">
        <div class="version-select">
          Группа №1:
          <GameVersionSelectorBadges v-model="modelLeftVersions" with-region :show-minor="false" :show-versions="false"
            class="badges" />
        </div>
        <div class="vr"></div>
        <div class="version-select">
          Группа №2:
          <GameVersionSelectorBadges v-model="modelRightVersions" with-region :show-minor="false" :show-versions="false"
            class="badges" />
        </div>
      </div>
    </section>


    <section class="ballistic-distribution">
      <h3>Распределение снарядов</h3>
      <div class="line">
        <label>
          <input type="checkbox" v-model="ballisticDistributionIdeal" />
          Учитывать выстрелы только в идеальных условиях (полное сведение, неподвижный танк, стрельба на 100+ метров,
          пинг менее 100 мс)
        </label>
      </div>

      <div class="line">
        <p>
          Всего выстрелов:
          <b>
            {{spaceProcessor(ballisticDistributionData.data.reduce((acc, item) => acc + item.c, 0).toString())}}
          </b>
        </p>
        <p>На картинках прицела по <b>20 000</b> реальных выстрелов. Количество выстрелов одинаковое.</p>
        <p>При использовании <b>не идеальных условий</b> возникают погрешности связанные с
          рассинхронизацией клиента и сервера. Резкие перепады графика сглаживаются <i>нормальным</i> распределением
          погрешности</p>
      </div>

      <div class="line charts">
        <div class="left">
          <div class="card flex">
            <div class="ballistic-chart-container">
              <div class="chart-options">
                <div class="line">
                  <DropDown
                    :variants="[{ value: 'cdf', label: 'CDF - распределение' }, { value: 'pdf', label: 'PDF - плотность вероятности' }]"
                    v-model="distributionVariant" />
                </div>
              </div>
              <BallisticDistributionChart :rows="ballisticDistributionData.data" :left-versions="leftVersions"
                :right-versions="rightVersions" :left-label="leftVersionString" :right-label="rightVersionString"
                :variant="distributionVariant" @hover:progress="lastHover = $event" />
            </div>
          </div>
        </div>

        <div class="right">
          <div class="card">
            <ShotsCircle :mask-radius="ballisticCircleMask" :limit-shot="20000" :borderColor="'#4a90e2'"
              :load-next-batch="loadNextBatchLeft" :key="leftVersionString" />
            <p class="card-main-info description bottom">{{ leftVersionString }}</p>
          </div>
          <div class="card">
            <ShotsCircle :mask-radius="ballisticCircleMask" :limit-shot="20000" :borderColor="'#50e3c2'"
              :load-next-batch="loadNextBatchRight" :key="rightVersionString" />
            <p class="card-main-info description bottom">{{ rightVersionString }}</p>
          </div>
        </div>
      </div>

      <div class="line flex">
        <CompareCard :min-step="0.01" :processor="percent" :title="'Процент попаданий'"
          :left="hitPercents.data.find(item => leftVersions.has(item.gameVersion))?.hitPercent ?? 0"
          :right="hitPercents.data.find(item => rightVersions.has(item.gameVersion))?.hitPercent ?? 0" />

        <CompareCard :min-step="0.01" :processor="percent" :title="'Пробитий относительно попаданий'"
          :left="hitPercents.data.find(item => leftVersions.has(item.gameVersion))?.piercingPercent ?? 0"
          :right="hitPercents.data.find(item => rightVersions.has(item.gameVersion))?.piercingPercent ?? 0" />
      </div>
    </section>

    <section class="type-distribution">
      <h3>Продолжительность боя</h3>
      <div class="cards">
        <div class="card flex">
          <div class="comparison-chart-container flex-1">
            <ComparisonBarChart :data="durationByLevelChartData" :left-label="leftVersionString"
              :right-label="rightVersionString" :tooltip-title="levelTooltipTitle" :value-formatter="sec2minsec"
              :y-label-formatter="sec2minsec" :y-steps="[60]" :min-y="4 * 60" show-y-labels />
          </div>
          <p class="card-main-info description bottom">Среднее время боя по уровню</p>
        </div>

        <div class="card flex">
          <div class="comparison-chart-container flex-1">
            <ComparisonBarChart :data="durationDistributionChartData" :left-label="leftVersionString"
              :right-label="rightVersionString" :tooltip-title="durationTooltipTitle" :value-formatter="percent" />
          </div>
          <div class="card-main-info description bottom">Распределение боёв по продолжительности на
            <DropDown class="dropdown-container mt-font" v-model="durationSelectedLevel"
              :variants="new Array(11).fill(0).map((_, i) => ({ value: i + 1, label: romanNumberProcessor(i + 1) }))" />
            уровне
          </div>
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
        <div class="card flex" v-for="chart in typeDistributionData" :key="chart.chart.key">
          <div class="comparison-chart-container flex-1">
            <ComparisonBarChart :data="chart.data" :left-label="leftVersionString" :right-label="rightVersionString"
              :tooltip-title="label => typeDistributionTooltipTitle(label, chart.chart.label)"
              :value-formatter="distributionPercent" />
          </div>
          <p class="card-main-info description bottom">{{ chart.chart.label }}</p>
        </div>
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
          <!-- <button @click="selectedPreset = 'FSDS420'" :class="{ 'active': selectedPreset == 'FSDS420' }">БОПС
            420</button> -->
        </div>

        <div class="line" v-if="selectedPreset == 'target'">
          <button v-for="target in possibleTargets" :key="target" @click="selectedTarget = target"
            :class="{ 'active': selectedTarget == target }">{{ target }}</button>
        </div>

        <div class="line" v-if="selectedPreset == 'kv2' || selectedPreset == 'fv' || selectedPreset == 'FSDS420'">
          <label>
            <input type="checkbox" v-model="selectedCantKill" />
            Учитывать урон по танкам, которые невозможно было добить выстрелом <i>(ХП цели > 1.25 урона)</i>
          </label>
        </div>
      </div>

      <div class="card flex">
        <div class="damage-chart-container">
          <div class="chart-options">
            <div class="line">
              <p>Шаг урона:</p>
              <DropDown :variants="stepVariants" v-model="damageStep" />
            </div>
          </div>
          <DamageDistributionChart :data="damageDistributionChartData" :left-label="leftVersionString"
            :right-label="rightVersionString" :damage-step="damageStep" />
        </div>
      </div>
    </section>

    <section class="type-distribution">
      <h3>Другое</h3>
      <div class="cards">
        <div class="card flex">
          <div class="comparison-chart-container flex-1">
            <ComparisonBarChart :data="averageSpgDamageChartData" :left-label="leftVersionString"
              :right-label="rightVersionString" :tooltip-title="levelTooltipTitle" :value-formatter="roundedSpace"
              :y-label-formatter="spaceProcessor" show-y-labels show-delta />
          </div>
          <p class="card-main-info description bottom">Средний урон САУ</p>
        </div>

        <div class="card flex">
          <div class="comparison-chart-container flex-1">
            <ComparisonBarChart :data="averageLtAssistChartData" :left-label="leftVersionString"
              :right-label="rightVersionString" :tooltip-title="levelTooltipTitle" :value-formatter="roundedSpace"
              :y-label-formatter="spaceProcessor" show-y-labels show-delta />
          </div>
          <div class="card-main-info description bottom">Средний насвет ЛТ</div>
        </div>
      </div>
    </section>


    <footer>

    </footer>

  </div>
</template>


<script setup lang="ts">
import { setFeatureVisit } from '@/shared/uiKit/newFeatureBadge/newFeatureBadge'
import TeamLevelTable from '@/pages/infographics/shared/widgets/TeamLevelTable.vue'
import { CACHE_SETTINGS, LONG_CACHE_SETTINGS, query, queryComputed } from '@/db'
import { computed, onUnmounted, ref, watch, watchEffect } from 'vue'
import LevelSwitcher from './LevelSwitcher.vue'
import { refDebounced, useDebounce } from '@vueuse/core'

import DropDown from '@/shared/uiKit/dropdown/DropDown.vue'
import ShotsCircle from '@/pages/infographics/shared/widgets/ShotsCircle.vue'
import { spaceProcessor } from '@/shared/utils/processors/useSpaceProcessor'
import { roundProcessor, createPercentProcessor, romanNumberProcessor } from '@/shared/utils/processors/processors'
import CompareCard from './CompareCard.vue'
import { sec2minsec } from '@/shared/utils/time'
import GameVersionSelectorBadges from '@/shared/game/selectors/gameVersionSelector/GameVersionSelectorBadges.vue'
import { OptionalRegionVersion } from '@/shared/game/selectors/gameVersionSelector/utils.ts'
import { useRoute, useRouter } from 'vue-router'
import BallisticDistributionChart from './charts/BallisticDistributionChart.vue'
import ComparisonBarChart from './charts/ComparisonBarChart.vue'
import type { ComparisonBarChartData } from './charts/ComparisonBarChart'
import DamageDistributionChart from './charts/DamageDistributionChart.vue'
import type { DamageDistributionChartData } from './charts/DamageDistributionChart'

setFeatureVisit('mt-36-1')

const route = useRoute()
const router = useRouter()

function parseVersionQuery(value: unknown): Set<OptionalRegionVersion> | null {
  const queryValue = Array.isArray(value) ? value[0] : value
  if (typeof queryValue !== 'string') return null

  const versions = new Set<OptionalRegionVersion>()
  for (const value of queryValue.split(',')) {
    const match = value.match(/^([a-z]+)_(\d+(?:-\d+)*)$/i)
    if (!match) continue

    versions.add({
      region: match[1].toUpperCase(),
      version: match[2].replaceAll('-', '.'),
    })
  }

  return versions
}

function serializeVersions(versions: Set<OptionalRegionVersion>): string {
  return [...versions]
    .filter(version => version.region)
    .map(version => `${version.region!.toLowerCase()}_${version.version.replaceAll('.', '-')}`)
    .join(',')
}

function updateVersionQuery() {
  const query = { ...route.query }
  const leftVersions = serializeVersions(modelLeftVersions.value)
  const rightVersions = serializeVersions(modelRightVersions.value)

  if (leftVersions) query.a = leftVersions
  else delete query.a

  if (rightVersions) query.b = rightVersions
  else delete query.b

  router.push({ query })
}

const modelLeftVersions = ref(parseVersionQuery(route.query.a) ?? new Set<OptionalRegionVersion>([{ region: 'RU', version: '1.36.0' }]))
const modelRightVersions = ref(parseVersionQuery(route.query.b) ?? new Set<OptionalRegionVersion>([{ region: 'RU', version: '1.36.1' }]))

watch([modelLeftVersions, modelRightVersions], updateVersionQuery, { deep: true })

onUnmounted(() => {
  const query = { ...route.query }
  delete query.a
  delete query.b
  router.push({ query })
})

const leftVersions = refDebounced(computed(() => new Set([...modelLeftVersions.value.values()]
  .filter(v => v.region)
  .map(v => `${v.region?.toLowerCase()}_${v.version}`))), 400)

const rightVersions = refDebounced(computed(() => new Set([...modelRightVersions.value.values()]
  .filter(v => v.region)
  .map(v => `${v.region?.toLowerCase()}_${v.version}`))), 400)

const selectedLevels = ref(new Set<number>([10]))
const regionFilter = computed(() => {
  const regions = new Set([...leftVersions.value, ...rightVersions.value].map(v => v.split('_')[0]))
  return [...regions].map(r => `'${r.toUpperCase()}'`).join(', ')
})
const gameVersionFilter = computed(() => {
  return [...leftVersions.value, ...rightVersions.value].map(v => `'${v}'`).join(', ')
})

watchEffect(() => console.log(gameVersionFilter.value))

const leftVersionString = computed(() => [...leftVersions.value].map(t => t.split('_')[1]).join(', '))
const rightVersionString = computed(() => [...rightVersions.value].map(t => t.split('_')[1]).join(', '))
const percent = createPercentProcessor(2)

const roundedSpace = (value: number) => spaceProcessor(roundProcessor(value))
const distributionPercent = (value: number) => `${(Math.round(value * 1000) / 10).toFixed(1)}%`
const levelTooltipTitle = (label: string | number) => `Уровень ${label}`
const durationTooltipTitle = (label: string | number) => `Продолжительность ${sec2minsec(Number(label) * 60)}`
const typeDistributionTooltipTitle = (label: string | number, type: string) => `Боёв с ${label} ${type} на команду`

const levelDebounce = useDebounce(selectedLevels)
const durationSelectedLevel = ref(10)


const hitPercents = queryComputed<{ gameVersion: string, hitPercent: number, piercingPercent: number }>(() => `
select
    gameVersion,
    avgMerge(directEnemyHits) / avgMerge(shots) as hitPercent,
    avgMerge(piercingEnemyHits) / avgMerge(directEnemyHits) as piercingPercent
from "MT-36-1".AveragePlayerResults
where battleMode = 'REGULAR' and region in (${regionFilter.value}) and gameVersion in (${gameVersionFilter.value})
group by gameVersion;
`, { settings: LONG_CACHE_SETTINGS })


const averageDamageAndAssist = queryComputed<{ gameVersion: string, tankType: string, tankLevel: number, damage: number, assistRadio: number }>(() => `
select
    gameVersion, tankType, tankLevel,
    avgMerge(damage) as damage,
    avgMerge(assistRadio) as assistRadio
from "MT-36-1".AveragePlayerResults
where battleMode = 'REGULAR' and region in (${regionFilter.value}) and gameVersion in (${gameVersionFilter.value})
group by gameVersion, tankType, tankLevel
order by gameVersion, tankType, tankLevel;
`, { settings: LONG_CACHE_SETTINGS })

const averageSpgDamageChartData = computed<ComparisonBarChartData>(() => {
  const data = averageDamageAndAssist.value.data.filter(item => item.tankType == 'SPG')
  const targetLabels = [...new Set(data.map(item => item.tankLevel)).values()].sort((a, b) => a - b)
  const left = data.filter(item => leftVersions.value.has(item.gameVersion))
  const right = data.filter(item => rightVersions.value.has(item.gameVersion))

  return {
    labels: targetLabels.map(t => romanNumberProcessor(t)),
    left: targetLabels.map(label => left.find(t => t.tankLevel == label)?.damage || 0),
    right: targetLabels.map(label => right.find(t => t.tankLevel == label)?.damage || 0),
  }
})

const averageLtAssistChartData = computed<ComparisonBarChartData>(() => {
  const data = averageDamageAndAssist.value.data.filter(item => item.tankType == 'LT')
  const targetLabels = [...new Set(data.map(item => item.tankLevel)).values()].sort((a, b) => a - b)
  const left = data.filter(item => leftVersions.value.has(item.gameVersion))
  const right = data.filter(item => rightVersions.value.has(item.gameVersion))

  return {
    labels: targetLabels.map(t => romanNumberProcessor(t)),
    left: targetLabels.map(label => left.find(t => t.tankLevel == label)?.assistRadio || 0),
    right: targetLabels.map(label => right.find(t => t.tankLevel == label)?.assistRadio || 0),
  }
})


const durationDistributionData = queryComputed<{ gameVersion: string, tankLevel: number, time: number, p: number }>(() => `
select gameVersion,
       tankLevel,
       round(duration / 60 * 2) / 2 as time,
       count() / sum(count()) over (partition by gameVersion, tankLevel) as p
from WOT.Event_OnBattleResult
where gameVersion in (${gameVersionFilter.value}) and battleMode = 'REGULAR' and region in (${regionFilter.value})
group by gameVersion, time, tankLevel;
`, { settings: LONG_CACHE_SETTINGS })

const durationDistributionChartData = computed<ComparisonBarChartData>(() => {
  const data = durationDistributionData.value.data.filter(item => item.tankLevel == durationSelectedLevel.value)
  const targetLabels = new Array(27).fill(0).map((_, i) => 2 + i * 0.5)
  const left = data.filter(item => leftVersions.value.has(item.gameVersion))
  const right = data.filter(item => rightVersions.value.has(item.gameVersion))
  return {
    labels: targetLabels,
    left: targetLabels.map(label => left.find(t => t.time == label)?.p || 0),
    right: targetLabels.map(label => right.find(t => t.time == label)?.p || 0),
  }
})


const durationByLevelData = queryComputed<{ gameVersion: string, tankLevel: number, dur: number }>(() => `
select gameVersion,
       tankLevel,
       avg(duration) as dur
from WOT.Event_OnBattleResult
where gameVersion in (${gameVersionFilter.value}) and battleMode = 'REGULAR' and region in (${regionFilter.value})
group by gameVersion, tankLevel
`, { settings: LONG_CACHE_SETTINGS })

const durationByLevelChartData = computed<ComparisonBarChartData>(() => {
  const data = durationByLevelData.value.data
  const targetLabels = [...new Set(data.map(item => item.tankLevel)).values()].sort((a, b) => a - b)
  const left = data.filter(item => leftVersions.value.has(item.gameVersion))
  const right = data.filter(item => rightVersions.value.has(item.gameVersion))
  return {
    labels: targetLabels.map(t => romanNumberProcessor(t)),
    left: targetLabels.map(label => left.find(t => t.tankLevel == label)?.dur || 0),
    right: targetLabels.map(label => right.find(t => t.tankLevel == label)?.dur || 0),
  }
})

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
      and region in (${regionFilter.value})
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

const leftTeamLevelTableData = computed(() => teamLevelTableData.value.data.filter(item => leftVersions.value.has(item.gameVersion)))
const rightTeamLevelTableData = computed(() => teamLevelTableData.value.data.filter(item => rightVersions.value.has(item.gameVersion)))

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
          where battleMode = 'REGULAR' and region in (${regionFilter.value})
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

const typeDistributionData = computed<{ chart: { key: string, label: string }, data: ComparisonBarChartData }[]>(() => {
  return [
    { key: 'spg', label: 'САУ' },
    { key: 'at', label: 'ПТ' },
    { key: 'lt', label: 'ЛТ' }
  ].map(chart => {
    const data = byTankTypeDistributionData.value.data.filter(t => t.type == chart.key).filter(t => t.battles > 0.0001)
    const targetLabels = [...new Set(data.map(item => item.count)).values()].sort((a, b) => a - b).map(String)

    const left = data.filter(t => leftVersions.value.has(t.gameVersion))
    const right = data.filter(t => rightVersions.value.has(t.gameVersion))

    return {
      chart,
      data: {
        labels: targetLabels,
        left: targetLabels.map(label => left.find(t => t.count == Number(label))?.battles || 0),
        right: targetLabels.map(label => right.find(t => t.count == Number(label))?.battles || 0),
      }
    }
  })

})


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
]
const selectedTarget = ref<number>(390)
const selectedCantKill = ref<boolean>(true)
const selectedPreset = ref<'target' | 'kv2' | 'fv' | 'grille' | 'FSDS420'>('target')
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

  if (selectedPreset.value == 'FSDS420') return {
    targetDamage: 420,
    limitDamage: false,
    targetShells: ['ARMOR_PIERCING_FSDS'],
    cantKill: selectedCantKill.value,
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
  const params = damageDistributionDataSettings.value
  return `
    with
      ${params.targetDamage} as TARGET,
      (${params.targetShells.map(shell => `'${shell}'`).join(', ')}) as TARGET_SHELL
    select shotDamage,
          countMerge(count) as count,
          count / sum(count) over (partition by gameVersion) as percent,
          gameVersion
    from "MT-36-1".ShotDamageDistribution
    where region in (${regionFilter.value}) and battleMode = 'REGULAR' and shotDamage > 0 and not isAmmoBayDestroyed and not isKill
      and shellDamage = TARGET and shellTag in TARGET_SHELL and gameVersion in (${gameVersionFilter.value})
      ${!params.limitDamage ? '' : 'and shotDamage >= round(TARGET * (1 - damageRandomization)) and shotDamage <= round(TARGET * (1.00001 + damageRandomization))'}
      ${params.targetTank ? `and tankTag in (${params.targetTank.map(t => `'${t}'`).join(', ')})` : ''}
      ${params.cantKill ? 'and not canKill' : ''}
    group by shotDamage, gameVersion
    order by shotDamage, gameVersion;
`
}, { settings: LONG_CACHE_SETTINGS })

const stepVariants = computed(() => {
  let steps = [1, 3, 5, 7, 11, 13, 15, 17, 21, 47]

  const dmg = damageDistributionDataSettings.value.targetDamage
  steps = steps.filter(step => step <= dmg / 3)

  if (dmg < 100) steps = steps.filter(step => step <= dmg / 8)
  if (dmg < 400) steps = steps.filter(step => step <= dmg / 10)
  else steps = steps.filter(step => step <= dmg / 20)

  return steps.map(step => ({ label: `${step} ед.`, value: step }))
})
const damageStep = ref(1)

watch(stepVariants, (newValue) => {
  if (!newValue.some(v => v.value == damageStep.value)) {
    damageStep.value = newValue[0].value
  }
}, { immediate: true })

const steppedLabels = computed(() => {
  const data = damageDistributionData.value.data

  const labels = new Set(data.map(item => item.shotDamage))
  if (labels.size === 0) return { steps: [], textLabels: [] }

  const min = Math.min(...labels)
  const max = Math.max(...labels) + 1

  const median = damageDistributionDataSettings.value.targetDamage
  const halfStep = Math.floor(damageStep.value / 2)
  let leftStart = median - halfStep
  while (leftStart - damageStep.value > min) leftStart -= damageStep.value

  const steppedLabels: number[] = []
  steppedLabels.push(min)
  while (leftStart < max) {
    steppedLabels.push(leftStart)
    leftStart += damageStep.value
  }


  const textLabels: string[] = []
  textLabels.push(steppedLabels[0].toString())
  for (let i = 1; i < steppedLabels.length - 1; i++) textLabels.push(`${steppedLabels[i] + halfStep}`)
  textLabels.push(steppedLabels[steppedLabels.length - 1].toString())

  return { steps: steppedLabels, textLabels }
})

const damageDistributionChartData = computed<DamageDistributionChartData>(() => {

  const data = damageDistributionData.value.data

  const labels = new Set(data.map(item => item.shotDamage))
  const max = Math.max(...labels)

  const { steps, textLabels } = steppedLabels.value

  function process(data: Map<string, number | null>) {
    const result = new Map<string, number | null>()

    for (let i = 0; i < steps.length; i++) {
      const currentLabel = steps[i]
      const nextLabel = i < steps.length - 1 ? steps[i + 1] : max + 1

      let currentSum = 0
      for (let j = currentLabel; j < nextLabel; j++) currentSum += data.get(String(j)) ?? 0
      result.set(String(currentLabel), currentSum == 0 ? null : currentSum)
    }


    return result
  }

  const leftData = new Map<string, number>(data.filter(item => leftVersions.value.has(item.gameVersion)).map(item => [String(item.shotDamage), 100 * item.percent]))
  const rightData = new Map<string, number>(data.filter(item => rightVersions.value.has(item.gameVersion)).map(item => [String(item.shotDamage), 100 * item.percent]))

  return {
    labels: textLabels,
    left: [...process(leftData).values()],
    right: [...process(rightData).values()],
    targetIndex: textLabels.indexOf(String(damageDistributionDataSettings.value.targetDamage)),
  }
})


const ballisticDistributionIdeal = ref<boolean>(true)
const ballisticDistributionData = queryComputed<{
  gameVersion: string;
  r: number;
  c: number;
  p: number;
}>(() => `
    select gameVersion,
          round(toDecimal32(ballisticResultClient_r, 3) / 2, 3) * 2 as r,
          countMerge(count) as c,
          c / sum(countMerge(count)) over (partition by gameVersion) as p
    from "MT-36-1".ShotClientBallisticDistribution
    where region in (${regionFilter.value}) and tankType != 'SPG' and battleMode = 'REGULAR' and gameVersion in (${gameVersionFilter.value})
    ${ballisticDistributionIdeal.value ? 'and isIdealCondition = 1' : ''}  
    group by r, gameVersion
    order by gameVersion, r;
`, { settings: CACHE_SETTINGS })


const distributionVariant = ref<'cdf' | 'pdf'>('pdf')
const ballisticCircleMask = computed(() => {
  if (lastHover.value === null) return undefined

  if (distributionVariant.value == 'pdf') return [Math.max(0, lastHover.value - 0.05), Math.min(1, lastHover.value + 0.05)] as [number, number]
  return lastHover.value
})

const lastHover = ref<number | null>(null)

type Options = { loadCount: number, offset: number, startId: string | null }

async function loadNextBatch(options: Options, gameVersion: string[]): Promise<{ id: string, r: number, theta: number, hit: number }[]> {

  const result = await query<{ idS: string, r: number, theta: number, hit: number }>(`
    select toString(id) as idS, r, theta, hit
    from "MT-36-1".ShotHitPoints
    where region in (${regionFilter.value}) and battleMode = 'REGULAR' and gameVersion in (${gameVersion.map(v => `'${v}'`).join(', ')}) and isIdealCondition = 1
    ${options.startId ? ` and id < '${options.startId}'` : ''}
    order by id desc
    limit ${options.loadCount}
    offset ${options.offset};
  `, { settings: CACHE_SETTINGS })

  return result.data.map(t => ({ id: t.idS, r: t.r, theta: t.theta, hit: t.hit }))
}

async function loadNextBatchLeft(options: Options) {
  return await loadNextBatch(options, [...leftVersions.value])
}

async function loadNextBatchRight(options: Options) {
  return await loadNextBatch(options, [...rightVersions.value])
}

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

  .collapsible-menu {
    margin: 0 auto;
    margin-bottom: 2em;

    .menu-content {
      padding: 15px;
      padding-left: 1em;
      background: rgba(102, 102, 102, 0.15);
      border-radius: 15px;

      ul {
        margin-bottom: 0;
      }
    }
  }

  .select-version {
    .selector-vs {
      display: flex;
      align-items: stretch;
      gap: 1em;
      flex-wrap: wrap;

      .vr {
        width: 1px;
        background: rgba(255, 255, 255, 0.2);
      }

      .version-select {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.5em;
        flex: 1;
      }
    }
  }

  button {
    font-size: 1em;
    font-weight: 500;
    padding: .6em 1.2em;
  }

  .background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 250%;
    z-index: -1;
    overflow: hidden;

    .blue-gradient {
      position: absolute;
      top: -100vw;
      right: -100vw;
      width: 200vw;
      height: 200vw;
      opacity: 0.05;
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
      opacity: 0.02;
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

    div.card-main-info {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 0.5em;
      margin-bottom: -0.3em;
      margin-top: 0.2em;

      .dropdown-container {
        font-weight: normal;
        text-align: left;
        display: inline-block;
      }
    }
  }

  .comparison-chart-container,
  .damage-chart-container {
    position: relative;
    display: flex;
    flex: 1;
    min-height: 0;
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

    .damage-chart-container {
      margin-top: -3px;

      .chart-options {
        position: absolute;
        top: 3px;
        left: 0;
        z-index: 1;

        .line {
          display: flex;
          gap: 0.5em;
          margin-bottom: 0.5em;
        }

        .dropdown {
          min-width: 70px;
        }
      }
    }

    .controls {
      .line {
        display: flex;
        flex-wrap: wrap;
        white-space: nowrap;
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

  .ballistic-distribution {
    .line {
      margin-bottom: 1em;

      &.flex {
        flex-wrap: wrap;
      }
    }

    .line.charts {
      display: flex;
      gap: 1em;

      .left {
        flex: 1;
        display: flex;

        .card {
          display: flex;
          flex-direction: column;
        }
      }

      .right {
        flex: 0.3;
        display: flex;
        flex-direction: column;
        gap: 1em;

        --background: #2e2e31;

        .card {
          aspect-ratio: 1;
          position: relative;

          .card-main-info {
            margin-bottom: -10px;
          }
        }
      }

      @media screen and (max-width: 800px) {
        flex-direction: column;

        .left {
          aspect-ratio: 2;
        }

        .right {
          flex: 1;
          flex-direction: row;
        }
      }

    }

    .ballistic-chart-container {
      position: relative;
      display: flex;
      flex: 1;
      margin-top: -3px;

      .chart-options {
        position: absolute;
        top: 3px;
        left: 0;

        .line {
          display: flex;
          gap: 0.5em;
          margin-bottom: 0.5em;
        }

        .dropdown {
          min-width: 70px;
        }
      }
    }
  }

  section {
    margin-bottom: 3em;

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
