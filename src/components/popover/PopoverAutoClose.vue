<template>
  <PopoverStyled v-bind="targetProps" :display="display" @pointer-click-outside="onClickOutside"
    @pointer-down-outside="onPointerDownOutside" @target-outside-window="onTargetOutside" :duration="200">
    <slot></slot>
  </PopoverStyled>
</template>


<script setup lang="ts">
import { computed } from 'vue'
import { OffsetValue, PlacementParam } from './utils'
import { onKeyDown, useEventListener, useMediaQuery } from '@vueuse/core'
import PopoverStyled from './PopoverStyled.vue'


const props = defineProps<{
  target: HTMLElement | null
  offset?: OffsetValue
  viewportOffset?: OffsetValue
  arrowSize?: number
  preserveLastPlacement?: boolean
  placement?: PlacementParam
}>()

const display = defineModel<boolean>({ default: false })

const targetProps = computed(() => ({
  target: props.target,
  offset: props.offset,
  viewportOffset: props.viewportOffset,
  arrowSize: props.arrowSize,
  preserveLastPlacement: props.preserveLastPlacement,
  placement: props.placement
}))

const emit = defineEmits<{
  (e: 'pointerDownOutside', event: PointerEvent): void,
  (e: 'pointerClickOutside', event: PointerEvent): void,
  (e: 'targetOutsideWindow'): void
}>()

const isDesktop = useMediaQuery('(hover: hover) and (pointer: fine)')

onKeyDown('Escape', () => display.value = false)

function onPointerDownOutside(event: PointerEvent) {
  if (isDesktop.value) display.value = false
  emit('pointerDownOutside', event)
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
