<template>
  <div class="debug-row">
    <label class="debug-control">Раскрытие
      <select v-model="mode">
        <option value="none">Выключено</option>
        <option value="row">По строке</option>
        <option value="button">Кнопкой в слоте</option>
        <option value="cell">Обработчиком cellClick</option>
      </select>
    </label>
    <button class="debug-btn" @click="reversed = !reversed">Переставить строки</button>
    <button class="debug-btn" @click="hideFirst = !hideFirst">{{ hideFirst ? 'Вернуть Альфу' : 'Убрать Альфу' }}</button>
    <button class="debug-btn" :disabled="mode === 'none'" @click="expanded = rows.map(row => row.id)">Раскрыть все</button>
    <button class="debug-btn" @click="expanded = []">Закрыть все</button>
  </div>
  <ComposableTable
    v-model:expanded-rows="expanded"
    :rows
    :columns
    :row-key="row => row.id"
    :expand-on-row-click="mode === 'row'"
    @cell-click="clickCell">
    <template #cell-name="{ row, expanded: isOpen, toggleExpanded }">
      <div class="name-cell">
        <span>{{ row.name }}</span>
        <button v-if="mode === 'button'" class="debug-btn" @click.stop="toggleExpanded">
          {{ isOpen ? 'Свернуть' : 'Раскрыть' }}
        </button>
        <button v-if="mode === 'row'" class="debug-btn" @click="log.push(`Вложенная кнопка: ${row.id}`)">
          Действие
        </button>
      </div>
    </template>
    <template v-if="mode !== 'none'" #expanded="{ row, rowIndex, close }">
      <div class="debug-col">
        <p>Строка {{ row.id }}, позиция {{ rowIndex + 1 }}. Значение: {{ row.score ?? 'нет значения' }}.</p>
        <div><button class="debug-btn" @click="close">Закрыть строку</button></div>
      </div>
    </template>
  </ComposableTable>
  <p class="debug-value">expandedRows: {{ JSON.stringify(expanded) }}</p>
  <p class="debug-note">
    В режиме «По строке» кнопка «Действие» создаёт события, но не раскрывает строку.
    В режиме cellClick вся ячейка становится кнопкой, а раскрытием управляет внешний обработчик.
    «Раскрыть все» и «Закрыть все» меняют v-model снаружи. При выключенном раскрытии события ячеек продолжают приходить.
  </p>
  <EventLog :entries="log.entries.value" @clear="log.clear" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ComposableTable from '@/shared/ui/composableTable/ComposableTable.vue'
import type { ComposableTableCellEvent, ComposableTableKey } from '@/shared/ui/composableTable/types'
import EventLog from '../../shared/EventLog.vue'
import { useEventLog } from '../../shared/useEventLog'
import { demoColumns, demoRows, type DemoColumn, type DemoRow } from './data'

const mode = ref('row')
const reversed = ref(false)
const hideFirst = ref(false)
const expanded = ref<ComposableTableKey[]>([])
const log = useEventLog({ max: 8 })
const columns = computed(() => demoColumns.map(column => ({ ...column, interactive: mode.value === 'cell' })))
const rows = computed(() => {
  const result = demoRows.slice(0, 4).filter(row => !hideFirst.value || row.id !== 'alpha')
  return reversed.value ? result.reverse() : result
})

function clickCell({ rowKey, columnKey, event }: ComposableTableCellEvent<DemoRow, DemoColumn>) {
  log.push(`cellClick: строка ${rowKey}, колонка ${columnKey}${event.altKey ? ', Alt' : ''}`)
  if (mode.value !== 'cell') return
  expanded.value = expanded.value.includes(rowKey)
    ? expanded.value.filter(key => key !== rowKey)
    : [...expanded.value, rowKey]
}

watch(mode, () => expanded.value = [])
watch(expanded, keys => log.push(`expandedRows: ${JSON.stringify(keys)}`))
</script>

<style scoped lang="scss">
.name-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
</style>
