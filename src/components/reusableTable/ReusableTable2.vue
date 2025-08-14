<template>
  <div class="reusable-table" ref="reusableTable" :style="{ [`--background-color`]: props.backgroundColor }">
  </div>
</template>


<script setup lang="ts" generic="T">
import { useElementSize } from '@vueuse/core'
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { type ReusableTableCell } from './ReusableTableCell'
import { ReusableTable as ReusableTable2, ReusableTableDelegate } from './ReusableTable.ts'


const reusableTable = ref<HTMLElement | null>(null)
const scroll = ref<HTMLElement | null>(null)
const fallbackContent = ref<HTMLElement | null>(null)
const wrapper = ref<HTMLElement | null>(null)

const scrollVelocity = ref(0)

const props = defineProps<{
  data: T[],
  backgroundColor?: string,
  delegate: ReusableTableDelegate
}>()

defineExpose({
  scrollTo: (index: number) => { },
  scrollVelocity
})

let reusableTableController: ReusableTable2 | null = null
onMounted(() => {
  reusableTableController = new ReusableTable2(reusableTable.value!, props.delegate)
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