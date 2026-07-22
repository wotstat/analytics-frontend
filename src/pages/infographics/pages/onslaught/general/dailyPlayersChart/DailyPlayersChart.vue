<template>
  <section class="daily-players-section" :class="{ loading: isLoading }">
    <HeaderTooltip :ctx="chart.tooltipCtx.value">
      <template #left>
        <h3>Активные игроки по дням (DAU)</h3>
      </template>

      <template #tooltip="{ ctx }">
        <div class="tooltip-container">
          <p class="value">{{ numberFormatter.format(tooltipValue(ctx)) }}</p>
          <p class="date">{{ tooltipDate(ctx) }}</p>
        </div>
      </template>
    </HeaderTooltip>

    <hr class="separator">

    <div class="chart-body">
      <UniversalChartComponent :chart />

      <div v-if="errorReason" class="chart-state error">
        <b>Не удалось загрузить данные</b>
        <p>{{ errorReason }}</p>
      </div>
      <div v-else-if="isEmpty" class="chart-state">
        По выбранным условиям данных нет
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, markRaw, watchEffect } from 'vue'
import { LONG_CACHE_SETTINGS, isErrorStatus, loading, queryComputed, success } from '@/db'
import { getRegionDayChangeHourOffset } from '@/shared/game/comp7/utils'
import HeaderTooltip from '@/shared/ui/chart/HeaderTooltip.vue'
import UniversalChartComponent from '@/shared/uiKit/chart/universalChart/UniversalChart.vue'
import type { TooltipCtx } from '@/shared/uiKit/chart/universalChart/hover/composableHover/components/chartTooltip/ChartTooltip'
import { buildGlobalDailyPlayersStatisticsQuery, type GlobalStatisticsFilters } from '../globalStatistics/queries'
import type { GlobalDailyPlayersStatistic } from '../globalStatistics/types'
import { DailyPlayersChart } from './DailyPlayersChart'

const DAY_SECONDS = 24 * 60 * 60
const DAY_MS = DAY_SECONDS * 1000

const props = defineProps<{
  filters: GlobalStatisticsFilters
  region: string
  seasonInterval: { start: Date, end: Date, length: number }
}>()

const data = queryComputed<GlobalDailyPlayersStatistic>(
  () => buildGlobalDailyPlayersStatisticsQuery(props.filters),
  {
    settings: {
      ...LONG_CACHE_SETTINGS,
      max_execution_time: 30,
      max_rows_to_read: '100000000',
      max_bytes_to_read: '2000000000',
      max_result_rows: '1000',
      timeout_before_checking_execution_speed: 0,
    },
  },
)

const chart = markRaw(new DailyPlayersChart(props.seasonInterval.length))
const numberFormatter = new Intl.NumberFormat('ru-RU')
const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
})

const currentGameDay = new Date(
  Date.now() - getRegionDayChangeHourOffset(props.region),
).toISOString().slice(0, 10)

const isLoading = computed(() => data.value.status === loading)
const isEmpty = computed(() => data.value.status === success && data.value.data.length === 0)
const errorReason = computed(() => isErrorStatus(data.value.status) ? data.value.status.reason : null)

function dayAt(index: number) {
  return new Date(props.seasonInterval.start.getTime() + index * DAY_MS)
    .toISOString().slice(0, 10)
}

watchEffect(() => {
  const playersByDay = new Map(data.value.data.map(item => [item.day, item.players]))
  const points = Array.from({ length: Math.ceil(props.seasonInterval.length) }, (_, index) => {
    const day = dayAt(index)
    const players = playersByDay.get(day)
    if (players === undefined) return null

    return {
      x: (index + 0.5) * DAY_SECONDS,
      y: players,
      isCurrentDay: day === currentGameDay,
    }
  })

  chart.setPoints(points)
})

function tooltipValue(ctx: TooltipCtx) {
  return ctx.nearestDataPoints[0]?.yValue ?? 0
}

function tooltipDate(ctx: TooltipCtx) {
  const x = ctx.nearestDataPoints[0]?.xValue ?? 0
  const dayIndex = Math.max(0, Math.floor(x / DAY_SECONDS))
  const date = dateFormatter.format(new Date(props.seasonInterval.start.getTime() + dayIndex * DAY_MS))
  return `${date} · день ${dayIndex + 1}`
}
</script>

<style scoped lang="scss">
.daily-players-section {
  margin-top: 35px;
  cursor: default;

  h3 {
    margin: 0;
    color: rgba(255, 255, 255, 0.87);
    font-size: 22px;
    text-transform: uppercase;
  }

  .separator {
    margin: 5px 0;
    border: none;
    border-bottom: 1px solid var(--color-separator, #54545899);
  }
}

.chart-body {
  position: relative;
  max-height: 380px;
  aspect-ratio: 4 / 1;
}

:deep(.chart-container) {
  position: relative;
  width: 100%;
  height: 100%;
  margin-right: -5px;

  .universal-chart-root {
    opacity: 1;
    transition: opacity 0.2s;
  }
}

.loading {
  :deep(.chart-container) {
    .universal-chart-root {
      opacity: 0;
    }

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 10px;
      background: linear-gradient(90deg,
          rgba(255, 255, 255, 0.01) 8%,
          rgba(255, 255, 255, 0.05) 18%,
          rgba(255, 255, 255, 0.01) 33%);
      background-position: 100% 0;
      background-size: 200% 100%;
      animation: shine 1.8s infinite linear;
    }
  }
}

@keyframes shine {
  to {
    background-position: -100% 0;
  }
}

.chart-state {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.58);
  font-size: 13px;
  text-align: center;

  &.error {
    flex-direction: column;
    color: #e68484;

    p {
      max-width: 100%;
      margin: 3px 0 0;
      color: rgba(255, 255, 255, 0.55);
      overflow-wrap: anywhere;
    }
  }
}

.tooltip-container {
  position: relative;
  top: 3px;
  display: flex;
  flex-direction: column;
  align-items: center;

  .value {
    color: white;
    font-size: 20px;
    font-weight: bold;
    line-height: 20px;
  }

  .date {
    margin: 3px 0;
    color: rgba(255, 255, 255, 0.5);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    font-weight: bold;
    line-height: 1;
    white-space: nowrap;
  }
}

:deep(.universal-chart-root) {
  background: inherit;

  .main-line {
    stroke: rgba(2, 175, 255, 1);
    stroke-linecap: round;
    stroke-width: 2px;

    &.area {
      stroke: none;
    }
  }

  .plot .daily-markers {
    .daily-marker {
      fill: rgba(2, 175, 255, 1);
    }
  }

  .ticks {
    opacity: 0.1;

    .y-ticks {
      stroke: rgba(255, 255, 255, 1);
    }

    .day-ticks {
      stroke: rgba(255, 255, 255, 0.1);
    }

    .week-ticks {
      stroke: rgba(255, 255, 255, 1);
    }
  }

  .label {
    font-size: 11px;
    font-weight: bold;
  }

  .hover {
    .interactive-zone {
      cursor: crosshair;
    }

    .hover-components .hover-markers {
      .hover-marker {
        fill: rgba(2, 175, 255, 1);
      }
    }
  }

  .blue-gradient {
    .stop-1 {
      stop-color: rgba(29, 108, 255, 0.2);
    }

    .stop-2 {
      stop-color: rgba(29, 108, 255, 0);
    }
  }
}

@container content (width <=800px) {
  .chart-body {
    aspect-ratio: 3 / 1;
  }

  :deep(.universal-chart-root) {
    .plot .daily-markers .daily-marker {
      r: 2px;
    }

    mask .daily-marker {
      r: 3.5px;
    }

    .plot .daily-markers .current-day-marker,
    .hover .hover-marker {
      r: 4px;
    }

    mask .current-day-marker,
    mask .hover-marker {
      r: 5.5px;
    }
  }
}
</style>
