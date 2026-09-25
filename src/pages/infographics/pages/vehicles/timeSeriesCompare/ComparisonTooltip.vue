<template>
  <div class="history-tooltip" :class="`columns-${columns.length}`">
    <div class="header">
      <b class="heading">{{ availableSlots[point.slot].label }}</b>
      <div class="metadata">
        <span v-if="gameVersion" class="game-version">{{ gameVersion }}</span>
        <span v-if="columns.length === 2 && gameVersion" class="separator" aria-hidden="true">·</span>
        <span v-if="fixedWeekday" class="weekday">{{ formatHistoryWeekday(point.periodStart) }}</span>
        <span v-if="fixedWeekday" class="separator" aria-hidden="true">·</span>
        <span class="date">{{ fixedWeekday ? formatStatisticsDay(point.periodStart)
          : formatHistoryPeriod(point.periodStart, point.periodEnd, point.step) }}</span>
      </div>
    </div>
    <div class="value-columns">
      <div v-for="column, index in columns" :key="index" class="value-column">
        <div v-for="row in column" :key="row.source.tag" class="value-row" :class="{ missing: !row.point }">
          <span class="source">
            <span class="dot" :class="{ highlighted: row.highlighted }"
              :style="{ backgroundColor: row.source.color }"></span>
            <span>{{ row.source.name }}</span>
          </span>
          <b v-if="row.point">{{ formatSlotValue(row.point.slot, row.point.y) }}</b>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TooltipCtx } from '@/shared/uiKit/chart/universalChart/interaction/composable/components/chartTooltip/ChartTooltip'
import { availableSlots } from '../shared/vehicleMetrics'
import { formatSlotValue } from '../shared/formatMetricValue'
import { formatStatisticsDay } from '../shared/formatStatisticsDay'
import { formatHistoryPeriod, formatHistoryWeekday } from '../timeSeries/formatHistoryPeriod'
import type { VehicleHistoryHit } from '../timeSeries/VehicleHistoryChart'

const props = defineProps<{
  ctx: TooltipCtx<VehicleHistoryHit>
  sources: readonly { tag: string, name: string, color: string }[]
  gameVersion?: string | null
}>()

const MAX_ROWS_PER_COLUMN = 10
const MAX_COLUMNS = 3

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

const columns = computed(() => {
  const count = Math.max(1, Math.min(MAX_COLUMNS, Math.ceil(rows.value.length / MAX_ROWS_PER_COLUMN)))
  const baseSize = Math.floor(rows.value.length / count)
  const remainder = rows.value.length % count
  let offset = 0

  return Array.from({ length: count }, (_, index) => {
    const size = baseSize + Number(index < remainder)
    const column = rows.value.slice(offset, offset + size)
    offset += size

    return column
  })
})

const fixedWeekday = computed(() => columns.value.length === 2 && point.value.step === 'day')
</script>

<style scoped lang="scss">
.history-tooltip {
  box-sizing: border-box;
  max-height: 50vh;
  overflow-y: auto;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;

  &.columns-1 {
    width: max-content;
    max-width: calc(100vw - 40px);
  }

  &.columns-2 {
    width: min(420px, calc(100vw - 40px));
  }

  &.columns-3 {
    width: min(620px, calc(100vw - 40px));
  }

  .heading {
    display: block;
    color: white;
    overflow-wrap: anywhere;
    text-align: left;
  }

  .metadata span {
    display: block;
  }

  .date {
    color: rgba(255, 255, 255, 0.5);
    text-align: left;
  }

  .weekday {
    flex: none;
    width: 2ch;
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
  }

  .separator {
    color: rgba(255, 255, 255, 0.5);
  }

  .game-version {
    color: rgba(255, 255, 255, 0.5);
    overflow-wrap: anywhere;
    text-align: left;
  }

  &.columns-2 {
    .header {
      display: flex;
      align-items: baseline;
      gap: 12px;
    }

    .metadata {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      column-gap: 6px;
      min-width: 0;
      margin-left: auto;
      text-align: right;

      .date,
      .game-version {
        text-align: right;
      }
    }
  }

  &.columns-2 .value-columns {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  &.columns-3 .value-columns {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .value-columns {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    column-gap: 20px;
    margin-top: 6px;

    .value-column {
      min-width: 0;

      .value-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;

        b {
          color: white;
          white-space: nowrap;
        }

        &.missing {
          color: rgba(255, 255, 255, 0.5);
        }

        .source {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          overflow-wrap: anywhere;

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
        }
      }
    }
  }
}
</style>
