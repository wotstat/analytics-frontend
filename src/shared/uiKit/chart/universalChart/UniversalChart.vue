<template>
  <div class="chart-container" ref="container"></div>
</template>


<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef, watch } from 'vue'
import { UniversalChart } from './UniversalChart'

const container = useTemplateRef<HTMLDivElement>('container')

const props = defineProps<{
  chart: UniversalChart
}>()

watch(() => props.chart, (next, previous) => {
  previous.dispose()
  if (container.value) next.attach(container.value)
})

onMounted(() => {
  if (container.value) props.chart.attach(container.value)
})

onUnmounted(() => {
  props.chart.dispose()
})
</script>


<style lang="scss" scoped></style>