<template>
  <TransitionGroup tag="div" class="background-root" aria-hidden="true" inert name="page-background"
    @enter="waitForAnimations" @leave="waitForAnimations">
    <div v-for="entry in visibleEntries" :key="entry.renderId" class="background-layer"
      :class="`background-layer--${entry.placement}`" :style="{ zIndex: entry.depth * 1000000 + entry.order }">
      <component :is="entry.component" v-bind="entry.props" />
    </div>
  </TransitionGroup>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { type BackgroundController } from './useBackground'

const props = defineProps<{
  controller: BackgroundController
}>()

const visibleEntries = computed(() => {
  const source = props.controller.entries.value.length
    ? props.controller.entries.value
    : props.controller.heldEntries.value
  const entries = [...source]
    .sort((left, right) => left.depth - right.depth || left.order - right.order)

  const lastReplace = entries.findLastIndex(entry => entry.mode === 'replace')
  return entries.slice(Math.max(0, lastReplace))
})

function waitForAnimations(element: Element, done: () => void) {
  requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => {
    const animations = element.getAnimations({ subtree: true })
      .filter(animation => animation.playState === 'running' && animation.effect?.getComputedTiming().endTime !== Infinity)

    void Promise.allSettled(animations.map(animation => animation.finished)).then(() => done())
  })))
}
</script>

<style scoped lang="scss">
.background-root {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}

.background-layer {
  inset: 0;
  width: 100%;
  pointer-events: none;

  &--viewport {
    position: fixed;
  }

  &--page {
    position: absolute;
  }
}

.page-background-enter-active,
.page-background-leave-active {
  transition: opacity 350ms ease;
}

.page-background-enter-from,
.page-background-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {

  .background-layer,
  .background-layer :deep(*) {
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    animation-duration: 0s !important;
    animation-delay: 0s !important;
  }
}
</style>
