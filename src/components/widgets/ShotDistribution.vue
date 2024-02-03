<template>
  <div class="chart-container" ref="container">
    <ShadowLine :data="chartData" :options="options" />
  </div>
</template>

<script setup lang="ts">
import { queryAsync } from '@/db';
import { useElementVisibility } from '@vueuse/core';
import { computed, ref } from 'vue';
import { type ChartProps } from 'vue-chartjs';
import { ShadowLine } from "@/components/ShadowLineController";
import { BloomColor } from '../bloomColors';
import { StatParams, whereClause } from '@/composition/useQueryStatParams';

const container = ref<HTMLElement | null>(null);
const visible = useElementVisibility(container);

const { params } = defineProps<{
  params?: StatParams
}>()

function getQuery(isServer: boolean) {
  const r = isServer ? 'ballisticResultServer_r' : 'ballisticResultClient_r'
  return `
  select r,
       sum(count) over (rows between unbounded preceding and current row) as cum,
       round(cum / sum(count) over (), 2)                                 as percent
  from (select round(${r}, 2) as r, count() as count
      from Event_OnShot
      where ${r} < 1 ${params ? whereClause(params, { withWhere: false }) : ''}
      group by r
      order by r);`
}

type Row = { r: number, cum: number, percent: number }
function calc(data: Row[]) {
  const res = new Array(100).fill(null)

  for (const row of data) {
    res[row.r * 100] = row.percent * 100
  }
  return res
}

const clientMarkerResult = queryAsync<Row>(getQuery(false), visible)
const serverMarkerResult = queryAsync<Row>(getQuery(true), visible)

const clientMarker = computed(() => calc(clientMarkerResult.value))
const serverMarker = computed(() => calc(serverMarkerResult.value))

const labels = new Array(100).fill(0).map((_, i) => i);

const chartData = computed<ChartProps<'line'>['data']>(() => ({
  labels,
  datasets: [
    {
      data: serverMarker.value,
      label: 'Серверный',
      borderColor: BloomColor.gold.bloom,
      backgroundColor: BloomColor.gold.darken,
    },
    {
      data: clientMarker.value,
      label: 'Клиентский',
      borderColor: BloomColor.green.bloom,
      backgroundColor: BloomColor.green.main,
    }
  ]
}))

const options: ChartProps<'line'>['options'] = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      min: 0,
      max: 100,
      ticks: {
        callback: (v, i, t) => `${v}%`,
        stepSize: 20
      }
    },
    x: {
      min: 0,
      max: 100,
      ticks: {
        maxRotation: 0,
        callback: (v, i, t) => {
          if (typeof v !== 'number') return null

          if (v === 50) return 'Половина'
          if (v === 33) return 'Треть'
          if (v === 66) return 'Две трети'

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
          const v = t[0].raw as number
          return `${v.toFixed(0)}% снарядов попало в ${t[0].label}% сведения`
        }
      }
    }
  }
}

</script>