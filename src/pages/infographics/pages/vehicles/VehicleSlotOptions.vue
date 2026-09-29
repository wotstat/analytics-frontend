<template>
  <PanelPopover v-model="open" :target :placement :title :width="900" :scrollbar-offsets="[40, 14]"
    @content-scroll="closeAggregation()" class="vehicle-slot-options">
    <template v-if="maxSlots !== undefined" #toolbar>
      <div class="selection-controls">
        <span class="selected-count">Выбрано {{ selected.length }} из {{ maxSlots }}</span>
        <ToolbarButton v-if="multiple" :icon="ResetIcon" size="small" :disabled="!canReset" @click="resetSelection" />
      </div>
    </template>

    <template #content>
      <div class="column-list">
        <section v-for="category in slotCategories" :key="category.title" class="category panel-section"
          :class="{ derived: category.derived }">
          <h3>{{ category.title }}</h3>
          <div class="tiles">
            <SelectionTile v-for="slot in category.slots" :key="slot" class="tile-option"
              :class="{ derived: !!availableSlots[slot].formula }" :selected="isSelected(slot)"
              :disabled="!isSelected(slot) && isDisabled(defaultSlot(slot))"
              :accent-color="availableSlots[slot].formula ? '#bbaad6' : undefined"
              :action="slotAggregationOptions(slot).length > 0" :action-active="extraAggregationCount(slot) > 0"
              :action-open="aggregationSlot === slot" @select="selectMetric(slot)"
              @action="openAggregation(slot, $event)">
              <Icon :icon="availableSlots[slot].icon" class="tile-icon" />
              <span class="tile-text">
                <span class="tile-label">{{ metricLabel(slot) }}</span>
                <span v-if="availableSlots[slot].formula" class="tile-formula">{{ availableSlots[slot].formula }}</span>
              </span>
              <span v-if="aggregationLabel(slot)" class="aggregation-value">
                {{ aggregationLabel(slot) }}
              </span>
              <template #action>
                <span class="dots"></span>
                <span v-if="multiple && extraAggregationCount(slot)" class="aggregation-badge">
                  {{ extraAggregationCount(slot) }}
                </span>
              </template>
            </SelectionTile>
          </div>
        </section>
      </div>

      <Popover :display="aggregationSlot !== null" :target="aggregationTrigger"
        :placement="['bottom-end', 'top-end', 'right-start-float', 'left-start-float']" :offset="4"
        :viewport-offset="popoverViewportOffset" @pointer-down-outside="closeAggregation()"
        @pointer-click-outside="closeAggregation()" @target-outside-window="closeAggregation()"
        @ready-to-visible="focusAggregationOption()">
        <div v-if="aggregationSlot !== null" ref="aggregationMenu" class="aggregation-menu" @pointerdown.stop
          @pointerup.stop @click.stop @keydown.esc.stop.prevent="closeAggregation(true)"
          @keydown.down.prevent="moveAggregationFocus(1)" @keydown.up.prevent="moveAggregationFocus(-1)"
          @keydown.home.prevent="focusAggregationOption(0)" @keydown.right.prevent="moveAggregationFocus(1)"
          @keydown.left.prevent="moveAggregationFocus(-1)" @keydown.end.prevent="focusAggregationOption(-1)">
          <div class="aggregation-heading">{{ metricLabel(aggregationSlot) }}</div>
          <div ref="aggregationList" class="aggregation-options nice-scrollbar">
            <section v-for="group in aggregationGroups" :key="group.key" class="aggregation-group"
              :class="{ quantiles: group.key === 'quantiles' }" :style="{ '--aggregation-columns': group.columns }">
              <h3>{{ group.title }}</h3>
              <div class="aggregation-grid">
                <SelectionTile v-for="option in group.options" :key="option.slot" class="aggregation-option"
                  density="compact" :selected="selected.includes(option.slot)" :disabled="isDisabled(option.slot)"
                  @select="selectAggregation(option.slot)">
                  {{ aggregationOptionLabel(option.slot, option.label) }}
                </SelectionTile>
              </div>
            </section>
          </div>
        </div>
      </Popover>
    </template>
  </PanelPopover>
</template>

<script setup lang="ts">
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import ResetIcon from '@/assets/icons/reset.svg'
import { computed, ref, shallowRef, useTemplateRef, watch } from 'vue'
import Popover from '@/shared/uiKit/popover/Popover.vue'
import PanelPopover from '@/shared/ui/popover/PanelPopover.vue'
import SelectionTile from '@/shared/ui/selectionTile/SelectionTile.vue'
import ToolbarButton from '@/shared/ui/toolbarButton/ToolbarButton.vue'
import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import type { PlacementParam, PopoverTarget } from '@/shared/uiKit/popover/utils'
import { availableSlots, baseSlot, defaultSlot, metricLabel, slotAggregationLabel, slotAggregationOptions, slotCategories, type BaseSlot, type Slot } from './shared/vehicleMetrics'

const props = defineProps<{
  title: string
  target: PopoverTarget | null
  placement: PlacementParam
  selected: readonly Slot[]
  maxSlots?: number
  multiple?: boolean
  canReset?: boolean
}>()

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  select: [slot: Slot]
  toggleMetric: [slot: BaseSlot]
  reset: []
}>()

const aggregationSlot = ref<BaseSlot | null>(null)
const aggregationTrigger = shallowRef<HTMLButtonElement | null>(null)
const aggregationMenu = useTemplateRef<HTMLElement>('aggregationMenu')
const aggregationList = useTemplateRef<HTMLElement>('aggregationList')
const aggregationOptions = computed(() => aggregationSlot.value === null ? [] : slotAggregationOptions(aggregationSlot.value))

watch(open, isOpen => {
  if (!isOpen) closeAggregation()
})

const aggregationGroupDefinitions = [
  { key: 'basic', title: 'Основные', columns: 2 },
  { key: 'quantiles', title: 'Квантили', columns: 4 },
  { key: 'spread', title: 'Разброс', columns: 2 },
  { key: 'zero', title: 'Нулевые значения', columns: 1 },
] as const

const aggregationGroups = computed(() => aggregationGroupDefinitions.map(group => ({
  ...group,
  options: aggregationOptions.value.filter(option => aggregationGroup(option.slot) === group.key),
})).filter(group => group.options.length > 0))

function aggregationGroup(slot: Slot): typeof aggregationGroupDefinitions[number]['key'] {
  const modifier = slot.split('_')[1]
  if (modifier?.startsWith('q')) return 'quantiles'
  if (modifier === 'variance' || modifier === 'deviation') return 'spread'
  if (modifier === 'zero') return 'zero'
  return 'basic'
}

function aggregationOptionLabel(slot: Slot, label: string) {
  const modifier = slot.split('_')[1]
  if (modifier?.startsWith('q')) return `${modifier.slice(1)}%`
  if (modifier === 'deviation') return 'Отклонение (σ)'
  return label
}

function selectedAggregations(slot: BaseSlot) {
  return props.selected.filter(selected => baseSlot(selected) === slot)
}

function isSelected(slot: BaseSlot) {
  return selectedAggregations(slot).length > 0
}

function aggregationLabel(slot: BaseSlot) {
  const selected = selectedAggregations(slot)
  return selected.length === 1 ? slotAggregationLabel(selected[0]) : ''
}

function extraAggregationCount(slot: BaseSlot) {
  return selectedAggregations(slot).filter(selected => selected !== defaultSlot(slot)).length
}

function openAggregation(slot: BaseSlot, event: MouseEvent) {
  if (aggregationSlot.value === slot) {
    closeAggregation()
    return
  }

  aggregationTrigger.value = event.currentTarget as HTMLButtonElement
  aggregationSlot.value = slot
}

function closeAggregation(restoreFocus = false) {
  aggregationSlot.value = null
  if (restoreFocus) aggregationTrigger.value?.focus({ preventScroll: true })
}

function focusAggregationOption(index?: number) {
  const menu = aggregationMenu.value
  const list = aggregationList.value
  const buttons = menu?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
  if (!menu || !list || !buttons?.length) return
  const selectedIndex = aggregationGroups.value.flatMap(group => group.options)
    .findIndex(option => props.selected.includes(option.slot))
  const button = buttons[index === -1 ? buttons.length - 1 : index ?? Math.max(0, selectedIndex)]
  if (!button) return
  button.focus({ preventScroll: true })
  const listRect = list.getBoundingClientRect()
  const buttonRect = button.getBoundingClientRect()
  if (buttonRect.top < listRect.top) list.scrollTop += buttonRect.top - listRect.top - 5
  else if (buttonRect.bottom > listRect.bottom) list.scrollTop += buttonRect.bottom - listRect.bottom + 5
}

function moveAggregationFocus(direction: number) {
  const buttons = [...aggregationMenu.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []]
  if (!buttons.length) return
  const index = buttons.findIndex(button => button === document.activeElement)
  focusAggregationOption((index + direction + buttons.length) % buttons.length)
}

function selectAggregation(slot: Slot) {
  if (!props.multiple) closeAggregation(true)
  emit('select', slot)
}

function selectMetric(slot: BaseSlot) {
  closeAggregation()
  if (props.multiple) emit('toggleMetric', slot)
  else emit('select', defaultSlot(slot))
}

function resetSelection() {
  closeAggregation()
  emit('reset')
}

function isDisabled(slot: Slot) {
  if (props.maxSlots === undefined) return false
  if (props.selected.includes(slot)) return false
  return props.selected.length >= props.maxSlots
}
</script>

<style scoped lang="scss">
.selection-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 20px;

  .selected-count {
    color: rgba(255, 255, 255, 0.55);
    font-size: 12px;
    line-height: 1.2;
    white-space: nowrap;
  }
}

.column-list {
  .category {
    &.derived {
      --panel-heading-color: #ece0ff;
    }

    .tiles {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(250px, 100%), 1fr));
      gap: 6px;

      .tile-option {
        --selection-tile-main-padding: 2px 6px;
        --selection-tile-gap: 8px;

        &.derived {
          --selection-tile-main-padding: 7px 6px;

          .tile-icon {
            color: #bbaad6;
          }
        }
      }

      .tile-text {
        display: flex;
        flex-direction: column;
        gap: 3px;
        min-width: 0;
      }

      .tile-label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .tile-formula {
        color: rgba(255, 255, 255, 0.45);
        font-size: 11px;
        line-height: 1.3;
      }

      .aggregation-value {
        flex: none;
        margin-left: auto;
        color: rgba(255, 255, 255, 0.55);
        font-size: 11px;
        white-space: nowrap;
      }

      .tile-icon {
        flex: none;
        width: 34px;
        height: 34px;
        margin: -2px;
      }
    }
  }
}

.aggregation-badge {
  position: absolute;
  top: calc(50% - 14px);
  right: 1px;
  display: grid;
  place-items: center;
  min-width: 12px;
  height: 12px;
  padding: 0 2px;
  box-sizing: border-box;
  border-radius: 6px;
  background: var(--blue-thin-color);
  color: #fff;
  font-size: 9px;
  line-height: 1;
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

.aggregation-menu {
  pointer-events: auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: min(250px, calc(100vw - 20px));
  max-height: min(450px, 60dvh);
  overflow: hidden;
  border: 1px solid #444;
  border-radius: 10px;
  background: #2a2a2a;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  color: #f6f6f6;
  line-height: 1.3;

  .aggregation-heading {
    flex: none;
    padding: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 14px;
    font-weight: 600;
  }

  .aggregation-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 10px;
    min-height: 0;
    overflow-y: auto;
  }

  .aggregation-group {
    h3 {
      margin: 0 0 6px;
      color: rgba(255, 255, 255, 0.55);
      font-size: 11px;
      font-weight: 500;
    }

    .aggregation-grid {
      display: grid;
      grid-template-columns: repeat(var(--aggregation-columns), minmax(0, 1fr));
      gap: 4px;
    }

    &.quantiles .aggregation-option {
      --selection-tile-main-padding: 5px 4px;
      --selection-tile-justify-content: center;

      font-variant-numeric: tabular-nums;
    }
  }

  .aggregation-option {
    flex: none;
    width: 100%;
  }
}
</style>
