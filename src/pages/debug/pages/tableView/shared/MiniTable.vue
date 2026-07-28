<template>
  <TableView ref="table" :delegate background-color="#2a2a2a" />
</template>


<script setup lang="ts">
import { markRaw, useTemplateRef, watch } from 'vue'
import TableView from '@/shared/uiKit/tableView/TableView.vue'
import type { TableViewDelegate } from '@/shared/uiKit/tableView/tableView/TableView'
import { HeaderLine } from '@/shared/uiKit/tableView/tableView/default/HeaderLine'
import type { ComponentInstance } from '@/shared/utils/types/ComponentInstance'
import type { TableRow } from '@/pages/debug/shared/fixtures/types'
import { RowCell } from './RowCell'

const props = defineProps<{
  rows: TableRow[]
  header?: string
  height?: number
  vary?: boolean
  lie?: boolean
  clip?: boolean
  noSections?: boolean
}>()

const table = useTemplateRef<ComponentInstance<typeof TableView>>('table')

function baseHeight() {
  return props.height ?? 30
}

function realHeight(row: number) {
  return props.vary ? baseHeight() + (row % 4) * 12 : baseHeight()
}

function reportedHeight(row: number) {
  return props.lie ? baseHeight() : realHeight(row)
}

const delegate: TableViewDelegate = markRaw({

  onSetupComplete: table => {
    table.registerReusable(RowCell.reusableKey, () => new RowCell(), 30)
    table.registerReusable(HeaderLine.reusableKey, () => new HeaderLine())
  },

  numberOfSections: () => props.noSections ? 0 : 1,
  numberOfRowsInSection: () => props.rows.length,

  heightForCellByIndex: (_, index) => reportedHeight(index.row),
  cellForIndex: (table, index) => {
    const cell = table.getReusable<RowCell>(RowCell.reusableKey)
    cell.configure({
      row: props.rows[index.row],
      index,
      height: realHeight(index.row),
      clip: props.clip !== false,
    })
    return { cell, reusableKey: RowCell.reusableKey }
  },

  heightForHeaderInSection: () => props.header ? 26 : 0,
  headerCellForSection: (table) => {
    if (!props.header) return null
    const header = table.getReusable<HeaderLine>(HeaderLine.reusableKey)
    header.setTitle(props.header)
    return { header, reusableKey: HeaderLine.reusableKey }
  },
})

defineExpose({
  dataDidUpdate: () => table.value?.dataDidUpdate(),
})

watch(() => [props.rows, props.header, props.height, props.vary, props.lie, props.clip, props.noSections], () => table.value?.dataDidUpdate())

</script>
