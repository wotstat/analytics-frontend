<template>
  <div class="live" v-if="lastUpdate.data && lastUpdate.status.value == 'OPEN' && liveUpdate"
    v-tooltip.instant.bottom-float="{ class: 'comp7-tooltip', text: 'Таблица автоматически синхронизируется с сервером', viewportOffset }">
    {{ liveUpdate.text }}
  </div>
</template>


<script setup lang="ts">
import { popoverViewportOffset as viewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import { useAnalyticsRealtime } from '@/shared/external/realtime/useAnalyticsRealtime'
import { computed, watch } from 'vue'
import { vTooltip } from '@/shared/uiKit/tooltip/textTooltip'

const props = defineProps<{
  region: string
  seasonInterval: { start: Date, end: Date, length: number } | null
  leaderboardDay: { day: string, recalculation: string, lastRank: number } | null
}>()


const emit = defineEmits<{
  mayUpdate: []
}>()

const lastUpdate = useAnalyticsRealtime('comp7LastRecalculation')
const liveUpdate = computed(() => {
  if (!lastUpdate.data.value) return null

  const current = lastUpdate.data.value[props.region]
  if (!current) return null
  if (!props.seasonInterval) return null
  if (!props.leaderboardDay) return null

  const seasonEnd = props.seasonInterval.end
  const recalculationDate = new Date(current.recalculation + 'Z')
  const lastLoadedDate = new Date(props.leaderboardDay.recalculation + 'Z')

  if (Date.now() > (seasonEnd.getTime() + 1000 * 60 * 60 * 24)) return { text: 'Сезон закончился' }

  if (recalculationDate.getTime() == lastLoadedDate.getTime()) return { text: 'LIVE', isLive: true }

  return { text: 'Можно обновить', mayUpdate: true }
})


watch(liveUpdate, (value, old) => {
  if (value?.mayUpdate && !old?.mayUpdate) emit('mayUpdate')
}, { immediate: true })


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