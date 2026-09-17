<template>
  <button ref="trigger" class="column-trigger" type="button" :aria-expanded="open" @click="open = !open">
    Столбцы · {{ selected.length }}/{{ maxSlots }}
  </button>

  <PopoverAutoClose v-model="open" :target="trigger" :placement="['bottom-end', 'bottom-float']"
    :viewport-offset="popoverViewportOffset" :arrow-size="0">
    <div class="column-popover deep-nice-scrollbar">
      <div class="popover-heading">
        <span>Столбцы</span>
        <span class="selected-count">Выбрано {{ selected.length }} из {{ maxSlots }}</span>
      </div>

      <section v-for="category in slotCategories" :key="category.title" class="category">
        <h3>{{ category.title }}</h3>
        <div class="tiles">
          <button v-for="slot in category.slots" :key="slot" type="button" class="tile"
            :class="{ selected: selected.includes(slot) }"
            :aria-pressed="selected.includes(slot)" :title="slotDescription(slot)"
            :disabled="selected.includes(slot) ? selected.length === 1 : selected.length >= maxSlots"
            @click="toggle(slot)">
            <Icon :icon="availableSlots[slot].icon" class="tile-icon" />
            <span>{{ availableSlots[slot].label }}</span>
          </button>
        </div>
      </section>
    </div>
  </PopoverAutoClose>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import Icon from '@/shared/game/efficiencyIcon/Icon.vue'
import PopoverAutoClose from '@/shared/uiKit/popover/PopoverAutoClose.vue'
import { popoverViewportOffset } from '@/pages/shared/header/useAdditionalHeaderHeight'
import { availableSlots, orderSlots, slotCategories, slotDescription, type Slot } from './helpers'

const selected = defineModel<Slot[]>({ required: true })
const open = ref(false)
const trigger = useTemplateRef<HTMLButtonElement>('trigger')

function toggle(slot: Slot) {
  if (selected.value.includes(slot)) {
    if (selected.value.length > 1) selected.value = selected.value.filter(item => item !== slot)
  } else if (selected.value.length < props.maxSlots) selected.value = orderSlots([...selected.value, slot])
}

const props = defineProps<{ maxSlots: number }>()
</script>

<style scoped lang="scss">
.column-trigger {
  flex: none;
  height: 30px;
  margin-left: auto;
  padding: 0 12px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  font-size: 14px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.column-popover {
  box-sizing: border-box;
  width: min(900px, calc(100vw - 20px));
  max-height: min(700px, 70dvh);
  overflow-y: auto;
  padding: 16px;
}

.popover-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  font-size: 15px;
  font-weight: 600;
}

.selected-count {
  color: rgba(255, 255, 255, 0.55);
  font-size: 12px;
  font-weight: normal;
}

.category {
  margin-top: 16px;

  h3 {
    margin: 0 0 8px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
    font-weight: 500;
  }
}

.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(250px, 100%), 1fr));
  gap: 6px;
}

.tile {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  min-height: 48px;
  padding: 8px;
  border: 1px solid transparent;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  text-align: left;
  font-size: 12px;
  line-height: 1.2;

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
  }

  &.selected {
    border-color: var(--blue-thin-color);
    background: rgba(255, 255, 255, 0.1);
  }

  &:disabled:not(.selected) {
    opacity: 0.45;
  }
}

.tile-icon {
  width: 24px;
  height: 24px;
  flex: none;
}
</style>
