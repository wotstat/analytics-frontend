<template>
  <div class="live" v-if="lastUpdate.data && liveUpdate" ref="item">{{ liveUpdate.text }}</div>

  <PopoverAutoClose v-if="liveUpdate && liveUpdate.isLive" :target="item" v-model="hover" :placement="['bottom-float']"
    :viewport-offset="{ top: headerOffset, bottom: 10, left: 10, right: 10 }" :arrow-size="7" :offset="{ top: 7 }"
    :class="'transparent-tooltip'">
    <div class="tooltip">
      Таблица автоматически синхронизируется с сервером
    </div>
  </PopoverAutoClose>

</template>


<script setup lang="ts">
import { headerOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import { useAnalyticsRealtime } from '@/shared/external/realtime/useAnalyticsRealtime'
import PopoverAutoClose from '@/shared/uiKit/popover/PopoverAutoClose.vue'
import { useElementHover } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  region: string
  seasonInterval: { start: Date, end: Date, length: number } | null
  leaderboardDay: { day: string, recalculation: string, lastRank: number } | null
}>()

const item = ref<HTMLElement | null>(null)
const hover = useElementHover(item)

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

  const seasonEnd = new Date(props.seasonInterval.end + 'Z')
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
}

.tooltip {
  padding: 10px;
  font-size: 14px;
  color: white;
  max-width: 220px;
  line-height: 1.2;
}
</style>