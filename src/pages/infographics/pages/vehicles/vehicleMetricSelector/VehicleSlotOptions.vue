<template>
  <PanelPopover v-model="open" :target :placement :title :width="900" :scrollbar-offsets="[40, 14]"
    @content-scroll="closeOptions()" class="vehicle-slot-options">
    <template v-if="maxSlots !== undefined" #toolbar>
      <div class="selection-controls">
        <span class="selected-count">Выбрано {{ selected.length }} из {{ maxSlots }}</span>
        <ToolbarButton v-if="multiple" :icon="selected.length ? ClearIcon : ResetIcon" size="small" class="icon-button"
          v-tooltip.instant="{ text: selected.length ? 'Очистить' : 'По умолчанию', placement: ['top-float', 'bottom-float'], viewportOffset: 5 }"
          @click="clearOrResetSelection" />
      </div>
    </template>

    <template #content>
      <div class="column-list">
        <section v-for="category in metricCategories" :key="category.title" class="category panel-section"
          :style="{ '--panel-heading-color': category.color }">
          <h3>{{ category.title }}</h3>
          <div class="tiles">
            <SelectionTile v-for="tile in category.tiles" :key="tile.id" class="tile-option"
              :class="{ 'with-subtitle': !!tile.subtitle }"
              :selected="selectedTileValues(tile, selected).length > 0"
              :disabled="!selectedTileValues(tile, selected).length && !canSelectMetric(tile.defaultValue, selected, maxSlots)"
              :accent-color="tile.color" :action="!!tile.sections?.length"
              :action-active="selectedTileValues(tile, selected).some(value => value !== tile.defaultValue)"
              :action-open="optionsOpen && optionsTile?.id === tile.id"
              @select="selectTile(tile)" @action="openOptions(tile, $event)">
              <Icon :icon="tile.icon" class="tile-icon" :style="{ color: tile.color }" />
              <span class="tile-text">
                <span class="tile-label">{{ tile.label }}</span>
                <span v-if="tile.subtitle" class="tile-subtitle">{{ tile.subtitle }}</span>
              </span>
              <span v-if="selectionLabel(tile)" class="selection-value">{{ selectionLabel(tile) }}</span>
              <template #action>
                <span class="dots"></span>
                <span v-if="multiple && selectedTileValues(tile, selected).length > 1" class="selection-badge">
                  {{ selectedTileValues(tile, selected).length }}
                </span>
              </template>
            </SelectionTile>
          </div>
        </section>
      </div>

      <VehicleMetricOptionsPopover v-if="optionsTile" v-model="optionsOpen" :tile="optionsTile"
        :target="optionsTrigger" :selected :max-slots @select="emit('select', $event)" />
    </template>
  </PanelPopover>
</template>

<script setup lang="ts">
import Icon from '@/shared/game/components/efficiencyIcon/Icon.vue'
import ClearIcon from '@/assets/icons/x-bold.svg'
import ResetIcon from '@/assets/icons/reset.svg'
import { ref, shallowRef, watch } from 'vue'
import PanelPopover from '@/shared/ui/popover/PanelPopover.vue'
import SelectionTile from '@/shared/ui/selectionTile/SelectionTile.vue'
import ToolbarButton from '@/shared/ui/toolbarButton/ToolbarButton.vue'
import type { PlacementParam, PopoverTarget } from '@/shared/uiKit/popover/utils'
import { availableSlots, metricCategories, type Slot } from './vehicleMetrics/vehicleMetrics'
import { canSelectMetric, selectedTileValues, type MetricTile } from './utils/metricSelection'
import VehicleMetricOptionsPopover from './metricOptions/VehicleMetricOptionsPopover.vue'

const props = defineProps<{
  title: string
  target: PopoverTarget | null
  placement: PlacementParam
  selected: readonly Slot[]
  maxSlots?: number
  multiple?: boolean
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  select: [slot: Slot]
  toggleTile: [tile: MetricTile]
  clear: []
  reset: []
}>()

const optionsOpen = ref(false)
const optionsTile = shallowRef<MetricTile | null>(null)
const optionsTrigger = shallowRef<HTMLButtonElement | null>(null)

watch(open, isOpen => {
  if (!isOpen) closeOptions()
})

function closeOptions() {
  optionsOpen.value = false
}

function selectionLabel(tile: MetricTile) {
  const values = selectedTileValues(tile, props.selected)
  if (values.length > 1) return ''
  return values.length ? availableSlots[values[0]].variantLabel : tile.idleLabel
}

function openOptions(tile: MetricTile, event: MouseEvent) {
  if (optionsOpen.value && optionsTile.value?.id === tile.id) {
    closeOptions()
    return
  }

  optionsTile.value = tile
  optionsTrigger.value = event.currentTarget as HTMLButtonElement
  optionsOpen.value = true
}

function selectTile(tile: MetricTile) {
  closeOptions()
  if (props.multiple) emit('toggleTile', tile)
  else emit('select', tile.defaultValue)
}

function clearOrResetSelection() {
  closeOptions()
  if (props.selected.length) emit('clear')
  else emit('reset')
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
    .tiles {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(250px, 100%), 1fr));
      gap: 6px;

      .tile-option {
        --selection-tile-main-padding: 2px 6px;
        --selection-tile-gap: 8px;

        &.with-subtitle {
          --selection-tile-main-padding: 7px 6px;
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

      .tile-subtitle {
        color: rgba(255, 255, 255, 0.45);
        font-size: 11px;
        line-height: 1.3;
      }

      .selection-value {
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

.selection-badge {
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
</style>
