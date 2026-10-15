<template>
  <div class="live" v-if="isConnected && liveUpdate"
    v-tooltip.instant.bottom-float="{ class: 'comp7-tooltip', text: 'Таблица автоматически синхронизируется с сервером' }">
    {{ liveUpdate.text }}
  </div>
</template>


<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  lastRecalculation: string | null
  isConnected: boolean
  seasonInterval: { start: Date, end: Date, length: number } | null
  leaderboardDay: { day: string, recalculation: string, lastRank: number } | null
}>()

const liveUpdate = computed(() => {
  if (!props.lastRecalculation) return null
  if (!props.seasonInterval) return null
  if (!props.leaderboardDay) return null

  const seasonEnd = props.seasonInterval.end
  const recalculationDate = new Date(props.lastRecalculation + 'Z')
  const lastLoadedDate = new Date(props.leaderboardDay.recalculation + 'Z')

  if (Date.now() > (seasonEnd.getTime() + 1000 * 60 * 60 * 24)) return { text: 'Сезон закончился' }

  if (recalculationDate.getTime() == lastLoadedDate.getTime()) return { text: 'LIVE' }

  return { text: 'Можно обновить' }
})


</script>


<style lang="scss" scoped>
.live {
  margin-left: 5px;
  padding: 0 6px;
  background-color: #2ca062;
  color: white;
  font-size: 12px;
  font-weight: bold;
  border-radius: 5px;
  cursor: help;
}

.tooltip {
  padding: 10px;
  font-size: 14px;
  color: white;
  max-width: 220px;
  line-height: 1.2;
}
</style>
