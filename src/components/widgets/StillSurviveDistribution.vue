<template>
  <ServerStatusWrapper :status="query.status" v-slot="{ status, showError }">
    <div v-if="status != 'error'" class="chart-container" ref="container">
      <ShadowLine :data="chartData" :options="options" />
    </div>
    <div class="flex flex-1 center pointer" v-else @click="showError">
      <p class="card-main-info error">!</p>
    </div>
  </ServerStatusWrapper>
</template>


<script setup lang="ts">

import { ShadowLine } from "@/components/ShadowLineController";
import { computed, ref } from "vue";
import { ChartProps } from "vue-chartjs";
import { BloomColor } from "../bloomColors";
import { loading, queryAsync } from "@/db";
import { useElementVisibility } from "@vueuse/core";
import { StatParams, whereClause } from "@/composition/useQueryStatParams";
import ServerStatusWrapper from "../ServerStatusWrapper.vue";

const container = ref<HTMLElement | null>(null);
const enabled = useElementVisibility(container);

const { params } = defineProps<{
  params?: StatParams
}>()

const query = queryAsync<{ canSurvive: number, roundedHealthDamage: number, cumSurvice: number }>(`
select canSurvive,
       canKill,
       round(normalizedHelthDamage * 25) / 25 * 0.25 as roundedHealthDamage,
       toUInt32(count(*)) as count,
       sum(count) over (partition by canSurvive order by roundedHealthDamage * if(canSurvive, -1, 1) rows between UNBOUNDED PRECEDING and current row) as cumSurvice
from (select rHealth = 0                                      as isKilled,
             round(shellDamage + shellDamage * damageRandomization * 1.00001)  as maxPossible,
             round(shellDamage - shellDamage * damageRandomization * 1.00001)  as minPossible,
             rHealth + damage                                 as healthBeforeShot,
             isKilled and healthBeforeShot >= minPossible     as canSurvive,
             not isKilled and healthBeforeShot <= maxPossible as canKill,
             ((healthBeforeShot + if(isKilled, -0.5, +0.5)) / shellDamage - 1) as helthBeforeShotRelativeDmg,
             helthBeforeShotRelativeDmg / damageRandomization as normalizedHelthDamage
      from Event_OnShot
          array join
           results.shotHealth as rHealth,
           results.shotDamage as damage
      where shellTag != 'HIGH_EXPLOSIVE' and shellTag != 'FLAME'
        and damage > 0
        and (canSurvive or canKill)
        ${params ? whereClause(params, { withWhere: false }) : ''})
group by canSurvive, canKill, roundedHealthDamage
order by canSurvive, roundedHealthDamage desc
`, { enabled });

const processed = computed(() => {
  const canSurviveObj = Object.fromEntries(query.value.data.filter(r => r.canSurvive).map(r => [r.roundedHealthDamage, r.cumSurvice]))
  const canKillObj = Object.fromEntries(query.value.data.filter(r => !r.canSurvive).map(r => [r.roundedHealthDamage, r.cumSurvice]))

  const canSurvive = new Array(51).fill(0)
  const canKill = new Array(51).fill(0)
  let lastSurvive = 0
  let lastKill = 0

  for (let i = -25; i <= 25; i++) {
    const keySurvive = -i / 50 * 0.5
    const keyKill = i / 50 * 0.5

    const survive = canSurviveObj[keySurvive] ?? lastSurvive
    const kill = canKillObj[keyKill] ?? lastKill

    lastSurvive = survive
    lastKill = kill

    canSurvive[25 - i] = survive
    canKill[25 + i] = kill
  }
  return { canSurvive, canKill }
})

const isLoading = computed(() => query.value.status === loading)

const chartData = computed<ChartProps<'line'>['data']>(() => ({
  labels: new Array(51).fill(0).map((_, i) => i),
  datasets: [
    {
      data: processed.value.canSurvive,
      label: 'Могли выжить',
      borderColor: !isLoading.value ? BloomColor.green.bloom : '#e5e5e5',
      backgroundColor: !isLoading.value ? BloomColor.green.main : '#e5e5e5',
    },
    {
      data: processed.value.canKill,
      label: 'Можно было добить',
      borderColor: !isLoading.value ? BloomColor.red.bloom : '#e5e5e5',
      backgroundColor: !isLoading.value ? BloomColor.red.main : '#e5e5e5',
    }
  ]
}))

const options: ChartProps<'line'>['options'] = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      display: false,
    },
    x: {
      ticks: {
        maxRotation: 0,
        callback: (v, i, t) => {
          if (typeof v !== 'number') return null

          if (v === 25) return '0'
          if (v % 5 == 0) {
            return `${v < 25 ? '' : '+'}${v - 25}%`
          }
          return null
        },
      },
    }
  },
  elements: {
    point: {
      pointStyle: false
    },
    line: {
      borderWidth: 3,
    }
  },
  interaction: {
    intersect: false,
    mode: 'index',
  },
  plugins: {
    tooltip: {
      callbacks: {
        title: (t) => {
          const label = Number.parseInt(t[0].label) - 25
          return `Если бы урон проходил ${label > 0 ? '+' : ''}${label}% от базового`
        },
        label: (t) => {
          const v = t.raw as number
          const canSurvive = t.dataset.label == chartData.value.datasets[0].label
          if (canSurvive) {
            return `То вы бы потеряли ${v} фрагов`
          } else {
            return `То вы бы получили дополнительных ${v} фрагов`
          }
        }
      }
    },
  }
}
</script>
