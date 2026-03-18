<template>
  <div class="chart nice-scrollbar">
    <div class="bars">
      <Bar v-for="(day, index) in props.days" :key="index" :value="day" @click="click(index)"
        :selected="index === props.selectedIndex" />
    </div>
  </div>
</template>


<script setup lang="ts">
import { DayChartData } from '../types'
import Bar from './Bar.vue'


const props = defineProps<{
  days: DayChartData[]
  selectedIndex: number | null
}>()

const emit = defineEmits<{
  'select': [number],
  'deselect': []
}>()

function click(index: number) {
  if (props.days[index].timeline != 'played') return emit('deselect')
  if (props.selectedIndex === index) return emit('deselect')
  emit('select', index)
}
</script>


<style lang="scss" scoped>
.chart {
  height: 300px;
  overflow-x: scroll;
  padding-bottom: 10px;

  &::-webkit-scrollbar-track {
    margin: 0 var(--content-page-margin, 0);
  }

  .bars {
    height: 100%;
    box-sizing: border-box;

    display: flex;
    align-items: flex-end;
    gap: 2px;
    padding: 0 var(--content-page-margin, 0);
    padding-top: 30px;

    min-width: 100%;
    width: max-content;
  }
}
</style>