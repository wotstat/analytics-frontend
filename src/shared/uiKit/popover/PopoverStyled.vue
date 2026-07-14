<template>
  <PopoverAnimated :target :display :offset="targetOffset" :viewportOffset :placement :preserveLastPlacement :styles
    @pointer-down-outside="e => emit('pointerDownOutside', e)" @target-outside-window="emit('targetOutsideWindow')"
    @pointer-click-outside="e => emit('pointerClickOutside', e)" v-slot="{ arrow, transitionClass }" :duration="200">
    <div class="popover-card" :class="[{
      [`arrow-${arrow.direction}`]: arrow.direction,
      'arrow-disabled': arrowSize == 0,
      'arrow-mask': arrowUsingMask,
      ...transitionClass.reduce((acc, cls) => ({ ...acc, [cls]: true }), {}),
    }, classes]" :style="{
      '--arrow-x': `${roundDpr(arrow.x || 0)}px`,
      '--arrow-y': `${roundDpr(arrow.y || 0)}px`,
      '--arrow-size': `${arrowSize ?? 5}px`,
    }">
      <div class="popover-background">
        <div class="popover-content">
          <slot></slot>
        </div>
      </div>
    </div>
  </PopoverAnimated>
</template>


<script setup lang="ts">
import { ClassValue, normalizeClass, computed } from 'vue'
import { OffsetValue, PlacementParam, roundDpr } from './utils'
import PopoverAnimated from './PopoverAnimated.vue'


const { target,
  display,
  offset,
  viewportOffset = 10,
  placement,
  preserveLastPlacement = true,
  arrowSize,
  arrowUsingMask,
  styles,
  class: classes
} = defineProps<{
  target: HTMLElement | null
  display: boolean
  offset?: OffsetValue
  viewportOffset?: OffsetValue
  arrowSize?: number
  arrowUsingMask?: boolean
  preserveLastPlacement?: boolean
  placement?: PlacementParam
  styles?: Record<string, string>
  class?: ClassValue
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
$background-color: var(--popover-background-color, #2a2a2a);
$border-color: var(--popover-border-color, #444);
$animation-offset: var(--animation-transition-offset, 3px);

.popover-card:not(.arrow-disabled) {
  &::after {
    content: '';
    box-sizing: border-box;
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

  $half-arrow: var(--arrow-size) / -2;
  $offset-0: calc($half-arrow);
  $offset-p1: calc($half-arrow + 1px);
  $offset-n1: calc($half-arrow - 1px);

  &.arrow-left::after {
    transform: translate($offset-p1, $offset-0) rotate(-135deg);
  }

  &.arrow-right::after {
    transform: translate($offset-n1, $offset-0) rotate(45deg);
  }

  &.arrow-top::after {
    transform: translate($offset-0, $offset-p1) rotate(-45deg);
  }

  &.arrow-bottom::after {
    transform: translate($offset-0, $offset-n1) rotate(135deg);
  }

  &.arrow-mask {
    $sqrt2: 0.7071067812; // sqrt(2) / 2
    $half: calc(var(--arrow-size) * $sqrt2);
    $n-half: calc(var(--arrow-size) * $sqrt2 * -1);
    $x: var(--arrow-x);
    $y: var(--arrow-y);

    &.arrow-left {
      $mask-shape: calc($x - $half + 1px) calc($y),
        calc($x + 1px) calc($y + $half),
        calc($x + 1px) calc($y - $half),
        calc($x - $half + 1px) calc($y);

      --mask-shape: #{$mask-shape};
    }

    &.arrow-right {
      $mask-shape: calc($x + $half - 1px) calc($y),
        calc($x - 1px) calc($y + $half),
        calc($x - 1px) calc($y - $half),
        calc($x + $half - 1px) calc($y);

      --mask-shape: #{$mask-shape};
    }

    &.arrow-top {
      $mask-shape: $x calc($y - $half + 1px),
        calc($x + $half) 1px,
        calc($x - $half) 1px,
        $x calc($y - $half + 1px);

      --mask-shape: #{$mask-shape};
    }

    &.arrow-bottom {
      $mask-shape: $x calc($y + $half - 1px),
        calc($x + $half) calc($y - 1px),
        calc($x - $half) calc($y - 1px),
        $x calc($y + $half - 1px);

      --mask-shape: #{$mask-shape};
    }

    .popover-background {
      clip-path: polygon(evenodd,
          -20px -20px,
          calc(100% - -20px) -20px,
          calc(100% - -20px) calc(100% - -20px),
          -20px calc(100% - -20px),
          -20px -20px,
          var(--mask-shape),
        );
    }
  }
}

.popover-background {
  background-color: $background-color;
  color: #f6f6f6;
  border-radius: 10px;
  border: 1px solid $border-color;
  box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.3);
  position: relative;

  .popover-content {
    overflow: hidden;
    border-radius: 9px;
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