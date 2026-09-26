<template>
  <button ref="trigger" class="history-menu-trigger" :class="{ active: hasAnnotations }" type="button" title="Настройки аннотаций"
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
          <button v-for="option in versionOptions" :key="option.key" type="button" class="annotation-option"
            :style="{ '--annotation-color': option.color }"
            :class="{ selected: settings[option.key].value }" :aria-pressed="settings[option.key].value"
            @click="settings[option.key].value = !settings[option.key].value">
            {{ option.label }}
          </button>
        </div>
      </div>

      <div class="options">
        <h3>События</h3>
        <div class="event-options">
          <button type="button" class="annotation-option" :style="{ '--annotation-color': outageAnnotationColor }"
            :class="{ selected: settings.showWotstatOutages.value }" :aria-pressed="settings.showWotstatOutages.value"
            @click="settings.showWotstatOutages.value = !settings.showWotstatOutages.value">
            Недоступность wotstat
          </button>
          <button v-for="event in visibleEvents" :key="event.id" type="button" class="annotation-option"
            :style="{ '--annotation-color': event.color }"
            :class="{ selected: settings.enabledEvents.value.includes(event.id) }"
            :aria-pressed="settings.enabledEvents.value.includes(event.id)" @click="settings.toggleEvent(event.id)">
            {{ event.label }}
          </button>
        </div>
      </div>
    </div>
  </PopoverAutoClose>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import PopoverAutoClose from '@/shared/uiKit/popover/PopoverAutoClose.vue'
import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import type { useHistoryAnnotationSettings } from './useHistoryAnnotationSettings'
import { getHistoryEventRegions, historyEvents } from '@/shared/game/historyEvents'
import type { GameRegion } from '@/shared/game/wot'
import { outageAnnotationColor, versionAnnotationColors } from './historyAnnotations'

const props = defineProps<{
  settings: ReturnType<typeof useHistoryAnnotationSettings>
  regions: readonly GameRegion[]
}>()

const visibleEvents = computed(() => historyEvents.filter(event => getHistoryEventRegions(event, props.regions)?.length !== 0))
const hasAnnotations = computed(() => Object.values(props.settings.versions.value).some(Boolean) ||
  props.settings.showWotstatOutages.value ||
  visibleEvents.value.some(event => props.settings.enabledEvents.value.includes(event.id)))
const open = ref(false)
const trigger = useTemplateRef<HTMLButtonElement>('trigger')

const versionOptions = [
  { key: 'showVersions', label: 'Версии', color: versionAnnotationColors.version },
  { key: 'showPatches', label: 'Патчи', color: versionAnnotationColors.patch },
  { key: 'showMicropatches', label: 'Микропатчи', color: versionAnnotationColors.micropatch },
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

  &.active {
    color: var(--blue-thin-color);
    background: rgba(10, 132, 255, 0.12);
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
  }

  .version-options,
  .event-options {
    display: flex;
    gap: 4px;
  }

  .event-options {
    flex-direction: column;

    .annotation-option {
      text-align: left;
    }
  }

  .annotation-option {
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
        background: var(--annotation-color);
      }
    }
  }
}
</style>
