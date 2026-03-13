<template>
  <div class="onslaught-page">
    <NicknameInput :syncToRoute="true" class="nickname" />

    <DayChart :days="[0.8, 0.9, 0.5, 0.84]" class="day-chart" @select="selectDay" :selectedIndex="selectedDayIndex" />
  </div>
</template>


<script setup lang="ts">
import { onMounted, ref } from 'vue'
import NicknameInput from './nicknameInput/NicknameInput.vue'
import DayChart from './dayChart/DayChart.vue'

const selectedDayIndex = ref<number | null>(null)

function selectDay(index: number) {
  if (selectedDayIndex.value === index) selectedDayIndex.value = null
  else selectedDayIndex.value = index
}

const days = [
  { value: 0.8 }
]

onMounted(() => {

})
</script>


<style lang="scss" scoped>
.onslaught-page {
  margin-top: 1em;

  .nickname {
    max-width: 200px;
  }

  .day-chart {
    margin-top: 20px;
  }
}
</style>