<template>
  <DebugSection title="Адаптивная панель" id="responsive-panel-popover"
    description="До заданного порога включительно — модальное окно, выше — поповер. Измени ширину с открытой панелью."
    source="src/shared/ui/popover/ResponsivePanelPopover.vue">
    <div class="debug-row">
      <label class="debug-control">
        <span class="debug-label">порог</span>
        <select v-model.number="breakpoint">
          <option :value="500">500 px</option>
          <option :value="700">700 px</option>
          <option :value="900">900 px</option>
        </select>
      </label>
      <label class="debug-control"><input v-model="compact" type="checkbox"> Компактная</label>
      <label class="debug-control"><input v-model="customHeader" type="checkbox"> Своя шапка</label>
      <label class="debug-control"><input v-model="modalFullHeight" type="checkbox"> Полная высота модального окна</label>
      <button ref="trigger" class="debug-btn" @click="open = !open">Адаптивная панель</button>
    </div>
    <p class="debug-hint">Выбрано: {{ selected.length }}, действий: {{ clicks }}, вложенная: {{ nestedOpen }}</p>

    <ResponsivePanelPopover v-model="open" :target="trigger" title="Настройки адаптивной панели" :breakpoint
      :width="560" :density="compact ? 'compact' : 'standard'" :placement="['bottom-start', 'top-start']" :modal-full-height
      @mode-change="nestedOpen = false">
      <template v-if="customHeader" #header>
        <header class="panel-header"><h2 class="panel-header-title">Своя шапка адаптивной панели</h2></header>
      </template>
      <template #toolbar><button class="debug-btn" @click="clicks++">Действие · {{ clicks }}</button></template>
      <template #content>
        <section class="panel-section">
          <h3>Параметры</h3>
          <button ref="nestedTrigger" class="debug-btn" @click="nestedOpen = true">Вложенная панель</button>
        </section>
        <section class="panel-section">
          <h3>Длинный список</h3>
          <label v-for="item in 30" :key="item" class="demo-option">
            <input v-model="selected" type="checkbox" :value="item"> Параметр {{ item }}
          </label>
        </section>
        <ResponsivePanelPopover v-model="nestedOpen" :target="nestedTrigger" title="Вложенная панель" :breakpoint>
          <p class="panel-note">Закрой это окно крестиком, по фону или Escape. Основная панель остаётся открытой.</p>
        </ResponsivePanelPopover>
      </template>
      <template #footer>Выбранные параметры сохраняются при переключении режима.</template>
    </ResponsivePanelPopover>
  </DebugSection>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import ResponsivePanelPopover from '@/shared/ui/popover/ResponsivePanelPopover.vue'

const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const nestedTrigger = useTemplateRef<HTMLButtonElement>('nestedTrigger')
const open = ref(false)
const nestedOpen = ref(false)
const breakpoint = ref(700)
const compact = ref(false)
const customHeader = ref(false)
const modalFullHeight = ref(false)
const clicks = ref(0)
const selected = ref<number[]>([])

watch(open, value => {
  if (!value) nestedOpen.value = false
})
</script>

<style scoped lang="scss">
.demo-option {
  display: block;
  padding: 6px 0;

  input {
    accent-color: var(--blue-color);
  }
}
</style>
