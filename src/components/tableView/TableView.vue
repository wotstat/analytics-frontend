<template>
  <div class="reusable-table" ref="reusableTable" :style="{ [`--background-color`]: props.backgroundColor }">
  </div>
</template>


<script setup lang="ts" generic="T">
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { IndexPath, TableView, TableViewDelegate } from './tableView/TableView.ts'

const reusableTable = ref<HTMLElement | null>(null)

const props = defineProps<{
  data: T[],
  backgroundColor?: string,
  delegate: TableViewDelegate
}>()

defineExpose({
  scrollTo: (indexPath: IndexPath, behavior: ScrollBehavior) => {
    reusableTableController?.scrollTo(indexPath, behavior)
  },
})

let reusableTableController: TableView | null = null
onMounted(() => {
  reusableTableController = new TableView(reusableTable.value!, props.delegate)
})

watch(() => props.data, () => {
  reusableTableController?.dataDidUpdate()
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