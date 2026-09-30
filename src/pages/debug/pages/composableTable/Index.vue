<template>
  <DebugPage
    title="ComposableTable"
    description="Независимые примеры на локальных данных: настройка колонок, слоты, события и состояния таблицы."
    source="src/shared/ui/composableTable/ComposableTable.vue">
    <DebugSection
      id="columns"
      title="Колонки и сортировка"
      description="Таблица без слотов: заголовки берутся из label, ячейки — из value(row). Ноль виден, null и undefined заменяются на тире."
      source="src/pages/debug/pages/composableTable/ColumnsExample.vue">
      <ColumnsExample />
    </DebugSection>
    <DebugSection
      id="slots"
      title="Общие и именные слоты"
      description="Именной слот приоритетнее общего. Если оба выключены, используется стандартное содержимое. Пустой именной слот остаётся пустым."
      source="src/pages/debug/pages/composableTable/SlotsExample.vue">
      <SlotsExample />
    </DebugSection>
    <DebugSection
      id="expansion"
      title="Раскрытие строк и события"
      description="Раскрытие по строке, кнопке внутри слота или событию ячейки. Ключи сохраняют раскрытие при перестановке, удалённая строка возвращается закрытой."
      source="src/pages/debug/pages/composableTable/ExpansionExample.vue">
      <ExpansionExample />
    </DebugSection>
    <DebugSection
      id="states"
      title="Состояния и оформление"
      description="Стандартные и собственные loading / empty, footer с порционным выводом и настройка размеров через CSS-переменные."
      source="src/pages/debug/pages/composableTable/StatesExample.vue">
      <StatesExample />
    </DebugSection>
  </DebugPage>
</template>

<script setup lang="ts">
import DebugPage from '../../shared/DebugPage.vue'
import DebugSection from '../../shared/DebugSection.vue'
import ColumnsExample from './ColumnsExample.vue'
import SlotsExample from './SlotsExample.vue'
import ExpansionExample from './ExpansionExample.vue'
import StatesExample from './StatesExample.vue'
</script>
