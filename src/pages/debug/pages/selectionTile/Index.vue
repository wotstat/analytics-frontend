<template>
  <DebugPage title="SelectionTile"
    description="Текстовая плитка и плитка со встроенным действием без запросов к БД."
    source="src/shared/ui/selectionTile/SelectionTile.vue">
    <DebugSection title="Основная поверхность" id="selection-tile-simple"
      description="Нажатие на любую часть плитки переключает выбор ровно один раз."
      source="src/shared/ui/selectionTile/SelectionTile.vue">
      <div class="debug-row">
        <label class="debug-control">
          <span class="debug-label">заблокировать</span>
          <input v-model="disabled" type="checkbox">
        </label>
      </div>
      <div class="debug-stage center short">
        <div class="tile-list">
          <SelectionTile :selected="simpleSelected" :disabled @select="selectSimple">Обычная плитка с длинной областью клика</SelectionTile>
          <SelectionTile density="compact" accent-color="#bbaad6" :selected="compactSelected" :disabled
            @select="compactSelected = !compactSelected">
            Компактная цветная плитка
          </SelectionTile>
        </div>
      </div>
      <p class="debug-hint">Основных нажатий: {{ simpleClicks }}. Выбор: {{ simpleSelected ? 'да' : 'нет' }}.</p>
    </DebugSection>

    <DebugSection title="Встроенное действие" id="selection-tile-action"
      description="Правая кнопка меняет цвет, не выбирая плитку; вся остальная поверхность выбирает плитку."
      source="src/shared/ui/selectionTile/SelectionTile.vue">
      <div class="debug-stage center short">
        <SelectionTile class="metric-tile" :selected="metricSelected" :accent-color="alternateColor ? '#bbaad6' : undefined"
          action :action-active="alternateColor"
          @select="selectMetric" @action="changeColor">
          <span class="metric-icon">◆</span>
          <span class="metric-label">Пример метрики</span>
          <template #action><span>⋯</span></template>
        </SelectionTile>
      </div>
      <p class="debug-hint">Выборов: {{ metricClicks }}; встроенных действий: {{ actionClicks }}.</p>
      <p class="debug-note">Проверь края и отступы обеих кнопок мышью и клавишами Tab, Enter, Space.
        Фокус должен быть виден; нажатие «⋯» не меняет счётчик выбора.</p>
    </DebugSection>
  </DebugPage>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import SelectionTile from '@/shared/ui/selectionTile/SelectionTile.vue'

const disabled = ref(false)
const simpleSelected = ref(false)
const compactSelected = ref(true)
const simpleClicks = ref(0)
const metricSelected = ref(false)
const alternateColor = ref(false)
const metricClicks = ref(0)
const actionClicks = ref(0)

function selectSimple() {
  simpleClicks.value++
  simpleSelected.value = !simpleSelected.value
}

function selectMetric() {
  metricClicks.value++
  metricSelected.value = !metricSelected.value
}

function changeColor() {
  actionClicks.value++
  alternateColor.value = !alternateColor.value
}
</script>

<style scoped lang="scss">
.tile-list {
  display: grid;
  gap: 6px;
  width: min(340px, 100%);
}

.metric-tile {
  --selection-tile-main-padding: 4px 8px;
  --selection-tile-gap: 8px;

  width: min(340px, 100%);

  .metric-icon {
    color: #bbaad6;
    font-size: 26px;
    line-height: 1;
  }

  .metric-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
