<template>
  <div class="column-popover">
    <header class="popover-heading">
      <h2>{{ title }}</h2>
      <span v-if="maxSlots !== undefined" class="selected-count">Выбрано {{ selected.length }} из {{ maxSlots }}</span>
    </header>

    <div class="column-list nice-scrollbar">
      <section v-for="category in slotCategories" :key="category.title" class="category">
        <h3>{{ category.title }}</h3>
        <div class="tiles">
          <button v-for="slot in category.slots" :key="slot" class="tile"
            :class="{ selected: selected.includes(slot) }"
            :disabled="isDisabled(slot)"
            @click="emit('select', slot)">
            <Icon :icon="availableSlots[slot].icon" class="tile-icon" />
            <span>{{ availableSlots[slot].label }}</span>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import { availableSlots, slotCategories, type Slot } from './shared/vehicleMetrics'

const props = defineProps<{
  title: string
  selected: readonly Slot[]
  maxSlots?: number
}>()

const emit = defineEmits<{ select: [slot: Slot] }>()

function isDisabled(slot: Slot) {
  if (props.maxSlots === undefined) return false
  if (props.selected.includes(slot)) return props.selected.length === 1
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
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .selected-count {
      color: rgba(255, 255, 255, 0.55);
      font-size: 12px;
      white-space: nowrap;
    }
  }

  .column-list {
    min-height: 0;
    overflow-y: auto;
    margin-right: 3px;
    padding: 0 13px 16px 16px;

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

      .tiles {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(250px, 100%), 1fr));
        gap: 6px;

        .tile {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          padding: 2px 6px;
          border-radius: 5px;
          background: rgba(255, 255, 255, 0.05);
          color: inherit;
          text-align: left;
          font-size: 14px;
          line-height: 1.2;

          span {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          @media (hover: hover) and (pointer: fine) {
            &:hover:not(:disabled) {
              background: rgba(255, 255, 255, 0.12);
            }
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

          &:disabled:not(.selected) {
            opacity: 0.45;
          }

          .tile-icon {
            width: 34px;
            height: 34px;
            margin: -2px;
          }
        }
      }
    }
  }
}
</style>
