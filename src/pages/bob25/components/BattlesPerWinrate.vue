<template>
  <div class="line">
    <h3>Количество боёв по винрейту</h3>
    <div class="card">

      <div class="charts">
        <div class="chart-container" v-for="data in chartData">
          <ShadowBar :data="data" :options />
        </div>
      </div>

    </div>
  </div>
</template>


<script setup lang="ts">
import { ShadowBar } from "@/components/widgets/charts/ShadowBarController";
import { computed } from "vue";
import { ChartProps } from "vue-chartjs";

const props = defineProps<{
  data: number[][],
}>()

const bloomColors = ['#ff00fb', '#ff0000', '#009dff', '#ffe100']

const chartData = computed<ChartProps<'bar'>['data'][]>(() => {

  return props.data.map((data, i) => ({
    labels: new Array(data.length).fill(0).map((_, i) => i),
    datasets: [
      {
        data,
        backgroundColor: '#fff',
        borderColor: bloomColors[i],
      }
    ]
  }))
})

const options = computed<ChartProps<'bar'>['options']>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  scales: {
    y: {
      display: false,
      min: 0,
    }, x: {
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
          return index % 25 == 0 ? value : '';
        }
      }
    }
  },
  interaction: {
    intersect: false,
    mode: 'index'
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        title: function (context) {
          return `Винрейт: ${context[0].label}%`
        },
        label: function (context) {
          return `Боёв: ${Math.round(context.raw as number * 10000) / 100}%`
        }
      }
    }
  }
}))

</script>


<style lang="scss" scoped>
h3 {
  margin: 0;
  margin-bottom: 5px;
}

.charts {
  display: flex;
  gap: 1rem;

  .chart-container {
    aspect-ratio: 1;
  }

  @media (max-width: 600px) {
    flex-direction: column;

    .chart-container {
      aspect-ratio: 1.8;
    }
  }
}
</style>