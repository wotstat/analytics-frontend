<template>
  <SeriesTooltip :items="rows" :format-value="value => formatValue(value, ctx)">
    <template v-if="$slots.header" #header="layout">
      <slot name="header" v-bind="layout" :ctx />
    </template>
  </SeriesTooltip>
</template>

<script setup lang="ts" generic="TPoint extends TimeSeriesPoint, TItem extends LegendItem">
import { computed } from 'vue'
import type { TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import type { TimeSeriesHit } from '../chart/TimeSeriesChart'
import type { TimeSeriesPoint } from '../chart/timeSeries'
import type { LegendItem } from '../../legend/useLegend'
import SeriesTooltip from '../../tooltip/SeriesTooltip.vue'

const props = defineProps<{
  ctx: TooltipCtx<TimeSeriesHit<TPoint>>
  sources: readonly TItem[]
  formatValue: (value: number, ctx: TooltipCtx<TimeSeriesHit<TPoint>>) => string
}>()

const rows = computed(() => {
  const hits = new Map(props.ctx.hits.map(hit => [hit.interactionTag, hit]))
  return props.sources.map(source => {
    const hit = hits.get(source.tag)
    return {
      ...source,
      value: hit?.datum.y,
      highlighted: hit !== undefined && props.ctx.highlights.some(highlight => highlight.isHighlighted(hit)),
    }
  })
})
</script>
