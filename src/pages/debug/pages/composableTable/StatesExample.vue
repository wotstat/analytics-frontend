<template>
  <div class="debug-row">
    <label class="debug-control">Состояние
      <select v-model="state">
        <option value="ready">Данные</option>
        <option value="loading">Загрузка</option>
        <option value="empty">Пусто</option>
      </select>
    </label>
    <label class="debug-control">Строк skeleton
      <select v-model="skeletonRows">
        <option :value="0">0</option>
        <option :value="3">3</option>
        <option :value="5">5</option>
      </select>
    </label>
    <label class="debug-control"><input v-model="customStates" type="checkbox">Собственные loading / empty</label>
    <label class="debug-control"><input v-model="showFooter" type="checkbox">Footer</label>
    <label class="debug-control"><input v-model="compact" type="checkbox">Компактные размеры</label>
  </div>
  <ComposableTable
    :rows="state === 'empty' ? [] : demoRows.slice(0, limit)"
    :columns="demoColumns"
    :row-key="row => row.id"
    :loading="state === 'loading'"
    :skeleton-rows
    :class="{ compact }">
    <template v-if="customStates" #loading>
      <div class="custom-state">Собственный слот загрузки…</div>
    </template>
    <template v-if="customStates" #empty>
      <div class="custom-state">
        <p>Здесь пока пусто.</p>
        <button class="debug-btn" @click="state = 'ready'">Вернуть данные</button>
      </div>
    </template>
    <template v-if="showFooter" #footer>
      <div class="footer debug-row">
        <span>{{ state === 'ready' ? `Показано ${limit} из ${demoRows.length}` : 'Footer доступен и без строк' }}</span>
        <button v-if="state === 'ready'" class="debug-btn" @click="limit = limit === 3 ? demoRows.length : 3">
          {{ limit === 3 ? 'Показать все' : 'Показать три' }}
        </button>
      </div>
    </template>
  </ComposableTable>
  <p class="debug-note">
    При загрузке данные остаются переданными в rows, но вместо них виден skeleton или слот loading.
    Число показанных строк меняет этот пример через rows; footer только размещает кнопку.
    Компактный режим задаёт высоты строки и заголовка, а также отступы ячеек через CSS-переменные компонента.
  </p>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ComposableTable from '@/shared/ui/composableTable/ComposableTable.vue'
import { demoColumns, demoRows } from './data'

const state = ref('ready')
const skeletonRows = ref(5)
const customStates = ref(false)
const showFooter = ref(true)
const compact = ref(false)
const limit = ref(3)
</script>

<style scoped lang="scss">
.compact {
  --composable-table-row-height: 34px;
  --composable-table-heading-height: 30px;
  --composable-table-cell-padding: 1px 6px;
}

.custom-state {
  padding: 30px 15px;
  text-align: center;
  color: #b3c6de;
}

.footer {
  padding: 10px;
  border-top: 1px solid #ffffff20;
}
</style>
