<template>
  <VehiclesMetaFrame :label="`${region} · Сравнение`" :background class="compare-meta"
    :class="[`format-${format}`, {
      duel: isDuel,
      'single-source': sources.length === 1,
      'many-sources': sources.length > 4,
      'long-metric': heading.length > 30,
    }]">
    <template v-if="$slots.background" #background>
      <slot name="background" />
    </template>
    <div class="intro">
      <h2 class="metric-heading">{{ heading }}</h2>
      <div class="selection">
        <slot name="selection">
          <b v-if="subtitle">{{ subtitle }}</b>
          <span v-if="details">{{ details }}</span>
        </slot>
      </div>
    </div>

    <div v-if="!stateMessage" class="comparison-body">
      <div class="plot-panel">
        <div v-if="!isDuel" class="legend" :class="{ extended: hasSourceDetails }">
          <div v-for="source in sources.slice(0, 8)" :key="source.tag" class="legend-item">
            <i :style="{ background: source.color }" />
            <div><b>{{ source.name }}</b><span v-if="source.details">{{ source.details }}</span></div>
          </div>
          <span v-if="sources.length > 8" class="more">+ {{ sources.length - 8 }} источников на графике</span>
        </div>
        <div class="chart-area">
          <slot />
          <span v-if="!hasValues" class="empty-plot">По выбранным фильтрам нет данных</span>
        </div>
      </div>

      <div v-if="isDuel" class="rivals">
        <div v-for="source in sources" :key="source.tag" class="rival" :class="{ 'with-value-icon': $slots['value-icon'] }"
          :style="{ '--source-color': source.color }">
          <VehicleImage v-if="source.tankTag" :tag="source.tankTag" size="shop"
            :game="regionToGame(source.region)" loading="eager" />
          <div class="rival-info">
            <h3>{{ source.name }}</h3>
            <span class="rival-value" :style="{ color: source.color === '#0a84ff' ? '#2f96ff' : undefined }">
              <slot name="value-icon" />
              {{ source.value }}
            </span>
            <small v-if="source.details" class="source-filters">{{ source.details }}</small>
          </div>
        </div>
        <span v-if="sources.length > 1" class="versus">VS</span>
      </div>
    </div>
    <div v-else class="state">{{ stateMessage }}</div>
  </VehiclesMetaFrame>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import type { MetaFormat } from '@/meta/utils'
import VehicleImage from '@/shared/game/components/vehicles/vehicleImage/VehicleImage.vue'
import { regionToGame } from '@/shared/game/domain/wot'
import VehiclesMetaFrame from '../VehiclesMetaFrame.vue'

const props = defineProps<{
  format: MetaFormat
  region: string
  heading: string
  subtitle?: string
  details?: string
  sources: { tag: string, name: string, color: string, value: string, details: string, tankTag?: string, region: string }[]
  hasValues: boolean
  stateMessage?: string
  background?: Component
}>()
const hasSourceDetails = computed(() => props.sources.some(source => source.details))
const isDuel = computed(() => props.sources.length >= 1 && props.sources.length <= 2 && props.sources.every(source => source.tankTag))
</script>

<style scoped lang="scss">
.compare-meta {
  --compare-heading-size: 52px;

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
    font-size: var(--compare-heading-size);
    line-height: 1.05;
    text-box: trim-start cap text;
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
    margin-top: 25px;
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

  &.long-metric {
    --compare-heading-size: 38px;
  }

  &.duel {
    .comparison-body {
      margin-top: 0;
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

    .rival.with-value-icon {
      padding-top: 28px;

      h3 { margin-bottom: 2px; }
    }
  }

  &.format-twitter {
    gap: 20px;

    .comparison-body {
      margin-top: 25px;
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
