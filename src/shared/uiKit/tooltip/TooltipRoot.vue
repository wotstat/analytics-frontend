<template>
  <Teleport to="body">
    <div id="tooltip-root" ref="root">
      <PopoverStyled v-for="[group, [tooltip, display]] in displayedDelayedTooltips" :target="tooltip.target"
        :display="display" :key="group" :teleportTo="null" :exit-duration="HIDE_ANIMATION_DURATION"
        :interactive="tooltip.options.interactive" :class="tooltip.props.class"
        :placement="tooltip.props.placement" :viewport-offset="tooltip.props.viewportOffset"
        :arrow-size="tooltip.props.arrowSize" :offset="tooltip.props.offset"
        @pointer-down-outside="event => onPointerDownOutside(group, tooltip, event)"
        @popover-outside-window="onPopoverOutsideWindow(group, tooltip)">
        <component :is="tooltip.component" />
      </PopoverStyled>
    </div>
  </Teleport>

</template>


<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'
import { useEventListener } from '@vueuse/core'
import PopoverStyled from '../popover/PopoverStyled.vue'
import { closeTooltip, DisplayedTooltip, displayedTooltips } from './tooltip'

const HIDE_ANIMATION_DURATION = 100

const props = defineProps<{}>()

const root = useTemplateRef<HTMLElement>('root')
const displayedDelayedTooltips = ref(new Map<string, [DisplayedTooltip, boolean]>())
const timeoutIds = new Map<string, number>()

function onPointerDownOutside(group: string, tooltip: DisplayedTooltip, event: PointerEvent) {
  if (event.pointerType !== 'touch') return
  if (event.target instanceof Node && tooltip.trigger.contains(event.target)) return

  if (displayedTooltips.value.get(group) === tooltip) closeTooltip(group)
}

function onPopoverOutsideWindow(group: string, tooltip: DisplayedTooltip) {
  if (displayedTooltips.value.get(group) === tooltip) closeTooltip(group)
}

useEventListener(window, 'scroll', event => {
  if (event.target instanceof Node && root.value?.contains(event.target)) return

  for (const [group, tooltip] of displayedTooltips.value) {
    if (tooltip.isTouch) closeTooltip(group)
  }
}, { passive: true, capture: true })

watch(displayedTooltips, groups => {
  for (const [k, v] of displayedDelayedTooltips.value) {
    if (!groups.has(k)) {
      displayedDelayedTooltips.value.set(k, [v[0], false])
      const timeoutId = setTimeout(() => {
        displayedDelayedTooltips.value.delete(k)
        timeoutIds.delete(k)
      }, HIDE_ANIMATION_DURATION)
      timeoutIds.set(k, timeoutId)
    }
  }

  for (const [k, v] of groups) {
    if (timeoutIds.has(k)) {
      clearTimeout(timeoutIds.get(k))
      timeoutIds.delete(k)
    }

    displayedDelayedTooltips.value.set(k, [v, true])
  }
}, { immediate: true, deep: true })

</script>


<style lang="scss" scoped>
#tooltip-root :deep(.popup-container) {
  z-index: 1100;
}
</style>
