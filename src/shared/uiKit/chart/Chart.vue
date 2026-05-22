<template>
  <div class="chart-container" ref="chartContainer"></div>
</template>


<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Chart } from './Chart'

const chartContainer = ref<HTMLDivElement | null>(null)
const chart = new Chart()

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