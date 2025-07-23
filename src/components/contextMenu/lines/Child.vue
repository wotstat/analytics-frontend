<template>
  <div class="context-menu-child-line" :class="classes">
    <component v-if="item.icon" :is="item.icon" class="icon" />
    <p class="label">{{ item.label }} </p>
    <ChevronRightComponent class="chevron-right" />
  </div>
</template>


<script setup lang="ts">
import ChevronRightComponent from '../assets/chevron.right.bold.svg'
import type { ContextMenuItemChild } from '../createContextMenu'
import { computed } from 'vue';

const props = defineProps<{
  item: ContextMenuItemChild
}>()

const classes = computed(() => {
  return {
    'hover-highlight': !props.item.disabled,
    'disabled': props.item.disabled
  }
})

</script>


<style lang="scss" scoped>
@use './shared.scss';

.context-menu-child-line {
  @extend %icon-line;

  .label {
    margin-right: 30px;
  }

  &.disabled {
    &>.chevron-right {
      fill: var(--color-label-tertiary, #EBEBF54D);
    }

    &>p {
      color: var(--color-label-tertiary, #EBEBF54D);
    }
  }

  .chevron-right {
    height: 0.7em;
    position: absolute;
    right: 9px;
    top: 50%;
    transform: translateY(-50%);
    fill: var(--primary-color, #fff)
  }
}
</style>