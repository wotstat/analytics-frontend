<template>
  <div class="column-popover">
    <header class="popover-heading">
      <h2>{{ title }}</h2>
      <div v-if="maxSlots !== undefined" class="selection-controls">
        <span class="selected-count">Выбрано {{ selected.length }} из {{ maxSlots }}</span>
        <button v-if="multiple" class="reset-button" type="button" :disabled="!canReset"
          aria-label="Сбросить выбранные столбцы" title="Сбросить выбранные столбцы" @click="resetSelection">
          <ResetIcon aria-hidden="true" />
        </button>
      </div>
    </header>

    <div class="column-list nice-scrollbar" @scroll="closeAggregation()">
      <section v-for="category in slotCategories" :key="category.title" class="category" :class="{ derived: category.derived }">
        <h3>{{ category.title }}</h3>
        <div class="tiles">
          <div v-for="slot in category.slots" :key="slot" class="tile-option"
            :class="{ selected: isSelected(slot), disabled: !isSelected(slot) && isDisabled(defaultSlot(slot)), derived: !!availableSlots[slot].formula }">
            <button class="tile" type="button"
              :disabled="!isSelected(slot) && isDisabled(defaultSlot(slot))" :aria-pressed="isSelected(slot)"
              :aria-label="metricLabel(slot)" :title="slotDescription(slot)"
              @click="selectMetric(slot)">
              <Icon :icon="availableSlots[slot].icon" class="tile-icon" />
              <span class="tile-text">
                <span class="tile-label">{{ metricLabel(slot) }}</span>
                <span v-if="availableSlots[slot].formula" class="tile-formula">{{ availableSlots[slot].formula }}</span>
              </span>
              <span v-if="aggregationLabel(slot)" class="aggregation-value">
                {{ aggregationLabel(slot) }}
              </span>
            </button>
            <button v-if="slotAggregationOptions(slot).length" class="aggregation-trigger" type="button"
              :class="{ active: extraAggregationCount(slot) > 0 }"
              :disabled="!isSelected(slot) && isDisabled(defaultSlot(slot))" :aria-label="`Агрегация: ${metricLabel(slot)}`"
              :title="aggregationTitle(slot)" aria-haspopup="menu" :aria-controls="menuId"
              :aria-expanded="aggregationSlot === slot" @click="openAggregation(slot, $event)">
              <span class="dots" aria-hidden="true"></span>
              <span v-if="multiple && extraAggregationCount(slot)" class="aggregation-badge" aria-hidden="true">
                {{ extraAggregationCount(slot) }}
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>

    <Popover :display="aggregationSlot !== null" :target="aggregationTrigger"
      :placement="['bottom-end', 'top-end', 'right-start-float', 'left-start-float']" :offset="4"
      :viewport-offset="popoverViewportOffset" @pointer-down-outside="closeAggregation()"
      @pointer-click-outside="closeAggregation()" @target-outside-window="closeAggregation()"
      @ready-to-visible="focusAggregationOption()">
      <div v-if="aggregationSlot !== null" :id="menuId" ref="aggregationMenu" class="aggregation-menu"
        role="menu" :aria-label="`Агрегация: ${metricLabel(aggregationSlot)}`"
        @pointerdown.stop @pointerup.stop @click.stop
        @keydown.esc.stop.prevent="closeAggregation(true)" @keydown.down.prevent="moveAggregationFocus(1)"
        @keydown.up.prevent="moveAggregationFocus(-1)" @keydown.home.prevent="focusAggregationOption(0)"
        @keydown.right.prevent="moveAggregationFocus(1)" @keydown.left.prevent="moveAggregationFocus(-1)"
        @keydown.end.prevent="focusAggregationOption(-1)">
        <div class="aggregation-heading">{{ metricLabel(aggregationSlot) }}</div>
        <div ref="aggregationList" class="aggregation-options nice-scrollbar">
          <section v-for="group in aggregationGroups" :key="group.key" class="aggregation-group" role="group"
            :aria-label="group.title" :class="{ quantiles: group.key === 'quantiles' }"
            :style="{ '--aggregation-columns': group.columns }">
            <h3>{{ group.title }}</h3>
            <div class="aggregation-grid">
              <button v-for="option in group.options" :key="option.slot" type="button" class="aggregation-option"
                :role="multiple ? 'menuitemcheckbox' : 'menuitemradio'" :aria-checked="selected.includes(option.slot)"
                :aria-label="option.label" :title="option.label"
                :disabled="isDisabled(option.slot)" :class="{ selected: selected.includes(option.slot) }"
                @click="selectAggregation(option.slot)">
                {{ aggregationOptionLabel(option.slot, option.label) }}
              </button>
            </div>
          </section>
        </div>
      </div>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import ResetIcon from '@/assets/icons/reset.svg'
import { computed, ref, shallowRef, useId, useTemplateRef } from 'vue'
import Popover from '@/shared/uiKit/popover/Popover.vue'
import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import { availableSlots, baseSlot, defaultSlot, metricLabel, slotAggregationLabel, slotAggregationOptions, slotCategories, slotDescription, type BaseSlot, type Slot } from './shared/vehicleMetrics'

const props = defineProps<{
  title: string
  selected: readonly Slot[]
  maxSlots?: number
  multiple?: boolean
  canReset?: boolean
}>()

const emit = defineEmits<{
  select: [slot: Slot]
  toggleMetric: [slot: BaseSlot]
  reset: []
}>()

const aggregationSlot = ref<BaseSlot | null>(null)
const aggregationTrigger = shallowRef<HTMLButtonElement | null>(null)
const aggregationMenu = useTemplateRef<HTMLElement>('aggregationMenu')
const aggregationList = useTemplateRef<HTMLElement>('aggregationList')
const menuId = useId()
const aggregationOptions = computed(() => aggregationSlot.value === null ? [] : slotAggregationOptions(aggregationSlot.value))

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

function aggregationTitle(slot: BaseSlot) {
  const labels = selectedAggregations(slot).map(selected => availableSlots[selected].label)
  return labels.length ? labels.join('\n') : `Агрегация: ${metricLabel(slot)}`
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
  const selectedIndex = [...buttons].findIndex(button => button.getAttribute('aria-checked') === 'true')
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
.column-popover {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: min(900px, calc(100vw - 20px));
  max-height: min(700px, 70dvh);

  .popover-heading {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      line-height: 20px;
    }

    .selection-controls {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-left: auto;
      min-height: 20px;
    }

    .reset-button {
      display: flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      padding: 0;
      border-radius: 5px;
      background: transparent;
      color: rgba(255, 255, 255, 0.65);
      transition: color 0.15s;

      &:hover:not(:disabled) {
        color: white;
      }

      &:disabled {
        opacity: 0.25;
        cursor: default;
      }

      svg {
        width: 12px;
        height: 12px;
      }

      &:focus-visible {
        outline: 2px solid var(--blue-thin-color);
        outline-offset: -2px;
      }
    }

    .selected-count {
      color: rgba(255, 255, 255, 0.55);
      font-size: 12px;
      line-height: 1.2;
      white-space: nowrap;
    }
  }

  .column-list {
    min-height: 0;
    overflow-y: auto;
    margin-right: 3px;
    padding: 0 14px;
    padding-bottom: 14px;

    &::-webkit-scrollbar-track {
      margin-block-end: 10px;
      margin-block-start: 45px;
    }

    .category {
      margin-top: 16px;

      &+.category {
        margin-top: 20px;
      }

      h3 {
        margin: 0 0 8px;
        color: #fff;
        font-size: 14px;
        font-weight: 500;
      }

      &.derived h3 {
        color: #ece0ff;
      }

      .tiles {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(250px, 100%), 1fr));
        gap: 6px;

        .tile-option {
          position: relative;
          display: flex;
          align-items: stretch;
          min-width: 0;
          border-radius: 5px;
          background: rgba(255, 255, 255, 0.05);

          &.disabled {
            opacity: 0.45;
          }

          &.selected {
            background: rgba(255, 255, 255, 0.1);

            &::before {
              content: '';
              position: absolute;
              top: 7px;
              bottom: 7px;
              left: 0;
              width: 3px;
              border-radius: 3px;
              background: var(--blue-thin-color);
            }
          }

          @media (hover: hover) and (pointer: fine) {
            &:hover:not(.disabled) {
              background: rgba(255, 255, 255, 0.12);
            }
          }

          &.derived {
            &.selected::before {
              background: #bbaad6;
            }

            .tile {
              padding-block: 7px;
            }

            .tile-icon {
              color: #bbaad6;
            }
          }
        }

        .tile {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          padding: 2px 6px;
          border-radius: 5px;
          background: transparent;
          color: inherit;
          text-align: left;
          font-size: 14px;
          line-height: 1.2;

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

        .aggregation-trigger {
          position: relative;
          display: grid;
          place-items: center;
          flex: none;
          align-self: center;
          width: 24px;
          height: 24px;
          margin: 3px;
          padding: 0;
          border-radius: 5px;
          color: rgba(197, 197, 197, 0.6);
          background: transparent;

          &:hover:not(:disabled),
          &[aria-expanded='true'] {
            color: rgba(255, 255, 255, 0.8);
            background: rgba(255, 255, 255, 0.08);
          }

          &.active {
            color: var(--blue-thin-color);
            background: rgba(10, 132, 255, 0.12);

            &:hover:not(:disabled) {
              color: var(--blue-thin-color);
              background: rgba(10, 132, 255, 0.22);
            }
          }

          .aggregation-badge {
            position: absolute;
            top: -2px;
            right: -2px;
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
        }

        button:focus-visible {
          outline: 2px solid var(--blue-thin-color);
          outline-offset: -2px;
        }
      }
    }
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
      padding-inline: 4px;
      text-align: center;
      font-variant-numeric: tabular-nums;
    }
  }

  .aggregation-option {
    position: relative;
    flex: none;
    width: 100%;
    min-height: 26px;
    padding: 5px 8px;
    border-radius: 5px;
    background: rgba(255, 255, 255, 0.05);
    color: inherit;
    text-align: left;
    font-size: 12px;
    line-height: 1.2;

    @media (hover: hover) and (pointer: fine) {
      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.12);
      }
    }

    &:focus-visible {
      outline: 2px solid var(--blue-thin-color);
      outline-offset: -2px;
    }

    &:disabled:not(.selected) {
      opacity: 0.45;
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
