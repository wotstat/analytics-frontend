<template>
  <div class="reuse-table debug-col">
    <span class="debug-label">{{ title }}</span>

    <div class="debug-stage table-stage" :class="{ 'show-fallback': showFallback }" ref="stage">
      <TableView ref="table" :key="`${mode}-${poolLimit}`" :delegate background-color="#2a2a2a" />
    </div>

    <div class="debug-row">
      <span class="debug-hint">создано узлов: <span class="debug-value">{{ shown.created }}</span></span>
      <span class="debug-hint">configure: <span class="debug-value">{{ shown.configured }}</span></span>
      <span class="debug-hint">строк в DOM: <span class="debug-value">{{ stats.scrollCells }} +
          {{ stats.fallbackCells }}</span></span>
    </div>
  </div>
</template>


<script setup lang="ts">
import { markRaw, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import TableView from '@/shared/uiKit/tableView/TableView.vue'
import type { TableViewDelegate } from '@/shared/uiKit/tableView/tableView/TableView'
import type { ComponentInstance } from '@/shared/utils/types/ComponentInstance'
import type { TableRow } from '@/pages/debug/shared/fixtures/types'
import { RowCell, type CellStats } from '../../shared/RowCell'
import { BrokenRowCell } from '../../shared/BrokenRowCell'
import { useTableDomStats } from '../../shared/useTableDomStats'

const ROW_HEIGHT = 30

const props = defineProps<{
  title: string
  rows: TableRow[]
  broken: boolean
  mode: 'pool' | 'fresh' | 'shared'
  poolLimit: number
  showNodeId: boolean
  showFallback: boolean
}>()

const table = useTemplateRef<ComponentInstance<typeof TableView>>('table')
const stage = useTemplateRef<HTMLElement>('stage')

const { stats } = useTableDomStats(stage)

const counters: CellStats = { created: 0, configured: 0 }
const shown = ref({ ...counters })
const timer = setInterval(() => shown.value = { ...counters }, 250)

const sharedCells = new Map<number, RowCell>()

function cellKey() {
  return props.broken ? BrokenRowCell.reusableKey : RowCell.reusableKey
}

function createCell(): RowCell {
  return props.broken ? new BrokenRowCell({ stats: counters }) : new RowCell({ stats: counters })
}

const delegate: TableViewDelegate = markRaw({

  onSetupComplete: table => table.registerReusable(cellKey(), createCell, props.poolLimit),

  numberOfSections: () => 1,
  numberOfRowsInSection: () => props.rows.length,

  heightForCellByIndex: () => ROW_HEIGHT,
  cellForIndex: (table, index) => {
    const config = {
      row: props.rows[index.row],
      index,
      height: ROW_HEIGHT,
      showNodeId: props.showNodeId,
    }

    if (props.mode === 'fresh') {
      const cell = createCell()
      cell.configure(config)
      return cell
    }

    if (props.mode === 'shared') {
      const cached = sharedCells.get(index.row) ?? createCell()
      sharedCells.set(index.row, cached)
      cached.configure(config)
      return cached
    }

    const cell = table.getReusable<RowCell>(cellKey())
    cell.configure(config)
    return { cell, reusableKey: cellKey() }
  },
})

function reset() {
  counters.created = 0
  counters.configured = 0
  shown.value = { ...counters }
  sharedCells.clear()
}

defineExpose({ reset })

watch(() => [props.mode, props.poolLimit], reset)
watch(() => [props.rows, props.showNodeId], () => table.value?.dataDidUpdate())

onUnmounted(() => {
  clearInterval(timer)
  sharedCells.clear()
})

</script>


<style scoped lang="scss">
@use '../../shared/fallbackLayer.scss' as *;

.table-stage {
  padding: 0.5em;
  height: 300px;
  box-sizing: border-box;

  &.show-fallback {
    @include fallback-layer-visible;
  }
}
</style>
