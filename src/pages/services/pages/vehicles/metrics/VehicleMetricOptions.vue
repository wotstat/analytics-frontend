<template>
  <ColumnSelector
    ref="columnSelector"
    v-model:open="open"
    :target
    :placement
    :title
    :selected-count="selected.length"
    :max-slots
    limit-tip-key="vehicle-column-limit"
    @clear="emit('clear')"
    @reset="emit('reset')"
    @dismiss-options="closeOptions">
    <template #default="{ isModal }">
      <div class="column-list" :class="{ 'modal-mode': isModal }">
        <section v-for="category in metricCategories"
          :key="category.title"
          class="category panel-section"
          :style="{ '--panel-heading-color': category.color }">

          <h3 class="category-heading">
            <span>{{ category.title }}</span>
            <span v-if="category.note || category.helpText" class="category-details">
              <span v-if="category.note">{{ category.note }}</span>
              <span v-if="category.helpText"
                class="category-help"
                v-tooltip="{ text: category.helpText, disabled: !open, placement: ['top-float', 'bottom-float', 'left-float'] }">?</span>
            </span>
          </h3>

          <div class="tiles">
            <SelectionTile v-for="tile in category.tiles"
              :key="tile.id"
              class="tile-option"
              v-tooltip="{ text: tile.label, disabled: !open || !overflowingTiles[tile.id], placement: ['top-float', 'bottom-float'] }"
              :class="{ 'with-subtitle': !!tile.subtitle }"
              :selected="selectedTileValues(tile, selected).length > 0"
              :disabled="isTileDisabled(tile)"
              report-disabled-click
              :accent-color="tile.color"
              :action="!!tile.sections?.length"
              :action-active="selectedTileValues(tile, selected).some(value => value !== tile.defaultValue)"
              :action-open="optionsOpen && optionsTile?.id === tile.id"
              @pointerenter="hoverTile(tile, $event)"
              @pointerleave="columnSelector?.setLimitHovered(false)"
              @select="selectTile(tile)"
              @action="openOptions(tile, $event)"
              @disabled-click="columnSelector?.showLimitFeedback()">
              <Icon :icon="tile.icon" class="tile-icon" :style="{ color: tile.color }" />
              <span class="tile-text">
                <MetricLabel :text="tile.label" @overflow="overflowingTiles[tile.id] = $event" />
                <span v-if="tile.subtitle" class="tile-subtitle">{{ tile.subtitle }}</span>
              </span>
              <span v-if="selectionLabel(tile)" class="selection-value">{{ selectionLabel(tile) }}</span>

              <template #action>
                <EllipsisIcon width="18" height="18" />
                <span v-if="multiple && selectedTileValues(tile, selected).length > 1"
                  class="selection-badge"
                  :style="{ color: tile.badgeTextColor }">
                  {{ selectedTileValues(tile, selected).length }}
                </span>
              </template>
            </SelectionTile>
          </div>
        </section>
      </div>

      <MetricOptionsPopover v-if="optionsTile"
        v-model="optionsOpen"
        :label="optionsTile.label"
        :sections="optionsTile.sections"
        :color="optionsTile.color"
        :target="optionsTrigger"
        :selected
        :can-select="(slot: Slot) => canSelectMetric(slot, selected, maxSlots)"
        @select="selectSlot"
        @limit-hover="columnSelector?.setLimitHovered($event)"
        @disabled-click="columnSelector?.showLimitFeedback()" />
    </template>
  </ColumnSelector>
</template>

<script setup lang="ts">
import EllipsisIcon from '@/assets/icons/ellipsis.svg'
import Icon from '@/shared/game/components/efficiencyIcon/Icon.vue'
import { ref, shallowRef, useTemplateRef } from 'vue'
import SelectionTile from '@/shared/ui/selectionTile/SelectionTile.vue'
import type { PlacementParam, PopoverTarget } from '@/shared/uiKit/popover/utils'
import ColumnSelector from '../../shared/columnSelector/ColumnSelector.vue'
import MetricLabel from '../../shared/columnSelector/MetricLabel.vue'
import MetricOptionsPopover from '../../shared/columnSelector/MetricOptionsPopover.vue'
import { availableSlots, metricCategories, type Slot } from './catalog/vehicleMetrics'
import { canSelectMetric, selectedTileValues, type MetricTile } from './utils/metricSelection'

const props = defineProps<{
  title?: string
  target?: PopoverTarget | null
  placement?: PlacementParam
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
const overflowingTiles = ref<Record<string, boolean>>({})
const columnSelector = useTemplateRef('columnSelector')

function closeOptions() {
  optionsOpen.value = false
}

function isTileDisabled(tile: MetricTile) {
  if (selectedTileValues(tile, props.selected).length) return false
  return !canSelectMetric(tile.defaultValue, props.selected, props.maxSlots)
}

function hoverTile(tile: MetricTile, event: PointerEvent) {
  const hovered = event.pointerType === 'mouse' && isTileDisabled(tile)
  columnSelector.value?.setLimitHovered(hovered)
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
  if (props.multiple && selectedTileValues(tile, props.selected).length) columnSelector.value?.acceptLimitTip()
  if (props.multiple) emit('toggleTile', tile)
  else emit('select', tile.defaultValue)
}

function selectSlot(slot: Slot) {
  if (props.multiple && props.selected.includes(slot)) columnSelector.value?.acceptLimitTip()
  emit('select', slot)
}
</script>

<style scoped lang="scss">
.column-list {
  .category {
    .category-heading {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px 12px;
    }

    .category-details {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-left: auto;
      color: rgba(255, 255, 255, 0.55);
      font-size: 12px;
      font-weight: 400;

    }

    .category-help {
      display: inline-flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      font-size: 11px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-weight: bold;
      border-radius: 50%;
      cursor: help;
    }

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

      .tile-option {

        .tile-text {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
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

  &.modal-mode {
    .category {

      --selection-tile-action-width: 35px;

      .category-heading {
        font-size: 16px;
      }

      .tiles {

        .tile-option {
          --selection-tile-main-padding: 4px 10px;

          .tile-text {
            font-size: 16px;
            line-height: 1.2;
          }

          .tile-icon {
            width: 40px;
            height: 40px;
            margin: -3px;
          }

          .tile-subtitle {
            font-size: 13px;
          }

          .selection-value {
            font-size: 13px;
          }

        }
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
  background: var(--selection-tile-accent, var(--blue-thin-color));
  color: #fff;
  font-size: 9px;
  line-height: 1;
}
</style>
