<template>
  <component
    :is="sortable ? 'button' : 'div'"
    :type="sortable ? 'button' : undefined"
    class="heading" :class="classes"
    @click="$emit('click', $event)"
    v-tooltip.instant.top-float="{ text: label, class: tooltipClass, disabled: !label }">
    <slot />
    <span v-if="position" class="sort-arrow">
      <span v-if="position > 1" class="sort-number">{{ position }}</span>
    </span>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  label?: string
  tooltipClass?: string
  sortable?: boolean
  position?: number
  ascending?: boolean
}>(), { label: '', sortable: false, position: 0, ascending: false })

defineEmits<{ click: [event: MouseEvent] }>()

const classes = computed(() => ({
  heading: true,
  sortable: props.sortable,
  'order-by': props.position > 0,
  'secondary-sort': props.position > 1,
  asc: props.ascending
}))

</script>

<style scoped lang="scss">
.heading {
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: var(--composable-table-heading-height, 42px);
  height: 100%;
  box-sizing: border-box;
  font: inherit;
  padding: 1px;
  color: #fff;
  transition: background-color 0.1s;

  @media (hover: hover) {
    &.sortable:hover {
      background-color: rgba(255, 255, 255, 0.025);

      &.order-by {
        background-color: rgba(255, 255, 255, 0.04);
      }
    }
  }

  &.order-by {
    background-color: rgba(255, 255, 255, 0.025);
  }

  &.secondary-sort {
    .sort-arrow {
      opacity: 0.55;
    }
  }

  &.asc {
    .sort-arrow::after {
      top: auto;
      bottom: 0;
      transform: translate(-50%, 0) rotate(180deg);
    }
  }

  .sort-arrow {
    position: absolute;
    height: 1px;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: currentColor;
    z-index: 1;

    &::after {
      content: '';
      position: absolute;
      left: 50%;
      top: 0;
      transform: translate(-50%, 0);
      width: 13px;
      height: 5px;
      background-color: currentColor;
      clip-path: polygon(0 0, 100% 0, 50% 100%);
    }

    .sort-number {
      position: absolute;
      left: calc(50% + 9px);
      bottom: 2px;
      font-size: 9px;
      font-weight: bold;
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }
  }
}
</style>
