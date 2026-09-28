<template>
  <ToolbarButton ref="trigger" class="history-menu-trigger" variant="accent" :active="hasAnnotations"
    @click="open = !open">
    <span class="dots"></span>
  </ToolbarButton>

  <PanelPopover v-model="open" :target="target" title="Настройки аннотаций" density="compact" :width="250"
    :placement="['bottom-end', 'bottom-float', 'top-end']">
    <template #content>
      <div class="options panel-section">
        <h3>Версии игры</h3>
        <div class="version-options">
          <SelectionTile v-for="option in versionOptions" :key="option.key" class="annotation-option"
            density="compact" :accent-color="menuAccentColor(option.color)"
            :selected="settings[option.key].value"
            @select="settings[option.key].value = !settings[option.key].value">
            {{ option.label }}
          </SelectionTile>
        </div>
      </div>

      <div class="options panel-section">
        <h3>События</h3>
        <div class="event-options">
          <SelectionTile class="annotation-option" density="compact" :accent-color="menuAccentColor(outageAnnotationColor)"
            :selected="settings.showWotstatOutages.value"
            @select="settings.showWotstatOutages.value = !settings.showWotstatOutages.value">
            Недоступность wotstat
          </SelectionTile>
          <SelectionTile v-for="event in visibleEvents" :key="event.id" class="annotation-option" density="compact"
            :accent-color="menuAccentColor(event.color)" :selected="settings.enabledEvents.value.includes(event.id)"
            @select="settings.toggleEvent(event.id)">
            {{ event.label }}
          </SelectionTile>
        </div>
      </div>
    </template>
  </PanelPopover>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import PanelPopover from '@/shared/ui/popover/PanelPopover.vue'
import SelectionTile from '@/shared/ui/selectionTile/SelectionTile.vue'
import ToolbarButton from '@/shared/ui/toolbarButton/ToolbarButton.vue'
import { ColorHSVA } from '@/shared/uiKit/colorPicker/ColorHSVA'
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
const trigger = useTemplateRef<InstanceType<typeof ToolbarButton>>('trigger')
const target = computed(() => trigger.value?.element ?? null)

function menuAccentColor(color: string) {
  const accent = new ColorHSVA(0, 0, 0)
  accent.setHex(color)
  accent.s = Math.min(0.75, accent.s * 1.4)
  accent.v = Math.min(1, accent.v * 1.04)
  accent.a = 1
  return `#${accent.toHex()}`
}

const versionOptions = [
  { key: 'showVersions', label: 'Версии', color: versionAnnotationColors.version },
  { key: 'showPatches', label: 'Патчи', color: versionAnnotationColors.patch },
  { key: 'showMicropatches', label: 'Микропатчи', color: versionAnnotationColors.micropatch },
] as const
</script>

<style scoped lang="scss">
.history-menu-trigger {
  margin-left: -2px;

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

.version-options,
.event-options {
  display: flex;
  gap: 4px;
}

.event-options {
  flex-direction: column;
}

.annotation-option {
  flex: 1;
}

.version-options .annotation-option {
  flex-basis: auto;
}
</style>
