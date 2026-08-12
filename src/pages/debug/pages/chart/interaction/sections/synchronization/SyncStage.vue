<template>
  <div class="sync-stage">
    <h3>{{ title }}</h3>

    <DemoChartView :chart="chart" :height="220" />

    <div class="debug-row readout">
      <span class="debug-label">local</span>
      <span class="debug-value">{{ hitsLabel(localHits) }}</span>
    </div>

    <div class="debug-row readout">
      <span class="debug-label">synced</span>
      <span class="debug-value">{{ hitsLabel(syncedHits) }}</span>
    </div>

    <TooltipCard :ctx="tooltipCtx" v-if="tooltipCtx" />
  </div>
</template>


<script setup lang="ts">
import { onUnmounted, shallowRef } from 'vue'
import { TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import DemoChartView from '../../shared/DemoChartView.vue'
import TooltipCard from '../../shared/TooltipCard.vue'
import type { SyncChart, SyncHit } from '../../shared/SyncChart'

const props = defineProps<{
  chart: SyncChart
  title: string
}>()

const localHits = shallowRef<readonly SyncHit[]>([])
const syncedHits = shallowRef<readonly SyncHit[]>([])
// Своя карточка на каждый график: у A и B может быть непустой ctx одновременно
// (local — на наведённом, synced — на фолловере), общая карточка на двоих их бы перетирала
const tooltipCtx = shallowRef<TooltipCtx<SyncHit> | null>(null)

function hitsLabel(hits: readonly SyncHit[]) {
  return hits.length === 0 ? 'пусто' : hits.map(hit => `x=${hit.datum.x}, y=${hit.datum.y.toFixed(0)}`).join(' · ')
}

const stopLocal = props.chart.onLocalHits.on(next => localHits.value = next)
const stopSynced = props.chart.onSyncedHits.on(next => syncedHits.value = next)
const stopTooltip = props.chart.onTooltip.on(next => tooltipCtx.value = next)

onUnmounted(() => {
  stopLocal()
  stopSynced()
  stopTooltip()
})

</script>


<style scoped lang="scss">
.sync-stage {
  display: flex;
  flex-direction: column;
  gap: 0.4em;

  h3 {
    font-size: 1em;
    margin: 0;
  }

  .readout {
    align-items: baseline;
    gap: 0.6em;
  }
}
</style>
