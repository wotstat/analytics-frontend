<template>
  <div class="tooltip-card">
    <div class="row" v-for="point in ctx.nearestDataPoints" :key="point.sourceIndex">
      <span class="dot" :class="`s${point.sourceIndex}`"></span>
      <span class="value">{{ point.yValue.toFixed(1) }}</span>
      <span class="dim">x {{ point.xValue.toFixed(0) }}</span>
      <span class="dim">#{{ point.pointIndex }}</span>
      <span class="dim">{{ point.distance.toFixed(0) }}px</span>
    </div>

    <div class="dim foot" v-if="!compact">
      {{ ctx.isTouch ? 'палец' : 'мышь' }} ·
      pivot {{ ctx.pivot.x.toFixed(0) }}, {{ ctx.pivot.y.toFixed(0) }} ·
      cursor {{ ctx.cursor.clientX.toFixed(0) }}, {{ ctx.cursor.clientY.toFixed(0) }}
    </div>
  </div>
</template>


<script setup lang="ts">
import { TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'

defineProps<{
  ctx: TooltipCtx
  compact?: boolean
}>()

</script>


<style scoped lang="scss">
.tooltip-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px 4px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  .row {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #02afff;

    &.s1 {
      background: #57ff6e;
    }

    &.s2 {
      background: #ffb057;
    }
  }

  .value {
    font-weight: bold;
    color: white;
  }

  .dim {
    color: #ffffff80;
    font-size: 11px;
  }

  .foot {
    font-size: 10px;
  }
}
</style>
