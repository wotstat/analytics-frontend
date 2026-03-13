<template>
  <div class="chart nice-scrollbar">
    <div class="bars">
      <Bar v-for="(day, index) in props.days" :key="index" :value="day" @click="emit('select', index)"
        :selected="index === props.selectedIndex" />
    </div>
  </div>
</template>


<script setup lang="ts">
import Bar from './Bar.vue'


const props = defineProps<{
  days: number[]
  selectedIndex: number | null
}>()

const emit = defineEmits<{
  'select': [number]
}>()
</script>


<style lang="scss" scoped>
.chart {
  height: 300px;
  width: 100%;
  overflow-x: auto;
  padding-bottom: 10px;

  .bars {
    height: 100%;

    display: flex;
    align-items: flex-end;
    gap: 2px;
    padding: 0 15px;
  }
}
</style>