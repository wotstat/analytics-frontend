<template>
  <button
    class="expand"
    :class="{ enabled: count > 0 }"
    type="button"
    @click="expanded = !expanded">
    Ещё фильтры<span v-if="count"> · {{ count }}</span>
    <DropdownArrow class="arrow" :expanded />
  </button>
</template>

<script setup lang="ts">
import DropdownArrow from '@/shared/uiKit/dropdown/DropdownArrow.vue'

defineProps<{ count: number }>()
const expanded = defineModel<boolean>({ required: true })
</script>

<style scoped lang="scss">
.expand {
  display: flex;
  align-items: center;
  min-height: 24px;
  color: rgba(255, 255, 255, 0.65);
  font-size: inherit;
  white-space: nowrap;
  transition: color 0.15s;

  &.enabled {
    color: var(--blue-thin-color);
  }

  &:active {
    color: white;
  }

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      color: white;
    }
  }

  .arrow {
    margin-left: 5px;
    width: 12px;
    height: 12px;
  }

  @container content (max-width: 600px) {
    flex: 1;
    min-height: 30px;
  }
}
</style>
