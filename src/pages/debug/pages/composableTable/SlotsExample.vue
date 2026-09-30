<template>
  <div class="debug-row">
    <label class="debug-control"><input v-model="commonHeader" type="checkbox">Общий header</label>
    <label class="debug-control"><input v-model="namedHeader" type="checkbox">Иконка в header-score</label>
    <label class="debug-control"><input v-model="commonCell" type="checkbox">Общий cell</label>
    <label class="debug-control"><input v-model="emptyCount" type="checkbox">Пустой cell-count</label>
  </div>
  <div class="debug-row">
    <span class="debug-label">Именные слоты ячеек (выбор в рантайме):</span>
    <label v-for="key in customizableKeys" :key class="debug-control">
      <input v-model="specializedKeys" type="checkbox" :value="key">cell-{{ key }}
    </label>
  </div>
  <ComposableTable :rows="demoRows.slice(0, 4)" :columns="demoColumns" :row-key="row => row.id">
    <template v-if="commonHeader" #header="{ column }">
      <span class="common-header">{{ column.label }} · общий</span>
    </template>
    <template v-if="namedHeader" #header-score="{ column }">
      <span class="icon-heading">
        <svg viewBox="0 0 24 24" width="16" height="16"><path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="currentColor" /></svg>
        {{ column.label }}
      </span>
    </template>
    <template v-if="commonCell" #cell="{ value, rowIndex }">
      <span class="common-value">{{ rowIndex + 1 }}: {{ value ?? 'нет значения' }}</span>
    </template>
    <template v-for="key in specializedKeys" :key #[`cell-${key}`]="{ value, column }">
      <span class="badge">{{ column.key }}: {{ value ?? 'нет значения' }}</span>
    </template>
    <template v-if="emptyCount" #cell-count></template>
  </ComposableTable>
  <p class="debug-note">
    Включите общий cell и именной cell-score: бейдж заменяет общий renderer только в выбранной колонке.
    Пустой cell-count не должен показывать ни число, ни общий renderer.
    Иконка заголовка сохраняет tooltip с названием колонки.
  </p>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ComposableTable from '@/shared/ui/composableTable/ComposableTable.vue'
import { demoColumns, demoRows } from './data'

const commonHeader = ref(false)
const namedHeader = ref(true)
const commonCell = ref(false)
const emptyCount = ref(false)
const customizableKeys = ['name', 'score'] as const
const specializedKeys = ref<(typeof customizableKeys)[number][]>(['score'])
</script>

<style scoped lang="scss">
.common-header,
.common-value {
  color: #b3c6de;
}

.icon-heading {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #ffc979;
}

.badge {
  padding: 3px 8px;
  border-radius: 5px;
  background: #3c536d;
}
</style>
