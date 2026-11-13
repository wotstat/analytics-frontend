<template>
  <ToolbarButton ref="trigger" class="chart-annotation-trigger" variant="accent" :active="hasAnnotations"
    @click="open = !open">
    <span class="dots"></span>
  </ToolbarButton>

  <ResponsivePanelPopover v-model="open" :target="target" :title density="compact" :width
    :placement="['bottom-end', 'bottom-float', 'top-end']">
    <template #content="{ isModal }">
      <div class="annotation-settings" :class="{ 'modal-mode': isModal }">
        <div v-for="group in visibleGroups" :key="group.id" class="panel-section">
          <h3 v-if="group.label">{{ group.label }}</h3>
          <div class="annotation-options" :class="{ row: group.layout === 'row' }">
            <SelectionTile v-for="option in group.options" :key="option.id" class="annotation-option"
              :class="classNames(option.classes)" :density="isModal ? 'standard' : 'compact'"
              :selected="option.selected" :disabled="option.disabled"
              @select="emit('toggle', group.id, option.id)">
              {{ option.label }}
            </SelectionTile>
          </div>
        </div>
      </div>
    </template>
  </ResponsivePanelPopover>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import ResponsivePanelPopover from '@/shared/ui/popover/ResponsivePanelPopover.vue'
import SelectionTile from '@/shared/ui/selectionTile/SelectionTile.vue'
import ToolbarButton from '@/shared/ui/toolbarButton/ToolbarButton.vue'
import { classNames } from '@/shared/uiKit/chart/universalChart/utils/utils'
import type { ChartAnnotationGroup } from './chartAnnotationSettings'

const props = withDefaults(defineProps<{
  groups: readonly ChartAnnotationGroup[]
  title?: string
  width?: number
}>(), { title: 'Настройки аннотаций', width: 250 })

const emit = defineEmits<{ toggle: [groupId: string, optionId: string] }>()

const visibleGroups = computed(() => props.groups.filter(group => group.options.length))
const hasAnnotations = computed(() => visibleGroups.value.some(group => group.options.some(option => option.selected)))
const open = ref(false)
const trigger = useTemplateRef<InstanceType<typeof ToolbarButton>>('trigger')
const target = computed(() => trigger.value?.element ?? null)
</script>

<style scoped lang="scss">
.chart-annotation-trigger {
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

.annotation-options {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &.row {
    flex-direction: row;
  }
}

.annotation-option {
  flex: 1;
}

.row .annotation-option {
  flex-basis: auto;
}

.annotation-settings.modal-mode {
  .panel-section>h3 {
    font-size: 16px;
  }

  .annotation-options {
    gap: 6px;

    &.row {
      flex-wrap: wrap;
    }
  }

  .annotation-option {
    --selection-tile-font-size: 16px;
    --selection-tile-min-height: 40px;
  }
}
</style>
