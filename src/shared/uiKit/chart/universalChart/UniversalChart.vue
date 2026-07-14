<template>
  <div class="chart-container" ref="container"></div>
</template>


<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef } from 'vue'
import { UniversalChart } from './UniversalChart'

const container = useTemplateRef<HTMLDivElement>('container')

const props = defineProps<{
  chart: UniversalChart
}>()

onMounted(() => {
  if (container.value) props.chart.attach(container.value)
})

onUnmounted(() => {
  props.chart.dispose()
})
</script>


<style lang="scss" scoped></style>