<template>
  <h2 class="small-bottom-margin page-title">Урон</h2>

  <p class="section-description">Распределения урона строятся для выстрелов ББ, БП и КС снарядами по танкам с ХП,
    превышающим максимальный урон снаряда</p>
  <div class="flex ver damage" ref="container">
    <div class="card long">
      <GenericInfo :status="totalShots.status" :value="totalShots.data.data" :processor="useFixedSpaceProcessor(0)"
        description="Выстрелов с видимым уроном" color="green" />
    </div>
    <div class="flex ver">
      <div class="grid">
        <div class="card chart bar height2 full-width-less-small">
          <MiniBar :status="byShellResult.status" :data="byShellData.damage" color="yellow" :labels="shellLabels"
            :callbacks="{
              title: (t) => `${toPercent(t)} выстрелов ${t[0].label} нанесли урон`,
              label: () => ``,
              beforeBody: () => `Среди попавших`
            }" />
          <p class="card-main-info description">Нанесли урон</p>
        </div>

        <div class="card mini-card frags full-width-less-small">
          <GenericInfo :status="onShotResult.status" :value="onShotResult.data.frags"
            :processor="useFixedSpaceProcessor(0)" description="Фрагов" color="red" />
        </div>
        <div class="card mini-card shot-per-frag full-width-less-small">
          <GenericInfo :status="onShotResult.status" :value="onShotResult.data.shotPerFrag"
            description="Снарядов на фраг" color="orange" />
        </div>

        <div class="card chart bar height2 full-width-less-small right-column">
          <MiniBar :status="smallDamageResult.status" :data="smallDamageData" color="blue"
            :labels="['1ХП', '2ХП', '3ХП', '4ХП', '5ХП']" :callbacks="{
              title: (t) => `${toPercent(t)} танков осталось с ${t[0].label}`,
              label: () => ``,
              beforeBody: () => `Среди группы до 5 ХП`

            }" />
          <p class="card-main-info description">Осталось ХП после урона</p>
        </div>

        <!-- <div class="card mini-card full-width-less-small">
          <GenericInfo :value="onShotResult.ammoBayDestroyed" description="Взорвано БК" color="orange" />
        </div> -->

        <div class="card mini-card full-width-less-small">
          <GenericInfo :status="onShotResult.status" :value="onShotResult.data.fired" description="Поджогов"
            color="red" />
        </div>

        <div class="card mini-card full-width-less-small">
          <GenericInfo :status="damageAggregatedResult.status" :value="damageK"
            description="Выстрелов с уроном ниже среднего" :color="damageK > 0.5 ? 'red' : 'green'"
            :processor="usePercentProcessor(1)" />
        </div>

        <div class="card mini-card full-width-less-small">
          <GenericInfo :status="damageAggregatedResult.status" :value="damageAggregatedResult.data.avgDamage * 0.25"
            description="Отклонение от среднего" :color="damageAggregatedResult.data.avgDamage < 0 ? 'red' : 'green'"
            :processor="usePercentProcessor(2)" />
        </div>


        <div class="card chart bar big damage-distribution">
          <MiniBar :status="damageDistributionResult.status" :data="damageDistributionData" :center-line="true"
            color="green" :labels="damageLabels"
            :callbacks="{ title: (t) => `${toPercent(t)} выстрелов отклонились на ${t[0].label} от базового урона`, label: () => `` }" />
          <div class="absolute">
            <p class="card-main-info description">Распределение урона +- 25
            </p>

            <QueryPreserveRouterLink class="pointer" to="/session/distribution">Расширенный</QueryPreserveRouterLink>
          </div>
        </div>

        <div class="long flex col hor-ver-x-small">
          <div class="card flex-1">
            <GenericInfo :status="safeStillResult.status" :value="safeStillResult.data.stilled"
              description="Нечестно добитых" color="green" />
          </div>


          <div class="card flex-1">
            <GenericInfo :status="safeStillResult.status" :value="safeStillResult.data.saved"
              description="Нечестно спасенных" color="red" />
          </div>

        </div>

        <!-- <div class="long card chart bar medium-h flex-1">
          <StillSurviveDistribution :params="params" />
          <p class="card-main-info description">Распределение возможности добить от прошедшего урона</p>
        </div> -->

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GenericInfo from '@/components/widgets/GenericInfo.vue'
import { queryAsync, queryAsyncFirst } from '@/db'
import { computed, ref, watchEffect } from 'vue'
import { useElementVisibility } from '@vueuse/core'
import MiniBar from '@/components/widgets/charts/MiniBar.vue'
import GenericInfoQuery from '@/components/widgets/GenericInfoQuery.vue'
import StillSurviveDistribution from '@/components/widgets/StillSurviveDistribution.vue'
import { useQueryStatParams, useQueryStatParamsCache, whereClause } from '@/composition/useQueryStatParams'
import { toRelative, toPercent } from '@/utils'
import { useFixedSpaceProcessor, usePercentProcessor } from '@/composition/usePercentProcessor'
import { shellNames } from '@/utils/wot'
import QueryPreserveRouterLink from '@/components/QueryPreserveRouterLink.vue'
import { bestMV } from '@/db/schema'
import { useMeta } from '@/composition/useMeta'

useMeta({
  title: 'Инфографика урона',
  description: 'Инфографика урона в боях',
  keywords: 'инфографика урона, статистика урона, статистика урона в боях'
})


const params = useQueryStatParams()
const settings = useQueryStatParamsCache(params)

const shellLabels = Object.values(shellNames).map(t => t[0])
const shellFullNames = Object.values(shellNames).map(t => t[1])

const container = ref<HTMLElement | null>(null)
const enabled = useElementVisibility(container)

const damageLabels = new Array(21).fill(0).map((v, i) => `${i == 10 ? '' : i < 10 ? '-' : '+'}${Math.abs((i - 10) * 2.5)}%`)

const totalShots = queryAsyncFirst(`select toUInt32(countIf(arrayMax(results.shotDamage) > 0)) as data from Event_OnShot ${whereClause(params)}`, { data: 0 }, { enabled, settings: settings.value })

const damageDistributionResult = queryAsync<{ k: number, count: number }>(`
with arrayMax(results.shotDamage) as dmg,
     indexOf(results.shotDamage, dmg) as idx,
     results.shotHealth[idx] as health,
     dmg > 0 and health > 0 and idx > 0 and (dmg + health) > round(shellDamage * 1.250001) as representative,
     ((toFloat32(dmg) / shellDamage) - 1) / damageRandomization AS dmgRelativeShell,
     length(results.shotDamage) as hits,
     max2(-1, min2(1, round(dmgRelativeShell, 1))) as rounded,
     if(rounded = -0, 0, rounded) as trueRounded
select trueRounded * 10 as k,
       toUInt32(countIf(representative and hits > 0)) as count
from Event_OnShot
where shellTag != 'HIGH_EXPLOSIVE' and shellTag != 'FLAME'
${whereClause(params, { withWhere: false })}
group by k
having k between -10 and 10
order by k;`, { enabled, settings: settings.value })

const damageAggregatedResult = queryAsyncFirst(`
with arrayMax(results.shotDamage) as dmg,
     indexOf(results.shotDamage, dmg) as idx,
     results.shotHealth[idx] as health,
     dmg > 0 and health > 0 and idx > 0 and (dmg + health) > round(shellDamage * 1.250001) as representative,
     ((toFloat32(dmg) / shellDamage) - 1) / damageRandomization AS dmgRelativeShell
select
    avgIf(dmgRelativeShell, representative) AS avgDamage,
    toUInt32(countIf(representative and dmg < shellDamage)) AS less,
    toUInt32(countIf(representative and dmg > shellDamage)) AS more,
    countIf(representative and dmg = shellDamage) AS equal
from Event_OnShot
where shellTag not in ('HIGH_EXPLOSIVE', 'FLAME')
${whereClause(params, { withWhere: false })};
`, { less: 0, more: 0, avgDamage: 0 }, { enabled, settings: settings.value })

const safeStillResult = queryAsyncFirst(`
with arrayMax(results.shotDamage) as dmg,
    indexOf(results.shotDamage, dmg) as idx,
    results.shotHealth[idx] as health,
    results.ammoBayDestroyed[idx] as ab,
    health + dmg as healthBeforeShot
select toUInt32(countIf(dmg > 0 and health = 0 and healthBeforeShot > shellDamage and not ab)) as stilled,
       toUInt32(countIf(dmg > 0 and health != 0 and healthBeforeShot < shellDamage)) as saved
from Event_OnShot
where shellTag != 'HIGH_EXPLOSIVE' and shellTag != 'FLAME'
${whereClause(params, { withWhere: false })}
`, { stilled: 0, saved: 0 }, { enabled, settings: settings.value })

const byShellResult = queryAsync<{ shellTag: string, percentDamage: number, percentNoDamage: number }>(`
with arrayMax(results.shotDamage) as dmg,
     length(results.shotDamage) as hits,
     countIf(hits > 0) as hitCount
select shellTag,
       countIf(hits > 0 and dmg > 0) / hitCount as percentDamage,
       countIf(hits > 0 and dmg = 0) / hitCount as percentNoDamage
from Event_OnShot
${whereClause(params)}
group by shellTag;`, { enabled, settings: settings.value })

const healthEnoughBestMV = bestMV('event_OnShot_health_damage', params)
const healthEnoughQuery = healthEnoughBestMV ? `
select healthEnough, toUInt32(countMerge(count)) as count
from ${healthEnoughBestMV}
where healthEnough between 1 and 5
${whereClause(params, { withWhere: false })}
group by healthEnough;
` : `
select a.1 as healthEnough, toUInt32(count()) as count
from Event_OnShot
array join arrayZip(results.shotHealth, results.shotDamage) as a
where a.2 > 0 and a.1 > 0 and a.1 <= 5
${whereClause(params, { withWhere: false })}
group by healthEnough;
`

const smallDamageResult = queryAsync<{ healthEnough: number, count: number }>(healthEnoughQuery, { enabled, settings: settings.value })


const smallDamageData = computed(() => {
  const res = Object.fromEntries(smallDamageResult.value.data.map(v => [v.healthEnough, v.count]))
  return toRelative(new Array(5).fill(0).map((v, i) => res[i + 1] ?? 0))
})

const byShellData = computed(() => {
  const damageByName = Object.fromEntries(byShellResult.value.data.map(v => [v.shellTag, v.percentDamage]))
  const shellKeys = Object.keys(shellNames)

  return {
    damage: shellKeys.map(t => damageByName[t] ?? 0),
    noDamage: byShellResult.value.data.map(v => v.percentNoDamage),
  }
})

const damageDistributionData = computed(() => {

  const res = damageDistributionResult.value.data.reduce((prev, cur) => {
    prev[cur.k] = cur.count
    return prev
  }, {} as any)

  const absolute = new Array(21).fill(0).map((v, i) => res[i - 10] ?? 0)

  return toRelative(absolute)
})

const damageK = computed(() => {
  const { more, less } = damageAggregatedResult.value.data
  return more == 0 ? 0 : less / (more + less)
})

const onShotResult = queryAsyncFirst(`
select
  toUInt32(sum(firedCount)) as fired,
  toUInt32(sum(ammoBayDestroyedFragsCount)) as ammoBayDestroyed,
  toUInt32(sum(shotFragsCount)) as frags,
  count() / frags as shotPerFrag
from Event_OnShot
${whereClause(params)};
`, { fired: 0, ammoBayDestroyed: 0, frags: 0, shotPerFrag: 0 }, { enabled, settings: settings.value })


function openDamage() {
  window.open(`/damage${window.location.search}`)
}
</script>


<style lang="scss" scoped>
@use '/src/styles/mixins.scss' as *;

.damage {

  .damage-distribution {
    position: relative;

    a {
      position: absolute;
      top: 10px;
      right: 10px;
    }
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }

  .right-column {
    grid-column: 3 / 4;
  }

  .full-width-less-small {
    @include less-small {
      grid-column: 1 / 4;
      grid-row: auto;
    }
  }

  @include less-small {
    .chart {
      min-height: 200px;
    }

    .chart.mini-card {
      min-height: 0;
      height: 150px;
    }
  }

  .chart {
    display: flex;
    flex-direction: column;
    text-align: center;
    padding: 15px;

    &.height2 {
      grid-row: 1 / 3;

      @include less-small {
        grid-row: auto;
      }
    }

    &.big {
      grid-column: 2 / 4;
      grid-row: 3 / 6;
      height: auto;

      @include less-small {
        min-height: 280px;
        grid-column: 1 / 4;
        grid-row: auto;
      }
    }
  }

  .long {
    grid-column: 1 / 4;

    &.chart {
      height: 380px;

      @include less-small {
        min-height: 280px;
        height: auto;
      }
    }
  }

  .medium {
    grid-column: 1 / 2;
  }
}
</style>