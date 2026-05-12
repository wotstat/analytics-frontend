<template>
  <div class="charts">
    <div class="chart">
      <h3>Очки по дням</h3>
      <Chart ref="chartElement" />
    </div>
    <div class="chart">
      <h3>Бои по дням</h3>
      <Chart />
    </div>
  </div>
</template>


<script setup lang="ts">
import Chart from '@/shared/uiKit/chart/Chart.vue'
import { MultiLineChart, SimpleLine } from '@/shared/uiKit/chart/plugins/plots/multiLine/MultiLine'
import { onMounted, ref } from 'vue'


const chartElement = ref<InstanceType<typeof Chart> | null>(null)

const props = defineProps<{}>()

onMounted(() => {
  if (!chartElement.value) return

  const chart = chartElement.value.chart

  const multiLine = new MultiLineChart({})
  const sinLine = new SimpleLine(new Array(1000).fill(0).map((_, i) => ({ x: i, y: Math.sin(i / 10) * 50 + 50 })), ['sin'])
  const randomLine = new SimpleLine(new Array(100).fill(0).map((_, i) => ({ x: i * 10, y: 20 + Math.random() * 50 })), ['random'])

  multiLine.addLine(sinLine)
  multiLine.addLine(randomLine)

  chart.addPlugin(multiLine)

})
</script>


<style lang="scss" scoped>
.charts {
  display: flex;
  gap: 20px;
  padding: 20px 20px;
  cursor: default;

  .chart {
    flex: 1;
    background-color: rgba(0, 0, 0, 0.602);
    padding: 10px;
    border-radius: 4px;
    aspect-ratio: 2 / 1;

    display: flex;
    flex-direction: column;

    h3 {
      margin: 0 0 10px 0;
      font-size: 16px;
    }

    :deep(.line) {
      stroke-width: 2px;

      &.sin {
        stroke: rgb(24, 169, 247);
      }

      &.random {
        stroke-width: 1px;
        stroke: rgb(255, 153, 0);
      }
    }
  }
}
</style>