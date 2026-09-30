<template>
  <button class="compare" :class="{ added: compared }" @click="$emit('click', $event)">
    <Transition name="compare-icon">
      <Checkmark v-if="compared" key="checkmark" class="compare-icon" />
      <PlusIcon v-else key="plus" class="compare-icon" />
    </Transition>
  </button>
</template>

<script setup lang="ts">
import PlusIcon from './assets/plus-bold.svg'
import Checkmark from './assets/checkmark-bold.svg'

defineProps<{ compared: boolean }>()
defineEmits<{ click: [event: MouseEvent] }>()
</script>

<style scoped lang="scss">
.compare {
  align-self: center;
  display: grid;
  place-items: center;
  margin-left: 6px;
  width: 28px;
  height: 30px;
  padding: 0;
  color: rgba(255, 255, 255, 0.55);
  border-radius: 5px;

  &:hover {
    color: white;
    background: rgba(255, 255, 255, 0.08);
  }

  &.added {
    color: #30d158;
  }

  .compare-icon {
    width: 12px;
    height: 12px;
    grid-area: 1 / 1;
    pointer-events: none;

    &.compare-icon-enter-active,
    &.compare-icon-leave-active {
      transition: opacity 0.18s ease, filter 0.18s ease, transform 0.18s ease;
    }

    &.compare-icon-enter-from,
    &.compare-icon-leave-to {
      opacity: 0;
      filter: blur(3px);
      transform: scale(0.65);
    }
  }
}
</style>
