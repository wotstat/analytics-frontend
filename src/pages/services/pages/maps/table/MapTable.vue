<template>
  <section ref="table" class="map-table">
    <div class="toolbar">
      <SearchLine v-model="search" class="search" placeholder="Найти карту" />
      <div class="toolbar-actions">
        <MapColumnSelector
          v-model="visibleColumns"
          v-model:delta-metrics="deltaMetrics"
          :max-slots="columnLimit"
          :default-columns="defaultColumns" />
        <TableSettings />
      </div>
    </div>

    <ComposableTable
      v-model:expanded-rows="expandedRows"
      class="map-stats"
      :columns
      :rows
      :row-key="row => row.tag"
      :expand-on-row-click="visibleColumns.length === 0"
      :sort="[{ key: 'name', ascending }]"
      :loading="arenaCatalog.status === loading"
      :cell-class="cellClass"
      @sort="ascending = !ascending"
      @cell-click="onCellClick">
      <template #header="{ column }">
        <Icon v-if="column.icon" :icon="column.icon" class="column-icon" />
        <span v-if="column.delta || column.variant" class="metric-variant">
          <DeltaIcon v-if="column.delta" width="12" height="12" />
          {{ column.variant }}
        </span>
      </template>

      <template #cell-compare="{ row }">
        <CompareButton :compared="comparedTags.has(row.tag)" @click.stop="emit('compare', row.tag, row.name)" />
      </template>

      <template #cell-expand="{ expanded }">
        <DropdownArrow class="arrow" :expanded horizontal angle="large" />
      </template>

      <template #expanded>
        <MapTimeSeries
          v-model:slot="activeSlot"
          v-model:delta-metrics="deltaMetrics"
          v-model:step="historyStep"
          v-model:average-window="averageWindow"
          :regions="filters.regions" />
      </template>

      <template #cell-name="{ row }">
        <div class="map-name">
          <MinimapBackground :tag="row.tag" :game="row.game" class="minimap" loading="lazy" />
          <HighlightString :text="highlight(row.name, search)" class="label" />
        </div>
      </template>

      <template #loading>
        <TableState :status="arenaCatalog.status" message="Загрузка списка карт…" />
      </template>

      <template #empty>
        <TableState
          :status="arenaCatalog.status"
          :message="isErrorStatus(arenaCatalog.status) ? 'Не удалось загрузить список карт' : 'Карты не найдены'" />
      </template>
    </ComposableTable>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useElementSize } from '@vueuse/core'
import { isErrorStatus, loading } from '@/db'
import Icon from '@/shared/game/components/efficiencyIcon/Icon.vue'
import type { IconType } from '@/shared/game/components/efficiencyIcon/utils'
import MinimapBackground from '@/shared/game/components/minimap/minimapBackground/MinimapBackground.vue'
import SearchLine from '@/shared/game/components/selectors/components/searchLine/SearchLine.vue'
import { arenaCatalog } from '@/shared/game/domain/arenas/catalog'
import { regionToGame, type GameVendor } from '@/shared/game/domain/wot'
import { getArenaName } from '@/shared/i18n/i18n'
import ComposableTable from '@/shared/ui/composableTable/ComposableTable.vue'
import type { ComposableTableCellEvent, ComposableTableColumn } from '@/shared/ui/composableTable/types'
import DropdownArrow from '@/shared/uiKit/dropdown/DropdownArrow.vue'
import HighlightString from '@/shared/uiKit/highlightString/HighlightString.vue'
import { highlight } from '@/shared/uiKit/highlightString/highlightUtils'
import { useMetricRowExpansion } from '../../shared/table/utils/useMetricRowExpansion'
import type { HistoryAverageWindow, HistoryStep } from '../../shared/history/period/historyStep'
import CompareButton from '../../shared/table/comparison/CompareButton.vue'
import TableSettings from '../../shared/table/TableSettings.vue'
import TableState from '../../shared/table/TableState.vue'
import { useTablePreferences } from '../../shared/table/useTablePreferences'
import { EXPAND_MIN_TABLE_WIDTH, rowColumns } from '../../shared/table/utils/rowColumns'
import DeltaIcon from '../metrics/delta.svg'
import MapColumnSelector from './settings/MapColumnSelector.vue'
import MapTimeSeries from '../history/MapTimeSeries.vue'
import type { MapFilters } from '../filters/mapFilters'
import { mapMetricLabel, mapMetricOrder, mapMetrics, mapMetricShortLabel, type MapMetric, type MapMetricSlot } from '../metrics/catalog/mapMetrics'

type MapRow = { tag: string, name: string, game: GameVendor }
type MapColumn = ComposableTableColumn<MapRow> & { icon?: IconType, variant?: string, delta?: boolean, slot?: MapMetricSlot }

const props = defineProps<{ filters: MapFilters, comparedTags: ReadonlySet<string> }>()
const emit = defineEmits<{ compare: [tag: string, name: string] }>()
const search = ref('')
const ascending = ref(true)
const { pinCompared } = useTablePreferences()

const { width } = useElementSize(useTemplateRef('table'))
const showExpand = computed(() => width.value >= EXPAND_MIN_TABLE_WIDTH)
const nameWidth = computed(() => Math.max(140, width.value * 0.25))
const columnLimit = computed(() => {
  const expandWidth = showExpand.value ? rowColumns.expand.width : 0
  const fitted = Math.floor((width.value - nameWidth.value - rowColumns.compare.width - expandWidth) / 75)
  return Math.min(8, Math.max(1, fitted))
})

const defaultMetrics: MapMetric[] = ['battles', 'spawnBalance', 'duration', 'drawRate', 'captureRate', 'lifeTime', 'kills']
const defaultColumns = defaultMetrics.map<MapMetricSlot>(metric => ({ metric, aggregation: 'value' }))
const selectedColumns = ref([...defaultColumns])
const activeSlot = ref<MapMetricSlot>(defaultColumns[0])
const historyStep = ref<HistoryStep>('day')
const averageWindow = ref<HistoryAverageWindow>(null)
const { expandedRows, expansionCellClass, toggleRow } = useMetricRowExpansion(activeSlot, sameSlot)
const deltaMetrics = ref<MapMetric[]>([])
const visibleColumns = computed({
  get: () => selectedColumns.value.slice(0, columnLimit.value),
  set: (value: MapMetricSlot[]) => selectedColumns.value = value,
})

const columns = computed<MapColumn[]>(() => {
  const orderedSlots = mapMetricOrder.flatMap(metric => visibleColumns.value.filter(slot => slot.metric === metric))
  const metricColumns = orderedSlots.map(slot => {
    const delta = deltaMetrics.value.includes(slot.metric)
    return {
      key: `${slot.metric}:${slot.aggregation}`,
      label: mapMetricLabel(slot, delta),
      icon: mapMetrics[slot.metric].icon,
      variant: mapMetricShortLabel(slot),
      delta,
      slot,
      interactive: true,
    }
  })

  return [
    rowColumns.compare,
    ...(showExpand.value ? [rowColumns.expand] : []),
    { key: 'name', label: 'Название карты', icon: 'arena', width: nameWidth.value, align: 'left', sortable: true, interactive: true },
    ...metricColumns,
  ]
})

const maps = computed(() => {
  const rows = new Map<string, MapRow>()
  for (const { region, tag } of arenaCatalog.value.data) {
    if (!props.filters.regions.some(selected => selected === region)) continue
    if (rows.has(tag)) continue
    rows.set(tag, { tag, name: getArenaName(tag), game: regionToGame(region) })
  }
  return [...rows.values()]
})

const rows = computed(() => {
  const query = search.value.trim().toLowerCase()
  const matching = maps.value.filter(row => row.name.toLowerCase().includes(query) || row.tag.toLowerCase().includes(query))

  return matching.sort((left, right) => {
    if (pinCompared.value) {
      const pinned = Number(props.comparedTags.has(right.tag)) - Number(props.comparedTags.has(left.tag))
      if (pinned) return pinned
    }

    const order = left.name.localeCompare(right.name, 'ru')
    return ascending.value ? order : -order
  })
})

function sameSlot(left: MapMetricSlot, right: MapMetricSlot) {
  return left.metric === right.metric && left.aggregation === right.aggregation
}

function cellClass(row: MapRow, column: MapColumn) {
  if (column.key === 'compare') return
  return expansionCellClass(row.tag, column.slot)
}

function onCellClick({ rowKey, column }: ComposableTableCellEvent<MapRow, MapColumn>) {
  if (column.key === 'compare') return
  toggleRow(rowKey, column.slot)
}

watch(visibleColumns, slots => {
  if (slots.some(slot => sameSlot(slot, activeSlot.value))) return
  activeSlot.value = slots.find(slot => slot.metric === activeSlot.value.metric) ?? slots[0] ?? defaultColumns[0]
})
</script>

<style scoped lang="scss">
@use '../../shared/table/utils/metricTableRows.scss' as *;

.map-table {
  min-width: 0;
  font-size: 14px;

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    .search {
      width: 240px;
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
    }

    @container content (max-width: 420px) {

      .search,
      .toolbar-actions {
        flex-basis: 100%;
      }

      .toolbar-actions :deep(.column-trigger) {
        flex: 1;
      }
    }
  }

  .map-stats {
    --composable-table-cell-padding: 0 3px;

    @include metric-table-rows;
  }

  .column-icon {
    display: block;
    width: 40px;
    height: 40px;
  }

  .metric-variant {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 3px;
    right: 3px;
    bottom: 9px;
    padding: 1px 4px;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.1;
    white-space: nowrap;
  }

  .map-name {
    display: flex;
    align-items: center;
    gap: 10px;

    .minimap {
      flex: none;
      width: 36px;
      height: 36px;
      border-radius: 4px;
    }

    .label {
      overflow: hidden;
      margin: 0;
      text-overflow: ellipsis;
      white-space: nowrap;

      :deep(.highlight) {
        color: var(--blue-thin-color);
      }
    }
  }
}
</style>
