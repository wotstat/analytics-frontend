<template>
  <div class="line">
    <h3>Количество боёв по винрейту</h3>
    <div class="card">
      <div class="charts">
        <BattlesPerWinrateChart v-for="(series, index) in data" :key="index" :data="series"
          :color="bloggerColors[index]" :hover-sync="hoverSync" />
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { HoverSynchronizer } from '@/shared/uiKit/chart/universalChart/interaction/composable/sync/HoverSynchronizer'
import { markRaw } from 'vue'
import BattlesPerWinrateChart from './BattlesPerWinrateChart.vue'

defineProps<{
  data: number[][],
}>()

const bloggerColors = ['#ff00fb', '#ffe100', '#ff0000', '#009dff']
const hoverSync = markRaw(new HoverSynchronizer())
</script>


<style lang="scss" scoped>
h3 {
  margin: 0;
  margin-bottom: 5px;
}

.charts {
  display: flex;
  gap: 1rem;

  @media (max-width: 600px) {
    flex-direction: column;
  }

  > * {
    min-width: 0;
    flex: 1;
  }
}
</style>
