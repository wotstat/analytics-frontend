<template>
  <DebugSection title="Условные параметры" id="conditional-params"
    source="src/shared/uiKit/queryStorage/utils/queryStorageCoordinator.ts"
    description="Поиск объявлен раньше режима. Режим и поиск имеют debounce 400/600 мс. Скрытие сохраняет поиск в памяти; второй владелец может удерживать его в URL независимо от режима.">
    <p>Режим: {{ mode }}. Поиск в памяти: {{ search || 'пусто' }}</p>
    <div class="debug-row">
      <button class="debug-btn" @click="mode = 'details'">Подробная таблица</button>
      <button class="debug-btn" @click="mode = 'summary'">Сводная таблица</button>
      <button class="debug-btn" @click="storage.flush()">Записать условные параметры</button>
    </div>
    <label v-if="mode === 'details'" class="debug-control">Условный поиск <input v-model="search" /></label>
    <label><input v-model="secondOwner" type="checkbox" /> Второй владелец поиска (ref)</label>
    <label><input v-model="getterOwner" type="checkbox" /> Третий владелец поиска (getter)</label>
    <p>Отключённый параметр в памяти: {{ disabled || 'пусто' }}</p>
    <button class="debug-btn" @click="disabled = 'сохранено'">Изменить параметр с enabled: false</button>
  </DebugSection>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQueryStorage } from '@/shared/uiKit/queryStorage/useQueryStorage'
import { stringParam } from '@/shared/uiKit/queryStorage/params'
import DebugSection from '../../shared/DebugSection.vue'
import { conditionalMode, conditionalSearch } from './params'

const secondOwner = ref(false)
const getterOwner = ref(false)
// Проверяем чтение контекста независимо от порядка регистрации его владельцев.
const storage = useQueryStorage({
  search: conditionalSearch,
  disabled: stringParam('', { label: 'debug-disabled', enabled: false })
})
const { search, disabled } = storage.params
useQueryStorage({ search: { ...conditionalSearch, enabled: secondOwner } })
useQueryStorage({ search: { ...conditionalSearch, enabled: () => getterOwner.value } })
const { params: { mode } } = useQueryStorage({ mode: conditionalMode })
</script>
