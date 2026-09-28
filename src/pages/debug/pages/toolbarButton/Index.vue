<template>
  <DebugPage title="ToolbarButton" description="Варианты кнопки тулбара, состояния и цель поповера без данных из БД."
    source="src/shared/ui/toolbarButton/ToolbarButton.vue">
    <DebugSection title="Размеры и состояния" id="toolbar-button-variants"
      description="Кнопки сохраняют размер при смене состояния; заблокированные не отправляют событие click."
      source="src/shared/ui/toolbarButton/ToolbarButton.vue">
      <div class="debug-row">
        <label class="debug-control"><span class="debug-label">активные</span><input v-model="active" type="checkbox"></label>
        <label class="debug-control"><span class="debug-label">заблокировать</span><input v-model="disabled" type="checkbox"></label>
      </div>
      <div class="debug-stage center short">
        <div class="examples">
          <ToolbarButton :icon="SettingsIcon" variant="surface" size="large" :active :disabled
            @click="countClick" />
          <ToolbarButton variant="accent" :active :disabled @click="countClick"><span class="dots"></span></ToolbarButton>
          <ToolbarButton :icon="ResetIcon" size="small" :active :disabled
            @click="countClick" />
          <ToolbarButton :icon="ResetIcon" variant="round" :active :disabled
            @click="countClick" />
        </div>
      </div>
      <p class="debug-hint">Нажатий: {{ clicks }}. Последняя DOM-цель: {{ lastTarget }}.</p>
      <p class="debug-note">Проверь наведение и фокус через Tab. Enter и Space должны прибавлять
        по одному нажатию. При блокировке счётчик не меняется. У кнопок нет title и aria-атрибутов.</p>
    </DebugSection>

    <DebugSection title="Привязка поповера" id="toolbar-button-popover"
      description="Поповер должен появиться у кнопки и закрыться по Escape или нажатию снаружи."
      source="src/shared/ui/toolbarButton/ToolbarButton.vue">
      <div class="debug-stage center short">
        <ToolbarButton ref="trigger" :icon="SettingsIcon" variant="surface" size="large"
          @click="open = !open" />
      </div>
      <PanelPopover v-model="open" :target="target" title="Панель кнопки" :width="250"
        :placement="['bottom-start', 'top-start']">
        <template #content><p>Цель — DOM-элемент кнопки ToolbarButton.</p></template>
      </PanelPopover>
    </DebugSection>
  </DebugPage>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import SettingsIcon from '@/assets/icons/settings.svg'
import ResetIcon from '@/assets/icons/reset.svg'
import DebugPage from '@/pages/debug/shared/DebugPage.vue'
import DebugSection from '@/pages/debug/shared/DebugSection.vue'
import PanelPopover from '@/shared/ui/popover/PanelPopover.vue'
import ToolbarButton from '@/shared/ui/toolbarButton/ToolbarButton.vue'

const active = ref(false)
const disabled = ref(false)
const clicks = ref(0)
const lastTarget = ref('—')
const open = ref(false)
const trigger = useTemplateRef<InstanceType<typeof ToolbarButton>>('trigger')
const target = computed(() => trigger.value?.element ?? null)

function countClick(event: MouseEvent) {
  clicks.value++
  lastTarget.value = (event.currentTarget as HTMLElement).tagName
}
</script>

<style scoped lang="scss">
.examples {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dots {
  position: relative;

  &,
  &::before,
  &::after {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: currentColor;
  }

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
  }

  &::before {
    right: 6px;
  }

  &::after {
    left: 6px;
  }
}
</style>
