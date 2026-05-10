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
import { Line, DataSource } from '@/shared/uiKit/chart/plugins/line/Line'
import { SimpleLayout } from '@/shared/uiKit/chart/plugins/simpleLayout/SimpleLayout'
import { onMounted, ref } from 'vue'

const chartElement = ref<InstanceType<typeof Chart> | null>(null)

const props = defineProps<{}>()

const dataSource: DataSource = {
  getPointsCount() {
    return 100
  },
  getPoint(index: number) {
    return { x: index, y: Math.random() * 100 }
  }
}

onMounted(() => {
  if (!chartElement.value) return

  const chart = chartElement.value.chart


  chart.addPlugin(
    new SimpleLayout()
      .addSpacedPlugin(new Line(dataSource))
  )


})
</script>


<style lang="scss" scoped>
.charts {
  display: flex;
  gap: 20px;
  padding: 20px 20px;

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
  }
}
</style>