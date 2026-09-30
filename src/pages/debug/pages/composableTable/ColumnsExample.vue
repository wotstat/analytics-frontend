<template>
  <div class="debug-row">
    <label class="debug-control">Переполнение названия
      <select v-model="overflow">
        <option value="ellipsis">Обрезка</option>
        <option value="wrap">Перенос</option>
        <option value="visible">Видимое переполнение</option>
      </select>
    </label>
    <label class="debug-control">Выравнивание значений
      <select v-model="align">
        <option value="left">Слева</option>
        <option value="center">По центру</option>
        <option value="right">Справа</option>
      </select>
    </label>
    <label class="debug-control"><input v-model="fixedName" type="checkbox">Название: 220 px вместо 2fr</label>
    <label class="debug-control"><input v-model="narrow" type="checkbox">Контейнер 320 px</label>
    <label class="debug-control"><input v-model="highlight" type="checkbox">Подсветка отрицательного значения</label>
    <label class="debug-control"><input v-model="sortable" type="checkbox">Сортировка</label>
  </div>
  <div class="debug-row">
    <span class="debug-label">Колонки:</span>
    <label v-for="column in demoColumns" :key="column.key" class="debug-control">
      <input
        v-model="visibleKeys"
        type="checkbox"
        :value="column.key"
        :disabled="visibleKeys.length === 1 && visibleKeys.includes(column.key)">
      {{ column.label }}
    </label>
    <label class="debug-control"><input v-model="reverseColumns" type="checkbox">Обратный порядок колонок</label>
    <button class="debug-btn" @click="sort = []">Сбросить сортировку</button>
    <button class="debug-btn" :disabled="!sortable" @click="addSecondarySort">Добавить приоритет</button>
  </div>
  <div class="example" :class="{ narrow }">
    <ComposableTable
      :rows
      :columns
      :row-key="row => row.id"
      :sort
      :cell-class="cellClass"
      @sort="toggleSort" />
  </div>
  <p class="debug-value">Порядок: {{ sort.map(order => `${order.key} ${order.ascending ? '↑' : '↓'}`).join(' → ') || 'исходный' }}</p>
  <p class="debug-note">
    Клик по заголовку меняет направление, Alt + клик добавляет вторичный порядок.
    На сенсорном экране используйте «Добавить приоритет». Одинаковые значения 125 позволяют увидеть вторичную сортировку.
    Наведите на заголовок или числовую ячейку для tooltip. При нехватке места прокручивается сама таблица.
    В режиме видимого переполнения длинный текст может перекрывать соседнюю ячейку.
  </p>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ComposableTable from '@/shared/ui/composableTable/ComposableTable.vue'
import type { ComposableTableSort } from '@/shared/ui/composableTable/types'
import { demoColumns, demoRows, type DemoColumn, type DemoRow } from './data'

const overflow = ref<DemoColumn['overflow']>('ellipsis')
const align = ref<DemoColumn['align']>('right')
const fixedName = ref(false)
const narrow = ref(false)
const highlight = ref(true)
const sortable = ref(true)
const reverseColumns = ref(false)
const visibleKeys = ref<DemoColumn['key'][]>(demoColumns.map(column => column.key))
const sort = ref<ComposableTableSort<DemoColumn['key']>[]>([])
const columns = computed<DemoColumn[]>(() => {
  const result = demoColumns.filter(column => visibleKeys.value.includes(column.key)).map(column => ({
    ...column,
    sortable: sortable.value,
    ...(column.key === 'name'
      ? { width: fixedName.value ? 220 : '2fr', overflow: overflow.value }
      : { align: align.value, tooltip: `Ячейка колонки «${column.label}»` }),
  }))
  return reverseColumns.value ? result.reverse() : result
})
const rows = computed(() => [...demoRows].sort((a, b) => {
  for (const { key, ascending } of sort.value) {
    const left = a[key], right = b[key]
    if (left == null && right == null) continue
    if (left == null) return 1
    if (right == null) return -1
    const delta = typeof left === 'string' && typeof right === 'string' ? left.localeCompare(right) : Number(left) - Number(right)
    if (delta) return ascending ? delta : -delta
  }
  return 0
}))

function toggleSort(key: DemoColumn['key'], event: MouseEvent) {
  const existing = sort.value.find(order => order.key === key)
  const order = { key, ascending: existing ? !existing.ascending : false }
  sort.value = event.altKey ? [...sort.value.filter(item => item.key !== key), order] : [order]
}

function addSecondarySort() {
  if (!sortable.value) return
  const column = columns.value.find(column => !sort.value.some(order => order.key === column.key))
  if (column) sort.value = [...sort.value, { key: column.key, ascending: false }]
}

function cellClass(row: DemoRow, column: DemoColumn) {
  return highlight.value && column.key === 'score' && row.score != null && row.score < 0 ? 'negative-value' : undefined
}

watch(columns, columns => {
  sort.value = sort.value.filter(order => columns.some(column => column.key === order.key && column.sortable))
})
</script>

<style scoped lang="scss">
.example {
  width: 100%;
  min-width: 0;

  &.narrow {
    width: 320px;
    max-width: 100%;
  }
}

:deep(.negative-value) {
  color: #ffb4a8;
  background: #ff68451a;
}
</style>
