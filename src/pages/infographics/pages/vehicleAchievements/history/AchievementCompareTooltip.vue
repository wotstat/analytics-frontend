<template>
  <div class="achievement-compare-tooltip" :class="{ single: metrics.length === 1 }">
    <div class="header">
      <span class="period">{{ period }}</span>
      <span v-if="gameVersion" class="game-version">{{ gameVersion }}</span>
    </div>

    <table class="values">
      <thead v-if="metrics.length > 1">
        <tr>
          <th><Icon icon="tank" class="metric-icon" /></th>
          <th v-for="metric in metrics" :key="metric">
            <Icon :icon="availableSlots[metric].icon" class="metric-icon" />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="source in rows" :key="source.tag" :style="{ '--source-color': source.color }">
          <td class="source-cell" :class="{ missing: source.missing }">
            <span class="source">
              <span class="dot" :class="{ highlighted: source.highlighted }"></span>
              <span class="name">{{ source.name }}</span>
            </span>
          </td>
          <td v-for="cell in source.cells" :key="cell.slot" class="value"
            :class="{ highlighted: metrics.length > 1 && cell.highlighted, missing: cell.value == null }">
            {{ formatSlotValue(cell.slot, cell.value) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/shared/game/components/efficiencyIcon/Icon.vue'
import type { TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import type { VehicleHistoryHit } from '../../vehicles/timeSeries/VehicleHistoryChart'
import type { ComparisonSource } from '../../vehicles/timeSeriesCompare/types'
import { formatHistoryPeriod } from '../../vehicles/timeSeries/tooltip/formatHistoryPeriod'
import { availableSlots, type Slot } from '../../vehicles/vehicleMetricSelector/vehicleMetrics/vehicleMetrics'
import { formatSlotValue } from '../../vehicles/vehicleMetricSelector/utils/formatMetricValue'
import { achievementSeriesTag } from './achievementSeries'

const props = defineProps<{
  ctx: TooltipCtx<VehicleHistoryHit>
  sources: readonly Pick<ComparisonSource, 'tag' | 'name' | 'color'>[]
  metrics: readonly Slot[]
  gameVersion?: string | null
}>()

const period = computed(() => {
  const { periodStart, periodEnd, step } = props.ctx.hit.datum
  return formatHistoryPeriod(periodStart, periodEnd, step)
})

const rows = computed(() => {
  const hits = new Map(props.ctx.hits.map(hit => [hit.interactionTag, hit]))
  return props.sources.map(source => {
    const cells = props.metrics.map(slot => {
      const hit = hits.get(achievementSeriesTag(source.tag, slot))
      return {
        slot,
        value: hit?.datum.y,
        highlighted: hit !== undefined && props.ctx.highlights.some(highlight => highlight.isHighlighted(hit)),
      }
    })

    return {
      ...source,
      cells,
      highlighted: cells.some(cell => cell.highlighted),
      missing: cells.every(cell => cell.value == null),
    }
  })
})
</script>

<style scoped lang="scss">
.achievement-compare-tooltip {
  box-sizing: border-box;
  width: max-content;
  min-width: min(320px, calc(100vw - 40px));
  max-width: calc(100vw - 40px);
  max-height: 50vh;
  overflow: auto;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;

  .header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 2px 12px;
    margin-bottom: 6px;

    .period {
      color: rgba(255, 255, 255, 0.75);
      white-space: nowrap;
    }

    .game-version {
      color: rgba(255, 255, 255, 0.45);
      overflow-wrap: anywhere;
    }
  }

  .values {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font: inherit;

    th,
    td {
      border: 0;
      padding: 3px 6px;
      vertical-align: middle;
    }

    .metric-icon {
      display: block;
      width: 26px;
      height: 26px;
      margin: 0 auto;
      color: rgba(255, 255, 255, 0.75);
    }

    .source-cell {
      min-width: 70px;
      max-width: 180px;
      padding-left: 0;
      padding-right: 12px;

      &.missing {
        opacity: 0.45;
      }
    }

    .source {
      display: flex;
      align-items: center;
      gap: 6px;

      .name {
        min-width: 0;
        overflow-wrap: anywhere;
      }

      .dot {
        flex: none;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--source-color);
        transition: box-shadow 0.15s ease, transform 0.15s ease;

        &.highlighted {
          box-shadow: 0 0 7px var(--source-color);
          transform: scale(1.2);
        }
      }
    }

    .value {
      position: relative;
      isolation: isolate;
      min-width: 42px;
      color: white;
      font-weight: 600;
      text-align: center;
      white-space: nowrap;

      &::before {
        content: '';
        position: absolute;
        z-index: -1;
        inset: 25% 15%;
        border-radius: 50%;
        background: var(--source-color);
        filter: blur(6px);
        opacity: 0;
        transition: opacity 0.15s ease;
        pointer-events: none;
      }

      &.highlighted::before {
        opacity: 0.22;
      }

      &.missing {
        color: rgba(255, 255, 255, 0.35);
        font-weight: normal;
      }
    }
  }

  &.single {
    min-width: 0;

    .header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0;
    }

    .source-cell {
      max-width: 220px;
    }

    .value {
      text-align: right;
    }
  }
}
</style>
