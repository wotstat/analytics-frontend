<template>
  <DebugSection title="PanelPopover: плотность и слоты" id="panel-popover"
    description="Панель сайта поверх PopoverAutoClose: ширина не зависит от плотности, шапка и footer остаются на месте при прокрутке."
    source="src/shared/ui/popover/PanelPopover.vue">

    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">ширина</span>
        <select v-model.number="width">
          <option :value="250">250 px</option>
          <option :value="360">360 px</option>
          <option :value="560">560 px</option>
        </select>
      </label>
      <label class="debug-control">
        <span class="debug-label">длинный заголовок</span>
        <input v-model="longTitle" type="checkbox">
      </label>
    </div>

    <div class="debug-stage center short">
      <div class="debug-row">
        <button ref="standardTarget" class="debug-btn" @click="toggleStandard">Обычная панель</button>
        <button ref="compactTarget" class="debug-btn" @click="compactOpen = !compactOpen">Компактная панель</button>
      </div>
    </div>

    <p class="debug-hint">Обычная: {{ standardOpen ? 'открыта' : 'закрыта' }}, нажатий: {{ standardClicks }}</p>

    <PanelPopover v-model="standardOpen" :target="standardTarget" :width="width"
      :title="longTitle ? 'Очень длинный заголовок настроек и дополнительных параметров' : 'Настройки панели'"
      :placement="['bottom-start', 'top-start', 'bottom-float']">
      <template #toolbar>
        <button class="panel-action" type="button" @click="resetCount++">Сброс · {{ resetCount }}</button>
      </template>
      <template #content>
        <section class="panel-section">
          <h3>Раздел h3</h3>
          <p class="panel-note">Поясняющий текст остаётся внутри области прокрутки.</p>
        </section>
        <hr class="panel-divider">
        <section class="panel-section">
          <h4>Подраздел h4</h4>
          <h5>Детали h5</h5>
          <label v-for="item in 18" :key="item" class="demo-option">
            <input type="checkbox"> Пункт {{ item }}
          </label>
        </section>
      </template>
      <template #footer>Footer остаётся под списком</template>
    </PanelPopover>

    <PanelPopover v-model="compactOpen" :target="compactTarget" :width="width" density="compact"
      title="Этот заголовок заменён" :placement="['bottom-start', 'top-start', 'bottom-float']">
      <template #header>
        <header class="custom-header">
          <strong>Своя шапка</strong>
          <button class="panel-action" type="button" @click="compactOpen = false">Закрыть</button>
        </header>
      </template>
      <template #toolbar><span>Не дублировать</span></template>
      <template #content>
        <section class="panel-section">
          <h3>Раздел h3</h3>
          <h4>Подраздел h4</h4>
          <h5>Детали h5</h5>
          <p class="panel-note">Компактная типографика и отступы.</p>
        </section>
      </template>
    </PanelPopover>

    <p class="debug-note">
      На узком экране длинный заголовок и кнопка справа должны переноситься без горизонтальной прокрутки.
      Открой обычную панель, прокрути список и проверь неподвижность шапки и footer. В компактной панели
      должна быть только своя шапка, без второго заголовка и toolbar. Обе панели закрываются по Escape и клику снаружи.
    </p>
  </DebugSection>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import PanelPopover from '@/shared/ui/popover/PanelPopover.vue'

const standardTarget = useTemplateRef<HTMLButtonElement>('standardTarget')
const compactTarget = useTemplateRef<HTMLButtonElement>('compactTarget')
const standardOpen = ref(false)
const standardClicks = ref(0)
const compactOpen = ref(false)
const width = ref(360)
const longTitle = ref(false)
const resetCount = ref(0)

function toggleStandard() {
  standardClicks.value++
  standardOpen.value = !standardOpen.value
}
</script>

<style scoped lang="scss">
.panel-action {
  flex: none;
  padding: 4px 7px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  font-size: 12px;

  &:hover {
    background: rgba(255, 255, 255, 0.16);
  }
}

.custom-header {
  box-sizing: border-box;
  display: flex;
  flex: none;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-width: 0;
  padding: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  strong {
    font-size: 14px;
    overflow-wrap: anywhere;
  }
}

.demo-option {
  display: block;
  padding: 4px 0;
  cursor: pointer;

  input {
    accent-color: var(--blue-color);
  }
}
</style>
