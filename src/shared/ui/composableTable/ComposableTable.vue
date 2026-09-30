<template>
  <div class="composable-table nice-scrollbar-transparent">
    <div class="composable-table-content"
      :style="{ '--composable-table-columns': gridColumns, minWidth: `${minWidth}px` }">

      <div class="composable-table-head mt-font">
        <ComposableTableHeading v-for="column in columns"
          :key="column.key"
          :label="column.label"
          :sortable="column.sortable"
          :tooltip-class="headingTooltipClass"
          :position="sort.findIndex(order => order.key === column.key) + 1"
          :ascending="sort.find(order => order.key === column.key)?.ascending"
          @click="column.sortable && $emit('sort', column.key, $event)">

          <slot v-if="$slots[`header-${column.key}`]" :name="`header-${column.key}`" :column />
          <slot v-else-if="$slots.header" name="header" :column />
          <template v-else>{{ column.label }}</template>
        </ComposableTableHeading>
      </div>

      <slot v-if="loading" name="loading">
        <div v-for="index in skeletonRows" :key="index" class="composable-table-skeleton"></div>
      </slot>

      <slot v-else-if="!rows.length" name="empty">
        <div class="composable-table-empty">Нет данных</div>
      </slot>

      <div v-else class="composable-table-body">
        <div v-for="(row, rowIndex) in rows" :key="rowKey(row)" class="composable-table-row"
          :class="{ expanded: isExpanded(row) }">

          <div class="composable-table-line mt-font" :class="{ 'expand-on-click': expandOnRowClick && $slots.expanded }"
            @click="onRowClick(row, $event)">

            <component v-for="column in columns"
              :key="column.key"
              :is="column.interactive ? 'button' : 'div'"
              class="composable-table-cell"
              v-bind="cellAttrs(row, column)"
              v-tooltip="cellTooltip(column)"
              @click="onCellClick(row, column, $event)">

              <slot v-if="$slots[`cell-${column.key}`] || $slots.cell"
                :name="$slots[`cell-${column.key}`] ? `cell-${column.key}` : 'cell'"
                :row :row-index :column
                :value="column.value?.(row)"
                :expanded="isExpanded(row)"
                :toggle-expanded="() => toggleExpanded(row)" />

              <template v-else>{{ column.value?.(row) ?? '—' }}</template>
            </component>
          </div>

          <div v-if="isExpanded(row) && $slots.expanded" class="composable-table-expanded">
            <slot name="expanded" :row :row-index :close="() => toggleExpanded(row)" />
          </div>
        </div>
      </div>

      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts" generic="Row, Column extends ComposableTableColumn<Row>">
import { computed, useSlots, watch, type ButtonHTMLAttributes } from 'vue'
import ComposableTableHeading from './ComposableTableHeading.vue'
import type { ComposableTableCellEvent, ComposableTableColumn, ComposableTableKey, ComposableTableSort } from './types'

const props = withDefaults(defineProps<{
  rows: readonly Row[]
  columns: readonly Column[]
  rowKey: (row: Row) => ComposableTableKey
  sort?: readonly ComposableTableSort[]
  loading?: boolean
  skeletonRows?: number
  headingTooltipClass?: string
  expandOnRowClick?: boolean
  cellClass?: (row: Row, column: Column) => string | undefined
}>(), { sort: () => [], skeletonRows: 5, expandOnRowClick: false })

const emit = defineEmits<{
  sort: [key: Column['key'], event: MouseEvent]
  cellClick: [context: ComposableTableCellEvent<Row, Column>]
}>()

const slots = useSlots()
const expandedRows = defineModel<ComposableTableKey[]>('expandedRows', { default: () => [] })
const expandedKeys = computed(() => new Set(expandedRows.value))
const gridColumns = computed(() => props.columns.map(column => {
  if (typeof column.width === 'number') return `${column.width}px`
  return `minmax(${column.minWidth ?? 0}px, ${column.width ?? '1fr'})`
}).join(' '))
const minWidth = computed(() => props.columns.reduce((width, column) =>
  width + (typeof column.width === 'number' ? column.width : column.minWidth ?? 0), 0))

function cellAttrs(row: Row, column: Column): ButtonHTMLAttributes {
  return {
    type: column.interactive ? 'button' : undefined,
    class: [column.overflow ?? 'ellipsis', { interactive: column.interactive }, props.cellClass?.(row, column)],
    style: { textAlign: column.align ?? 'center' },
  }
}

function cellTooltip(column: Column) {
  return { text: column.tooltip ?? '', disabled: !column.tooltip }
}

function onCellClick(row: Row, column: Column, event: MouseEvent) {
  emit('cellClick', { row, rowKey: props.rowKey(row), column, columnKey: column.key, event })
}

function isExpanded(row: Row) {
  return !!slots.expanded && expandedKeys.value.has(props.rowKey(row))
}

function toggleExpanded(row: Row) {
  const key = props.rowKey(row)
  expandedRows.value = isExpanded(row)
    ? expandedRows.value.filter(value => value !== key)
    : [...expandedRows.value, key]
}

function onRowClick(row: Row, event: MouseEvent) {
  if (!props.expandOnRowClick || !slots.expanded || event.defaultPrevented) return
  if (event.target instanceof Element && event.target.closest('button, a, input, select, textarea')) return
  toggleExpanded(row)
}

// Как у локальных строк: исчезнувшая строка при возвращении начинает закрытой.
watch(() => props.rows.map(props.rowKey), keys => {
  const visible = new Set(keys)
  if (expandedRows.value.some(key => !visible.has(key))) {
    expandedRows.value = expandedRows.value.filter(key => visible.has(key))
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/textColors.scss' as *;

.composable-table {
  min-width: 0;
  overflow-x: auto;
  font-size: 14px;
}

.composable-table-head,
.composable-table-line {
  display: grid;
  grid-template-columns: var(--composable-table-columns);
}

.composable-table-row {
  transition: margin 0.15s ease;

  &:nth-child(2n+1) {
    background: rgba(248, 252, 255, 0.025);
  }

  &.expanded {
    margin: 6px 0;
    background: rgba(255, 255, 255, 0.035);
  }
}

.composable-table-line {
  min-height: var(--composable-table-row-height, 52px);

  &.expand-on-click {
    cursor: pointer;

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background: rgba(255, 255, 255, 0.04);
      }
    }
  }
}

.composable-table-cell {
  position: relative;
  min-width: 0;
  align-content: center;
  padding: var(--composable-table-cell-padding, 1px 10px);
  color: inherit;
  font: inherit;
  font-variant-numeric: tabular-nums;
  box-sizing: border-box;

  &.ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.wrap {
    white-space: normal;
    overflow-wrap: anywhere;
  }

  &.visible {
    white-space: nowrap;
  }

  &.interactive:hover {
    background: rgba(255, 255, 255, 0.045);
  }
}

.composable-table-expanded {
  padding: 10px 18px 18px;
}

.composable-table-empty {
  padding: 40px 15px;
  text-align: center;
}

.composable-table-skeleton {
  height: var(--composable-table-row-height, 52px);

  &:nth-child(2n) {
    background: rgba(248, 252, 255, 0.025);
  }

  &::after {
    content: '';
    display: block;
    height: 100%;
    opacity: 0.5;
    @include text-skeleton(transparent, #aaaaaa3e);
  }
}
</style>
