<template>
  <div class="chart-container">
    <ShadowLine :data="chartData" :options="options" />
  </div>
</template>

<script setup lang="ts">
import { query } from '@/db';
import { computedAsync } from '@vueuse/core';
import { computed } from 'vue';
import { type ChartProps } from 'vue-chartjs';
import { ShadowLine } from "@/components/ShadowLineController";


function getQuery(isServer: boolean) {
  const r = isServer ? 'ballisticResultServer_r' : 'ballisticResultClient_r'
  return `
  select r,
       sum(count) over (rows between unbounded preceding and current row) as cum,
       round(cum / sum(count) over (), 2)                                 as percent
  from (select round(${r}, 2) as r, count() as count
      from Event_OnShot
      where ${r} < 1
      group by r
      order by r);`
}

async function calc(isServer: boolean) {
  const { data } = await query<{ r: number, cum: number, percent: number }>(getQuery(isServer))

  const res = new Array(100).fill(null)

  for (const row of data) {
    res[row.r * 100] = row.percent * 100
  }
  return res
}

const clientMarker = computedAsync(async () => await calc(false), []);
const serverMarker = computedAsync(async () => await calc(true), [])

const labels = new Array(100).fill(0).map((_, i) => i);

const chartData = computed<ChartProps<'line'>['data']>(() => ({
  labels,
  datasets: [
    {
      data: serverMarker.value,
      label: 'Server',
      // borderColor: '#ce2021',
      // backgroundColor: '#ffe7e7',
      borderColor: '#f73c08',
      backgroundColor: '#ffdd9c',
    },
    {
      data: clientMarker.value,
      label: 'Client',
      // borderColor: '#5249c6',
      // backgroundColor: '#eff3ff',
      borderColor: '#639e31',
      backgroundColor: '#e7ffde',
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