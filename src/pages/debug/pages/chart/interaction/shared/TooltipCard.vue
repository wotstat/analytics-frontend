<template>
  <Teleport to="body">
    <div class="tooltip-card" :style="style">
      <div class="row" v-for="(row, index) in rows" :key="index">
        <span class="dot" :class="row.series"></span>

        <template v-if="row.datum">
          <span class="value">{{ row.datum.y.toFixed(1) }}</span>
          <span class="dim">x {{ row.datum.x }}</span>
          <span class="dim">{{ row.datum.label }}</span>
          <span class="dim">#{{ row.pointIndex }}</span>
          <span class="dim">{{ row.distance.toFixed(0) }}px</span>
        </template>

        <span class="dim" v-else>курсор · distance ∞</span>
      </div>

      <div class="dim foot">
        {{ ctx.isTouch ? 'палец' : 'мышь' }} ·
        pivot {{ ctx.pivot.x.toFixed(0) }}, {{ ctx.pivot.y.toFixed(0) }} ·
        cursor {{ ctx.cursor.clientX.toFixed(0) }}, {{ ctx.cursor.clientY.toFixed(0) }}
      </div>
    </div>
  </Teleport>
</template>


<script setup lang="ts">
import { computed } from 'vue'
import { TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { ComposedHit } from './MultiLineChart'
import { LinePoint } from './linePoints'
import { seriesClass } from './tooltipSeries'

const props = defineProps<{
  ctx: TooltipCtx<ComposedHit>
}>()

type Row = {
  datum: LinePoint | null
  series: string
  pointIndex: number
  distance: number
}

// Строки идут ровно в selection order: ChartTooltip ничего не сортирует
const rows = computed<Row[]>(() => props.ctx.hits.map(hit => hit.kind === 'cursor'
  ? { datum: null, series: 'cursor', pointIndex: -1, distance: hit.distance }
  : { datum: hit.datum, series: seriesClass(hit.datum), pointIndex: hit.pointIndex, distance: hit.distance }))

// pivot в клиентских координатах, поэтому карточка позиционируется fixed
const style = computed(() => ({ left: `${props.ctx.pivot.x}px`, top: `${props.ctx.pivot.y}px` }))

</script>


<style scoped lang="scss">
.tooltip-card {
  position: fixed;
  z-index: 100;
  transform: translate(14px, 14px);
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 7px;
  border-radius: 5px;
  background: #1c1c1ee6;
  border: 1px solid #ffffff20;
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
    flex: none;

    &.s1 {
      background: #57ff6e;
    }

    &.s2 {
      background: #ffb057;
    }

    &.cursor {
      background: transparent;
      border: 1px solid #ffffff80;
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
