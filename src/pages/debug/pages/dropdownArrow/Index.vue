<template>
  <DebugPage title="DropdownArrow" description="Стрелки раскрытия: направление, состояние, толщина, угол и превращение в крестик."
    source="src/shared/uiKit/dropdown/DropdownArrow.vue">
    <DebugSection title="Направление, толщина и угол" id="dropdown-arrow-variants"
      description="Нажатие переключает все стрелки: вертикальные вниз/вверх, горизонтальные вправо/вниз.">
      <div class="debug-row">
        <label class="debug-control">
          <span class="debug-label">Развёрнуто</span><input v-model="expanded" type="checkbox">
        </label>
      </div>
      <div v-for="angle in angles" :key="angle" class="angle-group">
        <h3>{{ angle === 'small' ? 'Малый наклон' : 'Большой наклон · 45°' }}</h3>
        <div class="debug-stage examples">
          <template v-for="weight in weights" :key="weight">
            <button v-for="horizontal in [false, true]" :key="String(horizontal)" class="debug-button variant"
              type="button" @click="expanded = !expanded">
              <span>{{ weight === 'bold' ? 'Жирная' : 'Тонкая' }} · {{ horizontal ? 'горизонтальная' : 'вертикальная' }}</span>
              <DropdownArrow :expanded :horizontal :weight :angle />
            </button>
          </template>
        </div>
      </div>
    </DebugSection>

    <DebugSection title="Размер и цвет" id="dropdown-arrow-size"
      description="Размер по умолчанию равен 1em, цвет наследуется от текста. При раскрытии размеры не меняются.">
      <div class="debug-stage debug-row sizes">
        <span v-for="size in [12, 20, 32]" :key="size" :style="{ fontSize: `${size}px` }">
          {{ size }} px <DropdownArrow v-for="weight in weights" :key="weight" :expanded :weight />
        </span>
      </div>
    </DebugSection>

    <DebugSection title="Стрелка → крестик" id="dropdown-crossing-arrow"
      description="Отдельный DropdownCrossingArrow сохраняет анимацию из Натиска. Открой меню и закрой кнопкой, Escape или кликом снаружи — иконка следует состоянию поповера."
      source="src/shared/uiKit/dropdown/DropdownCrossingArrow.vue">
      <div class="debug-stage debug-row">
        <button ref="closeTrigger" class="debug-btn close-trigger" type="button" @click="closeOpen = !closeOpen">
          Выбор дней <DropdownCrossingArrow :expanded="closeOpen" class="calendar-icon" />
        </button>
        <span class="sizes"><DropdownCrossingArrow :expanded="closeOpen" /></span>
      </div>
      <PanelPopover v-model="closeOpen" :target="closeTrigger" title="Пример меню" :width="260">
        <template #content>Меню открыто — стрелка превратилась в крестик.</template>
      </PanelPopover>
    </DebugSection>
  </DebugPage>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import DropdownArrow from '@/shared/uiKit/dropdown/DropdownArrow.vue'
import DropdownCrossingArrow from '@/shared/uiKit/dropdown/DropdownCrossingArrow.vue'
import PanelPopover from '@/shared/ui/popover/PanelPopover.vue'

const expanded = ref(false)
const closeOpen = ref(false)
const closeTrigger = useTemplateRef<HTMLButtonElement>('closeTrigger')
const weights = ['bold', 'thin'] as const
const angles = ['small', 'large'] as const
</script>

<style scoped lang="scss">
.angle-group {
  display: flex;
  flex-direction: column;
  gap: 8px;

  h3 {
    margin: 0;
    font-size: 14px;
  }
}

.examples {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.variant {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 16px;
}

.sizes {
  color: var(--blue-thin-color);
}

.close-trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.calendar-icon {
  width: 12px;
  height: 12px;
  margin: 2px 0 0 1px;
  color: white;
  transform: scale(0.85);
}
</style>
