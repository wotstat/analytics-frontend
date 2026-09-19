<template>
  <button class="heading" :class="{ 'order-by': position > 0, 'secondary-sort': position > 1, asc: ascending }"
    v-tooltip.instant.top-float="label" @click="$emit('click', $event)">
    <slot />
    <span v-if="position" class="sort-arrow">
      <span v-if="position > 1" class="sort-number">{{ position }}</span>
    </span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  position: number
  ascending: boolean
}>()

defineEmits<{ click: [event: MouseEvent] }>()
</script>

<style scoped lang="scss">
.heading {
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 42px;
  padding: 1px;
  color: #fff;
  transition: background-color 0.1s;

  @media (hover: hover) {
    &:hover {
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
