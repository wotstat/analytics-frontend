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
              :class="{ derived: !!availableSlots[slot].formula }"
              :selected="isSelected(slot)"
              :disabled="!isSelected(slot) && isDisabled(defaultSlot(slot))"
              :accent-color="availableSlots[slot].formula ? '#bbaad6' : undefined"
              :action="isAggregatableSlot(slot)"
              :action-active="extraAggregationCount(slot) > 0"
              :action-open="aggregationOpen && aggregationSlot === slot"
              @select="selectMetric(slot)"
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

      <VehicleAggregationPopover v-if="aggregationSlot !== null" v-model="aggregationOpen"
        :metric="aggregationSlot" :target="aggregationTrigger" :selected :max-slots
        @select="emit('select', $event)" />
    </template>
  </PanelPopover>
</template>

<script setup lang="ts">
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import ResetIcon from '@/assets/icons/reset.svg'
import { ref, shallowRef, watch } from 'vue'
import PanelPopover from '@/shared/ui/popover/PanelPopover.vue'
import SelectionTile from '@/shared/ui/selectionTile/SelectionTile.vue'
import ToolbarButton from '@/shared/ui/toolbarButton/ToolbarButton.vue'
import type { PlacementParam, PopoverTarget } from '@/shared/uiKit/popover/utils'
import { availableSlots, baseSlot, defaultSlot, isAggregatableSlot, metricLabel, slotAggregationLabel, slotCategories, type AggregatableSlot, type BaseSlot, type Slot } from './vehicleMetrics'
import VehicleAggregationPopover from './VehicleAggregationPopover.vue'

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

const aggregationOpen = ref(false)
const aggregationSlot = ref<AggregatableSlot | null>(null)
const aggregationTrigger = shallowRef<HTMLButtonElement | null>(null)

watch(open, isOpen => {
  if (!isOpen) closeAggregation()
})

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
  if (!isAggregatableSlot(slot)) return
  if (aggregationOpen.value && aggregationSlot.value === slot) {
    closeAggregation()
    return
  }

  aggregationTrigger.value = event.currentTarget as HTMLButtonElement
  aggregationSlot.value = slot
  aggregationOpen.value = true
}

function closeAggregation() {
  aggregationOpen.value = false
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
</style>
