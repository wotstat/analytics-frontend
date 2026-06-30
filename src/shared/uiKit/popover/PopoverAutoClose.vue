<template>
  <PopoverStyled v-bind="targetProps" :display="display" @pointer-click-outside="onClickOutside"
    @pointer-down-outside="onPointerDownOutside" @pointer-up-outside="onPointerUpOutside"
    @target-outside-window="onTargetOutside" :duration="200">
    <slot></slot>
  </PopoverStyled>
</template>


<script setup lang="ts">
import { computed } from 'vue'
import { OffsetValue, PlacementParam } from './utils'
import { onKeyDown, useMediaQuery } from '@vueuse/core'
import PopoverStyled from './PopoverStyled.vue'


const props = defineProps<{
  target: HTMLElement | null
  offset?: OffsetValue
  viewportOffset?: OffsetValue
  arrowSize?: number
  arrowUsingMask?: boolean
  preserveLastPlacement?: boolean
  placement?: PlacementParam
  styles?: Record<string, string>
  class?: string
}>()

const display = defineModel<boolean>({ default: false })

const targetProps = computed(() => ({
  target: props.target,
  offset: props.offset,
  viewportOffset: props.viewportOffset,
  arrowSize: props.arrowSize,
  arrowUsingMask: props.arrowUsingMask,
  preserveLastPlacement: props.preserveLastPlacement,
  placement: props.placement,
  styles: props.styles,
  class: props.class,
}))

const emit = defineEmits<{
  (e: 'pointerDownOutside', event: PointerEvent): void,
  (e: 'pointerUpOutside', event: PointerEvent): void,
  (e: 'pointerClickOutside', event: PointerEvent): void,
  (e: 'targetOutsideWindow'): void
}>()

const isDesktop = useMediaQuery('(hover: hover) and (pointer: fine)')

onKeyDown('Escape', () => display.value = false)

let lastPointerDown: {
  x: number
  y: number
  time: number
} | null = null

function onPointerDownOutside(event: PointerEvent) {
  if (isDesktop.value) display.value = false
  lastPointerDown = { x: event.clientX, y: event.clientY, time: Date.now() }
  emit('pointerDownOutside', event)
}

function onPointerUpOutside(event: PointerEvent) {
  if (isDesktop.value) display.value = false
  else if (lastPointerDown) {
    const dx = event.clientX - lastPointerDown.x
    const dy = event.clientY - lastPointerDown.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const timeDiff = Date.now() - lastPointerDown.time
    if (distance < 5 && timeDiff < 500) display.value = false
  }
  emit('pointerUpOutside', event)
}

function onClickOutside(event: PointerEvent) {
  if (!isDesktop.value) display.value = false
  emit('pointerClickOutside', event)
}

function onTargetOutside() {
  display.value = false
  emit('targetOutsideWindow')
}

</script>
