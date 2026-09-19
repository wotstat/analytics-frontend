<template>
  <div class="history-tooltip">
    <b class="heading">{{ availableSlots[point.slot].label }}</b>
    <div class="date">{{ formatHistoryPeriod(point.periodStart, point.periodEnd, point.step) }}</div>
    <div v-for="row in rows" :key="row.source.tag" class="value-row" :class="{ missing: !row.point }">
      <span class="source">
        <span class="dot" :class="{ highlighted: row.highlighted }"
          :style="{ backgroundColor: row.source.color }"></span>
        <span>{{ row.source.name }}</span>
      </span>
      <b v-if="row.point">{{ formatSlotValue(row.point.slot, row.point.y) }}</b>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { availableSlots, formatSlotValue } from '../vehicleListTable/helpers'
import { formatHistoryPeriod } from '../timeSeries/formatHistoryPeriod'
import type { VehicleHistoryHit } from '../timeSeries/VehicleHistoryChart'
import type { ComparisonSource } from './types'

const props = defineProps<{ ctx: TooltipCtx<VehicleHistoryHit>, sources: readonly ComparisonSource[] }>()
const point = computed(() => props.ctx.hit.datum)
const rows = computed(() => {
  const hits = new Map(props.ctx.hits.map(hit => [hit.datum.series, hit]))
  return props.sources.map(source => {
    const hit = hits.get(source.tag)
    return {
      source,
      point: hit?.datum,
      highlighted: hit !== undefined && props.ctx.highlights.some(highlight => highlight.isHighlighted(hit)),
    }
  })
})
</script>

<style scoped lang="scss">
.history-tooltip {
  max-width: min(320px, calc(100vw - 40px));
  max-height: 50vh;
  overflow-y: auto;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
}

.heading {
  color: white;
  overflow-wrap: anywhere;
}

.source {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-wrap: anywhere;
}

.dot {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  transition: transform 0.15s;

  &.highlighted {
    transform: scale(1.4);
  }
}

.date,
.missing {
  color: rgba(255, 255, 255, 0.5);
}

.date {
  margin-bottom: 6px;
}

.value-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;

  b {
    color: white;
    white-space: nowrap;
  }
}
</style>
