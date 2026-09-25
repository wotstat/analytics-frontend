<template>
  <button ref="trigger" class="history-menu-trigger" type="button" title="Настройки аннотаций"
    aria-label="Настройки аннотаций" :aria-expanded="open" @click="open = !open">
    <span class="dots"></span>
  </button>

  <PopoverAutoClose v-model="open" :target="trigger" :placement="['bottom-end', 'bottom-float']"
    :viewport-offset="popoverViewportOffset" :arrow-size="0">
    <div class="annotation-settings">
      <header class="popover-heading">
        <h2>Настройки аннотаций</h2>
      </header>

      <div class="options">
        <h3>Версии игры</h3>
        <div class="version-options">
          <button v-for="option in versionOptions" :key="option.key" type="button" class="version-option"
            :class="{ selected: settings[option.key].value }" :aria-pressed="settings[option.key].value"
            @click="settings[option.key].value = !settings[option.key].value">
            {{ option.label }}
          </button>
        </div>
      </div>

      <div class="options">
        <h3>События</h3>
        <label class="annotation-option">
          <input v-model="settings.showImportantEvents.value" type="checkbox">
          Важные события
        </label>
        <label class="annotation-option">
          <input v-model="settings.showWotstatOutages.value" type="checkbox">
          Недоступность wotstat
        </label>
      </div>
    </div>
  </PopoverAutoClose>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import PopoverAutoClose from '@/shared/uiKit/popover/PopoverAutoClose.vue'
import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import type { useHistoryAnnotationSettings } from './useHistoryAnnotationSettings'

defineProps<{
  settings: ReturnType<typeof useHistoryAnnotationSettings>
}>()

const open = ref(false)
const trigger = useTemplateRef<HTMLButtonElement>('trigger')

const versionOptions = [
  { key: 'showVersions', label: 'Версии' },
  { key: 'showPatches', label: 'Патчи' },
  { key: 'showMicropatches', label: 'Микропатчи' },
] as const
</script>

<style scoped lang="scss">
.history-menu-trigger {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  margin-left: -2px;
  border-radius: 5px;
  padding: 0;
  color: rgba(197, 197, 197, 0.6);

  &:hover {
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.08);
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
}

.annotation-settings {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: min(250px, calc(100vw - 20px));
  line-height: 1.3;

  .popover-heading {
    padding: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    h2 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
    }
  }

  .options {
    padding: 10px;

    h3 {
      margin: 0 0 6px;
      color: #fff;
      font-size: 12px;
      font-weight: 500;
    }

    .annotation-option {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      cursor: pointer;

      & + .annotation-option {
        margin-top: 4px;
      }

      input {
        margin: 0;
        accent-color: var(--blue-thin-color);
      }
    }
  }

  .version-options {
    display: flex;
    gap: 4px;
  }

  .version-option {
    position: relative;
    flex: 1;
    padding: 5px 8px;
    border-radius: 5px;
    background: rgba(255, 255, 255, 0.05);
    color: inherit;
    font-size: 12px;
    line-height: 1.2;

    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background: rgba(255, 255, 255, 0.12);
      }
    }

    &.selected {
      background: rgba(255, 255, 255, 0.1);

      &::before {
        content: '';
        position: absolute;
        top: 5px;
        bottom: 5px;
        left: 0;
        width: 3px;
        border-radius: 3px;
        background: var(--blue-thin-color);
      }
    }
  }
}
</style>
