<template>
  <div class="card">
    <div class="chart-container">
      <ShadowLine :data="chartData" :options="options" />
    </div>
  </div>
</template>


<script setup lang="ts">

import { ShadowLine } from "@/components/widgets/charts/ShadowLineController";
import { computed, ref } from "vue";
import { ChartProps } from "vue-chartjs";
import { bloggerNamesArray } from "./bloggerNames";
import { sec2hour, timeProcessor } from "@/utils";


const bloggerColors = [
  ['#f5f', '#ff1aaf00'],
  ['#ff2a2a', '#f7101000'],
  ['#1679ff', '#0040ff00'],
  ['#fffb35', '#fffb1c00'],
]

// const bloggerColors = [
//   ['#fff', '#ff1aafaa'],
//   ['#fff', '#f71010aa'],
//   ['#fff', '#0040ffaa'],
//   ['#fff', '#fffb1caa'],
// ]



const b1 = new Array(3000).fill(0).map((_, i) => i / 1000 + Math.sin(i / 100) * 0.5 + 0.5)
const b2 = new Array(3000).fill(0).map((_, i) => i / 900 + Math.sin(i / 150) * 0.5 + 0.5)
const b3 = new Array(3000).fill(0).map((_, i) => i / 800 + Math.sin(i / 200) * 0.5 + 0.5)
const b4 = new Array(3000).fill(0).map((_, i) => i / 700 + Math.sin(i / 250) * 0.5 + 0.5)

let i = ref(3000)

const chartData = computed<ChartProps<'bar' | 'line'>['data']>(() => {
  i.value
  const datasets: ChartProps<'bar' | 'line'>['data']['datasets'] =

    [b1, b2, b3, b4].map((data, i) => ({
      data,
      label: bloggerNamesArray[i],
      backgroundColor: bloggerColors[i][0],
      borderColor: bloggerColors[i][1]
    }))

  return {
    labels: new Array(3000).fill(0).map((_, i) => i),
    datasets: datasets
  }
})

setInterval(() => {
  b1.shift(); b2.shift(); b3.shift(); b4.shift()
  b1.push(i.value / 1000 + Math.sin(i.value / 100) * 0.5 + 0.5)
  b2.push(i.value / 900 + Math.sin(i.value / 150) * 0.5 + 0.5)
  b3.push(i.value / 800 + Math.sin(i.value / 200) * 0.5 + 0.5)
  b4.push(i.value / 700 + Math.sin(i.value / 250) * 0.5 + 0.5)
  i.value++
}, 1000)


const options = computed<ChartProps<'bar'>['options']>(() => ({
  responsive: true,
  animation: false,
  scales: {
    y: { display: false },
    x: {
      grid: {
        display: true,
        drawTicks: false,
        color: (context) => context.tick && context.tick.label ? 'rgba(255,255,255,0.05)' : 'transparent'
      },
      min: 0,
      ticks: {
        autoSkip: false,
        maxRotation: 0,
        callback: function (value, index, ctx) {
          return index > ctx.length * 0.01 && index < ctx.length * 0.99 &&
            (i.value + index - 1500) % 120 == 0 ? `${timeProcessor(i.value + index - 1500).join(':')}` : '';
        }
      }
    },
  },
  interaction: {
    intersect: false,
    mode: 'index',
  },
  labels: {
    enabled: true,
  },
  elements: {
    point: {
      pointStyle: false
    },
    line: {
      tension: 0.3,
      borderWidth: 2,
    },
  },
  plugins: {
    legend: {
      display: true,
    },
  },
}))


</script>


<style lang="scss" scoped>
.b1,
.b2,
.b3,
.b4 {
  width: 20px;
  height: 20px;
  background-color: antiquewhite;
}

.b1 {
  background-color: #ff1aaff7;
}

.b2 {
  background-color: #f71010fc;
}

.b3 {
  background-color: #0040fff6;
}

.b4 {
  background-color: #fffb1ced;
}

.chart-container {
  aspect-ratio: 2;
}
</style>