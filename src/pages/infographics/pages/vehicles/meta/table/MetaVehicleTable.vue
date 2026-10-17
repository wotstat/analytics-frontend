<template>
  <div class="meta-vehicle-table" :style="{ '--meta-table-columns': gridColumns }">
    <div class="table-head table-line">
      <div class="vehicle-heading">
        <EfficiencyIcon icon="tank" class="icon" />
        <span v-if="vehicleSort" class="sort-marker" :class="{ ascending: vehicleSort.ascending }" />
      </div>

      <div v-for="column in columns" :key="column.slot" class="numeric-heading">
        <span v-for="row in rows" :key="row.rowKey" class="value-measure">
          {{ formatValue(column.slot, row[column.slot]) }}
        </span>
        <div class="heading-symbol">
          <EfficiencyIcon :icon="column.icon" class="icon" />
          <span v-if="column.label" class="aggregation-label">{{ column.label }}</span>
        </div>
        <span v-if="column.sort" class="sort-marker" :class="{ ascending: column.sort.ascending }" />
      </div>
    </div>

    <div v-for="row in rows" :key="row.rowKey" class="table-line table-row">
      <div class="vehicle-cell">
        <VehicleImage v-if="row.tankTag" :tag="row.tankTag" size="preview" :game="regionToGame(row.region)"
          loading="eager" />
        <MetaVehicleName :vehicle="row" class="vehicle-name" />
      </div>
      <span v-for="column in columns" :key="column.slot">{{ formatValue(column.slot, row[column.slot]) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VehicleImage from '@/shared/game/components/vehicles/vehicleImage/VehicleImage.vue'
import EfficiencyIcon from '@/shared/game/components/efficiencyIcon/IconRenderer.vue'
import { regionToGame } from '@/shared/game/domain/wot'
import type { VehicleStatistics } from '../../shared/types'
import MetaVehicleName from './MetaVehicleName.vue'
import { formatMetaSlotValue } from '../utils/format'
import { availableSlots, slotHeadingLabel, type Slot } from '../../vehicleMetricSelector/vehicleMetrics'
import type { SortOrder } from '../../vehicleListTable/useVehicleSorting'

const props = defineProps<{ rows: VehicleStatistics[], slots: readonly Slot[], sort: readonly SortOrder[] }>()

const primarySort = computed(() => props.sort[0])
const columns = computed(() => props.slots.map(slot => ({
  slot,
  icon: availableSlots[slot].icon,
  label: slotHeadingLabel(slot),
  sort: primarySort.value?.key === slot ? primarySort.value : undefined,
})))
const vehicleSort = computed(() => {
  const order = primarySort.value
  if (order?.key === 'name' || order?.key === 'tankLevel' || order?.key === 'tankType') return order
})
const gridColumns = computed(() => ['minmax(0, 1fr)', ...props.slots.map(() => 'var(--meta-table-column-width)')].join(' '))
const percentFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false })
const decimalFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 })
const distanceFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })

function formatValue(slot: Slot, value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—'
  const format = availableSlots[slot].format
  if (format === 'percent') return `${percentFormat.format(value)}%`
  if (format === 'decimal') return decimalFormat.format(value).replace(',', '.')
  if (format === 'distance') return distanceFormat.format(value)
  return formatMetaSlotValue(slot, value)
}
</script>

<style scoped lang="scss">
.meta-vehicle-table {
  --meta-table-value-size: 25px;
  --meta-table-icon-size: 64px;
  --meta-table-column-width: 145px;

  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  border: 1px solid #ffffff22;
  border-bottom: 0;
  border-radius: 17px 17px 0 0;
  overflow: hidden;
  background: linear-gradient(115deg, #253445f5, #192032f5);
  box-shadow: 0 25px 70px #0004;
  font-variant-numeric: tabular-nums;

  .table-line {
    display: grid;
    grid-template-columns: var(--meta-table-columns);
    align-items: center;
    padding: 0 26px;
    column-gap: 12px;

    >span {
      text-align: right;
    }
  }

  .table-head {
    height: 68px;
    flex-shrink: 0;
    background: #ffffff07;
    color: var(--meta-card-muted);

    .icon {
      width: var(--meta-table-icon-size);
      height: var(--meta-table-icon-size);
    }

    .vehicle-heading {
      position: relative;
      display: flex;
      align-items: center;
      align-self: stretch;
      justify-self: start;
      width: var(--meta-table-icon-size);
      margin-left: 84px;
    }
  }

  .sort-marker {
    position: absolute;
    z-index: 1;
    left: 50%;
    bottom: -1px;
    width: 40px;
    height: 1px;
    background: currentColor;
    transform: translateX(-50%);

    &::after {
      content: '';
      position: absolute;
      left: 50%;
      top: 0;
      width: 12px;
      height: 6px;
      background: currentColor;
      clip-path: polygon(0 0, 100% 0, 50% 100%);
      transform: translateX(-50%);
    }

    &.ascending::after {
      display: none;
    }
  }

  .numeric-heading {
    position: relative;
    display: grid;
    justify-self: end;
    align-self: stretch;
    min-width: 1ch;
    font-size: var(--meta-table-value-size);
    font-weight: 600;

    .value-measure {
      grid-area: 1 / 1;
      align-self: center;
      visibility: hidden;
      white-space: nowrap;
    }

    .heading-symbol {
      position: absolute;
      top: 50%;
      left: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -50%);
    }

    .icon {
      flex-shrink: 0;
    }

    .aggregation-label {
      margin-top: calc(var(--meta-table-icon-size) * -0.2);
      font-size: calc(var(--meta-table-value-size) * 0.56);
      line-height: 1.1;
      white-space: nowrap;
    }
  }

  .table-row {
    flex: 1;
    min-height: 0;
    max-height: 79px;
    border-top: 1px solid #ffffff12;
    font-size: var(--meta-table-value-size);
    font-weight: 600;

    &:nth-child(even) {
      background: #ffffff03;
    }
  }

  .vehicle-cell {
    display: flex;
    align-items: center;
    align-self: stretch;
    gap: 9px;
    min-width: 0;
    min-height: 0;

    img {
      flex-shrink: 0;
      width: auto;
      height: 100%;
      object-fit: contain;
    }

    .vehicle-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
