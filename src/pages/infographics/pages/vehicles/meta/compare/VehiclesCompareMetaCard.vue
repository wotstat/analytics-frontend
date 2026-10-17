<template>
  <VehiclesMetaFrame :label="`${filterPresentation.region} · Сравнение`" :background class="compare-meta"
    :class="[`format-${context.format}`, { duel: isDuel, 'single-source': series.length === 1, 'many-sources': series.length > 4, 'long-metric': metricLabel.length > 30 }]">
    <template v-if="$slots.background" #background>
      <slot name="background" />
    </template>
    <div class="intro">
      <h2 class="metric-heading">{{ metricLabel }}</h2>
      <div v-if="filterPresentation.mode || filterPresentation.labels.length" class="selection">
        <b v-if="filterPresentation.mode">{{ filterPresentation.mode }}</b>
        <span v-if="filterPresentation.labels.length">{{ filterPresentation.labels.join(' · ') }}</span>
      </div>
    </div>

    <template v-if="state === 'ready' && series.length && !params.invalidComparison">
      <div class="comparison-body">
        <div class="plot-panel">
          <div v-if="!isDuel" class="legend" :class="{ extended: hasSourceDetails }">
            <div v-for="source in series.slice(0, 8)" :key="source.tag" class="legend-item">
              <i :style="{ background: source.color }" />
              <div><b>{{ source.name }}</b><span v-if="source.details">{{ source.details }}</span></div>
            </div>
            <span v-if="series.length > 8" class="more">+ {{ series.length - 8 }} источников на графике</span>
          </div>
          <div class="chart-area">
            <MetaHistoryChart :series :slot="params.settings.slot" :until="now" />
            <span v-if="!hasValues" class="empty-plot">По выбранным фильтрам нет данных</span>
          </div>
        </div>

        <div v-if="isDuel" class="rivals">
          <div v-for="source in series" :key="source.tag" class="rival" :style="{ '--source-color': source.color }">
            <VehicleImage v-if="source.selection.tankTag" :tag="source.selection.tankTag" size="shop"
              :game="regionToGame(source.filters.regions[0] ?? 'RU')" loading="eager" />
            <div class="rival-info">
              <h3>{{ source.name }}</h3>
              <span class="rival-value" :style="{ color: source.color === '#0a84ff' ? '#2f96ff' : undefined }">
                {{ latestValue(source.history) }}
              </span>
              <small v-if="source.details" class="source-filters">{{ source.details }}</small>
            </div>
          </div>
          <span v-if="series.length > 1" class="versus">VS</span>
        </div>
      </div>
    </template>
    <div v-else class="state">{{ stateMessage }}</div>
  </VehiclesMetaFrame>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import type { RenderContext } from '@/meta/utils'
import VehicleImage from '@/shared/game/components/vehicles/vehicleImage/VehicleImage.vue'
import { regionToGame } from '@/shared/game/domain/wot'
import type { VehicleHistoryPeriod } from '../../shared/types'
import { availableSlots } from '../../vehicleMetricSelector/vehicleMetrics'
import { formatMetaSlotValue } from '../utils/format'
import VehiclesMetaFrame from '../VehiclesMetaFrame.vue'
import MetaHistoryChart from './chart/MetaHistoryChart.vue'
import { readVehiclesMetaParams } from '../utils/params'
import { useCompareMeta } from './useCompareMeta'
import { comparisonFilterLabels } from '../utils/labels'

const props = defineProps<{ context: RenderContext, background?: Component }>()
const params = readVehiclesMetaParams(new URL(props.context.url))
const now = Date.now()
const beforeDay = new Date(now).toISOString().slice(0, 10)
const { series: sources, state } = useCompareMeta(params, beforeDay)
const metricLabel = availableSlots[params.settings.slot].label
const filterPresentation = computed(() => {
  const filters = sources.value.length ? sources.value.map(source => source.filters) : [params.filters]
  return comparisonFilterLabels(filters)
})
const series = computed(() => sources.value.map((source, index) => ({
  ...source,
  details: [filterPresentation.value.sources[index], ...source.selectionDetails].filter(Boolean).join(' · '),
})))
const hasSourceDetails = computed(() => series.value.some(source => source.details))
const isDuel = computed(() => series.value.length >= 1 && series.value.length <= 2 && series.value.every(source => source.selection.tankTag))
const lastRow = (history: VehicleHistoryPeriod[]) => history.findLast(row => row[params.settings.slot] != null && Number.isFinite(row[params.settings.slot]))
const latestValue = (history: VehicleHistoryPeriod[]) => formatMetaSlotValue(params.settings.slot, lastRow(history)?.[params.settings.slot])
const hasValues = computed(() => series.value.some(source => lastRow(source.history)))
const stateMessage = computed(() => {
  if (state.value === 'error') return 'Не удалось загрузить сравнение'
  if (state.value === 'loading') return 'Загружаем дневную историю…'
  if (params.invalidComparison) return 'Некорректная ссылка сравнения'
  return 'Нет включённых источников сравнения'
})
</script>

<style scoped lang="scss">
.compare-meta {
  .intro {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    align-items: center;
    gap: 32px;
  }

  .metric-heading {
    margin: 0;
    font-size: 52px;
    line-height: 1.05;
    letter-spacing: -1.6px;
  }

  .selection {
    display: flex;
    flex-direction: column;
    gap: 7px;
    font-size: 18px;
    line-height: 1.3;
    text-align: right;
    overflow-wrap: anywhere;
    color: var(--meta-card-muted);
  }

  .selection b {
    font-size: 23px;
    font-weight: 500;
    color: #e9eaf5;
  }

  .comparison-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    margin-top: 24px;
    padding-bottom: 22px;
  }

  .plot-panel {
    position: relative;
    z-index: 1;
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 26px;
    margin-bottom: 14px;
  }

  .legend-item {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
    font-size: 23px;
  }

  .legend-item i {
    display: block;
    width: 20px;
    height: 5px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .legend-item b {
    font-weight: 600;
  }

  .legend-item span {
    display: block;
    color: var(--meta-card-muted);
    font-size: 16px;
    line-height: 1.3;
    margin-top: 4px;
  }

  .legend.extended {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 20px;
  }

  .more {
    color: var(--meta-card-muted);
    font-size: 17px;
  }

  .chart-area {
    position: relative;
    flex: 1;
    min-height: 100px;
  }

  .empty-plot {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    font-size: 22px;
  }

  .state {
    margin-top: 100px;
    color: var(--meta-card-muted);
    font-size: 28px;
  }

  &.many-sources .legend-item {
    font-size: 19px;
  }

  &.long-metric .metric-heading {
    font-size: 38px;
  }

  &.duel {
    .comparison-body {
      margin-top: 14px;
    }

    .rivals {
      position: relative;
      z-index: 2;
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 170px;
      margin-top: 12px;
      flex-shrink: 0;
    }

    &:not(.single-source) .rivals {
      margin-top: -40px;
      margin-bottom: 20px;
    }

    .rival {
      position: relative;
      display: flex;
      align-items: flex-end;
      padding-top: 12px;

      .rival-info {
        position: relative;
        z-index: 2;
        max-width: 280px;
      }

      img {
        position: absolute;
        width: 370px;
        max-width: none;
        top: -68px;
        left: 140px;
        transform: scaleX(-1);
        filter: drop-shadow(0 12px 22px #0009);
        z-index: 1;
      }

      h3 {
        position: relative;
        margin: 0 0 8px;
        max-width: 280px;
        font-size: 31px;
        line-height: 1.05;
      }

      .rival-value {
        position: relative;
        font-size: 34px;
        font-weight: 700;
        color: var(--source-color);
      }

      .source-filters {
        position: relative;
        display: block;
        max-width: 260px;
        margin-top: 7px;
        font-size: 17px;
        line-height: 1.25;
        color: var(--meta-card-muted);
      }

      &:nth-child(2) {
        justify-content: flex-end;
        text-align: right;
      }

      &:nth-child(2) h3 {
        margin-left: auto;
      }

      &:nth-child(2) .source-filters {
        margin-left: auto;
      }

      &:nth-child(2) img {
        left: auto;
        right: 140px;
        transform: none;
      }
    }

    .versus {
      position: absolute;
      bottom: 36px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 25px;
      font-weight: 700;
      color: #ccd4e5;
    }
  }

  &.duel.single-source {
    .comparison-body {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 360px;
      column-gap: 28px;
    }

    .plot-panel {
      grid-column: 1 / -1;
      grid-row: 1;
      margin-right: 120px;
    }

    .rivals {
      grid-column: 2;
      grid-row: 1;
      display: block;
      min-height: 0;
      margin-top: 0;
    }

    .rival {
      height: 100%;
      align-items: flex-start;
      justify-content: flex-end;
      padding-top: 8px;
      text-align: right;
    }

    .rival img {
      width: 620px;
      top: auto;
      bottom: -30px;
      left: auto;
      right: -130px;
      transform: none;
    }

    .rival h3 {
      font-size: 44px;
    }
  }

  &.format-twitter {
    gap: 20px;

    .comparison-body {
      margin-top: 20px;
    }

    &.duel {
      .comparison-body {
        margin-top: 10px;
      }

      &:not(.single-source) {
        .rivals {
          min-height: 158px;
        }

        .rival img {
          width: 380px;
          top: -70px;
        }
      }

      &.single-source .rival img {
        width: 580px;
        bottom: -28px;
        right: -120px;
      }
    }
  }
}
</style>
