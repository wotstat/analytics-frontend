<template>
  <div class="chart-container" ref="chartContainer"></div>
</template>


<script setup lang="ts">
import { onMounted, ref } from 'vue'
import BaseChart from './BaseChart'

const chartContainer = ref<HTMLDivElement | null>(null)
const chart = new BaseChart()

onMounted(() => {
  chart.attach(chartContainer.value!)
})

defineExpose({
  chart
})

</script>


<style lang="scss" scoped>
.chart-container {}
</style>