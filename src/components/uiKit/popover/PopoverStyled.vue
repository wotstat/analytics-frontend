<template>
  <PopoverAnimated :target :display :offset="targetOffset" :viewportOffset :placement :preserveLastPlacement
    @pointer-down-outside="e => emit('pointerDownOutside', e)" @target-outside-window="emit('targetOutsideWindow')"
    @pointer-click-outside="e => emit('pointerClickOutside', e)" v-slot="{ arrow, transitionClass }" :duration="200">
    <div class="popover-card" ref="popoverCard" :class="{
      [`arrow-${arrow.direction}`]: arrow.direction,
      'arrow-disabled': arrowSize == 0,
      ...transitionClass.reduce((acc, cls) => ({ ...acc, [cls]: true }), {})
    }" :style="{
      '--background-color': '#2a2a2a',
      '--arrow-x': `${arrow.x}px`,
      '--arrow-y': `${arrow.y}px`,
      '--arrow-size': `${arrowSize ?? 5}px`
    }">
      <div class="popover-content">
        <slot></slot>
      </div>
    </div>
  </PopoverAnimated>
</template>


<script setup lang="ts">
import { computed } from 'vue'
import { OffsetValue, PlacementParam } from './utils'
import PopoverAnimated from './PopoverAnimated.vue'

const { target,
  display,
  offset,
  viewportOffset = 10,
  placement,
  preserveLastPlacement = true,
  arrowSize
} = defineProps<{
  target: HTMLElement | null
  display: boolean
  offset?: OffsetValue
  viewportOffset?: OffsetValue
  arrowSize?: number
  preserveLastPlacement?: boolean
  placement?: PlacementParam
}>()

const emit = defineEmits<{
  (e: 'pointerDownOutside', event: PointerEvent): void,
  (e: 'pointerClickOutside', event: PointerEvent): void,
  (e: 'targetOutsideWindow'): void,
}>()

const targetOffset = computed<OffsetValue>(() => {
  if (offset !== undefined) return offset
  if (arrowSize) return arrowSize + 3
  return 7
})

</script>


<style lang="scss" scoped>
$background-color: var(--background-color, #2a2a2a);
$border-color: var(--border-color, #444);
$animation-offset: var(--animation-transition-offset, 3px);


.popover-card {
  background-color: $background-color;
  color: #f6f6f6;
  border-radius: 10px;
  border: 1px solid $border-color;
  box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.3);

  $arrow-offset: calc(var(--arrow-size) / -2 - 1px);
  $arrow-offset-bordered: calc($arrow-offset - 2px);
  position: relative;

  .popover-content {
    overflow: hidden;
    border-radius: 9px;
  }

  &::after {
    content: '';
    position: absolute;
    top: var(--arrow-y);
    left: var(--arrow-x);
    width: var(--arrow-size);
    height: var(--arrow-size);
    background-color: $background-color;
    border-right: 1px solid $border-color;
    border-top: 1px solid $border-color;
    border-left: 1px solid transparent;
    border-bottom: 1px solid transparent;
    clip-path: polygon(0 0, 100% 100%, 100% 0);
  }

  &.arrow-left::after {
    transform: translate($arrow-offset, $arrow-offset) rotate(-135deg);
  }

  &.arrow-right::after {
    transform: translate($arrow-offset-bordered, $arrow-offset-bordered) rotate(45deg);
  }

  &.arrow-top::after {
    transform: translate($arrow-offset, $arrow-offset) rotate(-45deg);
  }

  &.arrow-bottom::after {
    transform: translate($arrow-offset-bordered, $arrow-offset-bordered) rotate(135deg);
  }

  &.arrow-disabled::after {
    display: none;
  }

}

.v-prepare {
  visibility: hidden;
  opacity: 0;
}

.v-enter-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}

.v-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;

  &.arrow-left {
    transform: translate(calc(-1 * $animation-offset), 0);
  }

  &.arrow-right {
    transform: translate($animation-offset, 0);
  }

  &.arrow-top {
    transform: translate(0, calc(-1 * $animation-offset));
  }

  &.arrow-bottom {
    transform: translate(0, $animation-offset);
  }
}
</style>