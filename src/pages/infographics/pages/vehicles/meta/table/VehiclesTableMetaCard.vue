<template>
  <VehiclesMetaFrame :label="`${regionLabel(params.filters)} · ${periodLabel(params.table.period)}`" :background
    class="table-meta">
    <template v-if="$slots.background" #background>
      <slot name="background" />
    </template>
    <div class="intro">
      <h2>{{ tableHeading(params) }}</h2>
      <div class="selection">
        <b>{{ modeLabel(params.filters) }}</b>
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
        <MetaVehicleTable :rows="rows.slice(0, 5)" :slots :sort />
      </div>
    </div>
    <div v-else class="state">{{ stateMessage }}</div>
  </VehiclesMetaFrame>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import type { RenderContext } from '@/meta/utils'
import VehiclesMetaFrame from '../VehiclesMetaFrame.vue'
import MetaVehicleTable from './MetaVehicleTable.vue'
import MetaVehicleType from './MetaVehicleType.vue'
import { readVehiclesMetaParams } from '../utils/params'
import { useTableMeta } from './useTableMeta'
import { tableHeading, tableFilterLabels, regionLabel, modeLabel, periodLabel } from '../utils/labels'

const props = defineProps<{ context: RenderContext, background?: Component }>()
const params = readVehiclesMetaParams(new URL(props.context.url))
const { rows, state, slots, sort } = useTableMeta(params, new Date().toISOString().slice(0, 10))
const labels = computed(() => tableFilterLabels(params))
const stateMessage = computed(() => {
  if (state.value === 'error') return 'Не удалось загрузить статистику'
  if (state.value === 'loading') return 'Загружаем статистику…'
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
      letter-spacing: -2.5px;
    }

    .selection {
      display: flex;
      flex-direction: column;
      gap: 7px;
      line-height: 1.3;
      font-size: 19px;
      text-align: right;
      overflow-wrap: anywhere;
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
    margin-top: 23px;
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
