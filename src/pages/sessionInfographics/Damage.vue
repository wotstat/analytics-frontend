<template>
  <div class="flex ver damage" ref="container">
    <div class="card long">
      <GenericInfoQuery
        :query="`select toUInt32(count()) as data from Event_OnShot where arrayMax(results.shotDamage) > 0 ${whereClause(params, { withWhere: false })};`"
        description="Выстрелов с видимым уроном" color="green" />
    </div>
    <div class="flex ver">
      <div class="grid">
        <div class="card chart bar height2 full-width-less-small">
          <MiniBar :data="byShellData.damage" color="yellow" :labels="shellLabels" :callbacks="{
            title: (t) => `${toPercent(t)} выстрелов ${t[0].label} нанесли урон`,
            label: () => ``,
            beforeBody: () => `Среди попавших`
          }" />
          <p class="card-main-info description">Нанесли урон</p>
        </div>

        <div class="card mini-card frags full-width-less-small">
          <GenericInfo :value="onShotResult.frags" description="Фрагов" color="red" />
        </div>
        <div class="card mini-card shot-per-frag full-width-less-small">
          <GenericInfo :value="onShotResult.shotPerFrag" description="Снарядов на фраг" color="orange" />
        </div>

        <div class="card chart bar height2 full-width-less-small right-column">
          <MiniBar :data="smallDamageData" color="blue" :labels="['1ХП', '2ХП', '3ХП', '4ХП', '5ХП']" :callbacks="{
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
          <GenericInfo :value="onShotResult.fiered" description="Поджогов" color="red" />
        </div>

        <div class="card mini-card full-width-less-small">
          <GenericInfo :value="damageK" description="Выстрелов с уроном выше среднего"
            :color="damageK < 0.5 ? 'red' : 'green'" :processor="usePercentProcessor(1)" />
        </div>

        <div class="card mini-card full-width-less-small">
          <GenericInfo :value="damageAggregatedResult.avgDamage * 0.25" description="Урона в среднем"
            :color="damageAggregatedResult.avgDamage < 0 ? 'red' : 'green'" :processor="usePercentProcessor(2)" />
        </div>


        <div class="card chart bar big">
          <MiniBar :data="damageDistributionData" color="green" :labels="damageLabels"
            :callbacks="{ title: (t) => `${toPercent(t)} выстрелов отклонились на ${t[0].label} от базового урона`, label: () => `` }" />
          <p class="card-main-info description">Распределение урона +- 25</p>
        </div>

        <div class="long flex col hor-ver-x-small">
          <div class="card flex-1">
            <GenericInfo :value="stilledResult.stilled" description="Нечестно добитых" color="green" />
          </div>

          <div class="card flex-1">
            <GenericInfo :value="damageAggregatedResult.safed" description="Нечестно спасенных" color="red" />
          </div>
        </div>

        <div class="long card chart bar medium-h flex-1">
          <StillSurviveDistribution :params="params" />
          <p class="card-main-info description">Распределение возможности добить от прошедшего урона</p>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GenericInfo from '@/components/widgets/GenericInfo.vue';
import { queryAsync, queryAsyncFirst } from "@/db";
import { computed, ref } from "vue";
import { useElementVisibility } from "@vueuse/core";
import MiniBar from "@/components/widgets/MiniBar.vue";
import GenericInfoQuery from "@/components/widgets/GenericInfoQuery.vue";
import StillSurviveDistribution from "@/components/widgets/StillSurviveDistribution.vue";
import { useQueryStatParams, whereClause } from '@/composition/useQueryStatParams';
import { toRelative, toPercent } from "@/utils";
import { usePercentProcessor } from '@/composition/usePercentProcessor';
import { shellNames } from '@/utils/wot';

const params = useQueryStatParams()

const shellLabels = Object.values(shellNames).map(t => t[0])
const shellFullNames = Object.values(shellNames).map(t => t[1])

const container = ref<HTMLElement | null>(null);
const visible = useElementVisibility(container);

const damageLabels = new Array(21).fill(0).map((v, i) => `${i == 10 ? '' : i < 10 ? '-' : '+'}${Math.abs((i - 10) * 2.5)}%`)

const damageDistributionResult = queryAsync<{ k: number, count: number }>(`
select if(round(normK, 1) = -0, 0, round(normK, 1)) * 10 as k, toUInt32(count()) as count
from (select arrayZip(results.shotDamage, results.shotHealth) as shotHealth,
             arrayFilter(x -> x.2 != 0, shotHealth)           as notKill,
             arrayMax(x -> x.1, notKill)                      as maxNotKillDamage,
             shellDamage,
             damageRandomization,
             1.0 * maxNotKillDamage / shellDamage             as k,
             (k - 1.0) / damageRandomization                  as normK
      from Event_OnShot
      where length(results.order) > 0
        and maxNotKillDamage > 0
        and shellTag != 'HIGH_EXPLOSIVE' and shellTag != 'FLAME'
        ${whereClause(params, { withWhere: false })})
group by k
order by k;
`, visible)

const damageAggregatedResult = queryAsyncFirst(`
select avg((1.0 * dmg / shellDamage - 1) / damageRandomization) as avgDamage,
       toUInt32(countIf(dmg < shellDamage)) as less,
       toUInt32(countIf(dmg > shellDamage)) as more,
       toUInt32(countIf(health < shellDamage - dmg)) as safed
from Event_OnShot
    array join
     results.shotDamage as dmg,
     results.shotHealth as health
where dmg > 0 and health > 0 and shellTag != 'HIGH_EXPLOSIVE' and shellTag != 'FLAME'
${whereClause(params, { withWhere: false })};
`, { less: 0, more: 0, safed: 0, avgDamage: 0 }, visible)

const stilledResult = queryAsyncFirst(`
select toUInt32(countIf(killedDamage > shellDamage)) as stilled
from (select arrayZip(results.shotDamage, results.shotHealth)                          as shotHealth,
             arrayFirst(x -> not isNull(x.2) and assumeNotNull(x.2) = 0, shotHealth).1 as killedDamage,
             shellDamage
      from Event_OnShot
      where length(results.order) > 0
        and has(results.shotHealth, 0)
        and shellTag != 'HIGH_EXPLOSIVE' and shellTag != 'FLAME'
        ${whereClause(params, { withWhere: false })});
`, { stilled: 0 }, visible)

const byShellResult = queryAsync<{ shellTag: string, percentDamage: number, percentNoDamage: number }>(`
select shellTag,
       count() as conut,
       countIf(has(results.shotHealth, 0)) / conut as countFrags,
       countIf(length(arrayFilter(t -> t > 0, results.shotDamage)) > 0) / conut as percentDamage,
       countIf(length(arrayFilter(t -> t > 0, results.shotDamage)) = 0) / conut as percentNoDamage
from Event_OnShot
where length(results.shotDamage) > 0
${whereClause(params, { withWhere: false })}
group by shellTag;`, visible)

const smallDamageResult = queryAsync<{ damage: number, count: number }>(`
select a.1 as damage, toUInt32(count()) as count
from Event_OnShot
array join arrayZip(results.shotHealth, results.shotDamage) as a
where a.2 > 0 and a.1 > 0 and a.1 <= 5
${whereClause(params, { withWhere: false })}
group by damage;
`, visible)

const smallDamageData = computed(() => {
  const res = Object.fromEntries(smallDamageResult.value.map(v => [v.damage, v.count]))
  return toRelative(new Array(5).fill(0).map((v, i) => res[i + 1] ?? 0))
})

const byShellData = computed(() => {
  const damageByName = Object.fromEntries(byShellResult.value.map(v => [v.shellTag, v.percentDamage]))
  const shellKeys = Object.keys(shellNames)

  return {
    damage: shellKeys.map(t => damageByName[t] ?? 0),
    noDamage: byShellResult.value.map(v => v.percentNoDamage),
  }
})

const damageDistributionData = computed(() => {

  const res = damageDistributionResult.value.reduce((prev, cur) => {
    prev[cur.k] = cur.count
    return prev
  }, {} as any)

  const absolute = new Array(21).fill(0).map((v, i) => res[i - 10] ?? 0)

  return toRelative(absolute)
})

const damageK = computed(() => damageAggregatedResult.value.more == 0 ? 0 : damageAggregatedResult.value.more / (damageAggregatedResult.value.more + damageAggregatedResult.value.less))

const onShotResult = queryAsyncFirst(`
select toUInt32(countIf(arraySum(results.fireDamage) > 0))                                           as fiered,
       toUInt32(countIf(has(results.ammoBayDestroyed, True)))                                        as ammoBayDestroyed,
       toUInt32(countIf(arrayMax(results.shotDamage) > 0 and
                        length(arrayFilter(x -> x.1 != 0 and x.2 = 0,
                                           arrayZip(results.shotDamage, results.shotHealth))) != 0)) as frags,
       count() / frags                                                                               as shotPerFrag
from Event_OnShot
${whereClause(params)};
`, { fiered: 0, ammoBayDestroyed: 0, frags: 0, shotPerFrag: 0 }, visible)

</script>


<style lang="scss" scoped>
@import '@/styles/mixins.scss';

.damage {
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