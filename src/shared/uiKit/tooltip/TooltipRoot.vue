<template>
  <Teleport to="body">
    <div id="tooltip-root">
      <PopoverStyled v-for="[group, [tooltip, display]] in displayedDelayedTooltips" :target="tooltip.target"
        :display="display" :key="group" :teleportTo="null" :exit-duration="HIDE_ANIMATION_DURATION"
        :class="[{ 'tooltip-non-interactive': !tooltip.options.interactive }, tooltip.props.class]"
        :placement="tooltip.props.placement" :viewport-offset="tooltip.props.viewportOffset"
        :arrow-size="tooltip.props.arrowSize" :offset="tooltip.props.offset"
        @pointer-down-outside="event => onPointerDownOutside(group, tooltip, event)"
        @pointer-up-outside="event => onPointerUpOutside(group, event)"
        @popover-outside-window="onPopoverOutsideWindow(group, tooltip)">
        <component :is="tooltip.component" />
      </PopoverStyled>
    </div>
  </Teleport>

</template>


<script setup lang="ts">
import { ref, watch } from 'vue'
import { useEventListener } from '@vueuse/core'
import PopoverStyled from '../popover/PopoverStyled.vue'
import { closeTooltip, DisplayedTooltip, displayedTooltips } from './tooltip'

const HIDE_ANIMATION_DURATION = 100

const props = defineProps<{}>()

const displayedDelayedTooltips = ref(new Map<string, [DisplayedTooltip, boolean]>())
const timeoutIds = new Map<string, number>()
const TOUCH_MOVE_THRESHOLD = 8

type OutsideTouchGesture = {
  pointerId: number
  startX: number
  startY: number
  moved: boolean
  tooltip: DisplayedTooltip
}

const outsideTouchGestures = new Map<string, OutsideTouchGesture>()

function onPointerDownOutside(group: string, tooltip: DisplayedTooltip, event: PointerEvent) {
  if (event.pointerType !== 'touch') return

  outsideTouchGestures.set(group, {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    moved: false,
    tooltip,
  })
}

function onPointerUpOutside(group: string, event: PointerEvent) {
  const gesture = outsideTouchGestures.get(group)
  if (!gesture || gesture.pointerId !== event.pointerId) return

  outsideTouchGestures.delete(group)
  if (!gesture.moved && displayedTooltips.value.get(group) === gesture.tooltip) closeTooltip(group)
}

function onPopoverOutsideWindow(group: string, tooltip: DisplayedTooltip) {
  if (displayedTooltips.value.get(group) === tooltip) closeTooltip(group)
}

useEventListener(window, 'pointermove', (event: PointerEvent) => {
  if (event.pointerType !== 'touch') return

  for (const gesture of outsideTouchGestures.values()) {
    if (gesture.pointerId !== event.pointerId || gesture.moved) continue

    const distance = Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY)
    if (distance > TOUCH_MOVE_THRESHOLD) gesture.moved = true
  }
}, { passive: true, capture: true })

useEventListener(window, 'pointercancel', (event: PointerEvent) => {
  if (event.pointerType !== 'touch') return

  for (const [group, gesture] of outsideTouchGestures) {
    if (gesture.pointerId === event.pointerId) outsideTouchGestures.delete(group)
  }
}, { capture: true })

watch(displayedTooltips, groups => {
  for (const [k, v] of displayedDelayedTooltips.value) {
    if (!groups.has(k)) {
      outsideTouchGestures.delete(k)
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

:deep(.tooltip-non-interactive) {
  pointer-events: none;
}
</style>
