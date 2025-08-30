<template>
  <div class="reusable-table" ref="reusableTable" :style="{ [`--background-color`]: props.backgroundColor }">
  </div>
</template>


<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { IndexPath, TableView, TableViewDelegate } from './tableView/TableView.ts'

const reusableTable = ref<HTMLElement | null>(null)

const props = defineProps<{
  backgroundColor?: string,
  delegate: TableViewDelegate
}>()

let reusableTableController: TableView | null = null

defineExpose({
  reusableTable: reusableTableController,
  dataDidUpdate: () => {
    reusableTableController?.dataDidUpdate()
  },
  scrollTo: (indexPath: IndexPath, behavior: ScrollBehavior) => {
    reusableTableController?.scrollTo(indexPath, behavior)
  },
})

onMounted(() => {
  reusableTableController = new TableView(reusableTable.value!, props.delegate)
})

onUnmounted(() => {
  reusableTableController?.dispose()
})

</script>


<style lang="scss" scoped>
.reusable-table {
  height: 100%;
  width: 100%;
  position: relative;
}
</style>