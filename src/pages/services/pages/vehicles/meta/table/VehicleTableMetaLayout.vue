<template>
  <VehiclesMetaFrame :label :background class="table-meta">
    <template v-if="$slots.background" #background>
      <slot name="background" />
    </template>
    <div class="intro">
      <h2>{{ heading }}</h2>
      <div v-if="subtitle || labels.length" class="selection">
        <b v-if="subtitle">{{ subtitle }}</b>
        <span v-if="labels.length">
          <template v-for="(label, index) in labels" :key="index">
            <template v-if="index"> · </template><span :class="{ 'mt-font': label.level }">
              <template v-if="label.types">
                <template v-for="(type, typeIndex) in label.types" :key="type"><template v-if="typeIndex">, </template>
                  <MetaVehicleType :type />
                </template>
              </template>
              <template v-else>{{ label.text }}</template>
            </span>
          </template>
        </span>
      </div>
    </div>

    <div v-if="state === 'ready' && rows.length" class="table-composition">
      <div class="table-panel">
        <MetaVehicleTable :rows="rows.slice(0, 5)" :slots :sort>
          <template v-if="$slots.detail" #detail="cell"><slot name="detail" v-bind="cell" /></template>
        </MetaVehicleTable>
      </div>
    </div>
    <div v-else class="state">{{ stateMessage }}</div>
  </VehiclesMetaFrame>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import type { VehicleStatisticsRow } from '../../shared/types'
import type { Slot } from '../../vehicleMetricSelector/vehicleMetrics/vehicleMetrics'
import type { SortOrder } from '../../vehicleListTable/utils/useVehicleSorting'
import type { SelectionLabel } from '../utils/selectionLabels'
import VehiclesMetaFrame from '../VehiclesMetaFrame.vue'
import MetaVehicleTable from './MetaVehicleTable.vue'
import MetaVehicleType from './MetaVehicleType.vue'

const props = defineProps<{
  label: string
  heading: string
  subtitle?: string
  labels: SelectionLabel[]
  rows: VehicleStatisticsRow[]
  slots: readonly Slot[]
  sort: SortOrder[]
  state: 'ready' | 'error' | 'loading'
  background?: Component
}>()
const stateMessage = computed(() => {
  if (props.state === 'error') return 'Не удалось загрузить статистику'
  if (props.state === 'loading') return 'Загружаем статистику…'
  return 'По выбранным фильтрам нет данных'
})
</script>

<style scoped lang="scss">
.table-meta {
  .intro {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    align-items: center;
    gap: 32px;

    h2 {
      margin: 0;
      font-size: 61px;
      line-height: 1.03;
    }

    .selection {
      display: flex;
      flex-direction: column;
      gap: 7px;
      line-height: 1.3;
      font-size: 19px;
      text-align: right;
      overflow-wrap: anywhere;
      overflow: hidden;
      max-height: 6.5em;
    }

    .selection b {
      color: #e9eaf5;
      font-size: 23px;
      font-weight: 500;
    }

    .selection span {
      color: var(--meta-card-muted);
    }
  }

  .table-composition {
    flex: 1;
    min-height: 0;
    margin-top: 32px;
  }

  .state {
    margin-top: 90px;
    color: var(--meta-card-muted);
    font-size: 30px;
  }

  .table-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    width: calc(100% + 26px);
    margin-left: -13px;
  }
}
</style>
