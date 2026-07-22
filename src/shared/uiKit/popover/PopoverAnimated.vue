<template>
  <Popover :target :display :offset :viewportOffset :placement :preserveLastPlacement :styles :teleportTo
    @pointer-down-outside="e => emit('pointerDownOutside', e)" @pointer-up-outside="e => emit('pointerUpOutside', e)"
    @target-outside-window="emit('targetOutsideWindow')" @popover-outside-window="emit('popoverOutsideWindow')"
    @pointer-click-outside="e => emit('pointerClickOutside', e)" @ready-to-visible="onReadyToVisible"
    v-slot="{ arrow }">
    <slot :arrow :transition-class="[...transitionClass.values()]" _class="test"></slot>
  </Popover>
</template>


<script setup lang="ts">
import { nextTick, onUnmounted, ref, RendererElement, watch } from 'vue'
import Popover from './Popover.vue'
import { OffsetValue, PlacementParam } from './utils'


const props = defineProps<{
  target: HTMLElement | null
  display: boolean
  offset?: OffsetValue
  viewportOffset?: OffsetValue
  placement?: PlacementParam
  preserveLastPlacement?: boolean
  duration?: number
  styles?: Record<string, string>
  teleportTo?: string | RendererElement | null
}>()

const emit = defineEmits<{
  (e: 'pointerDownOutside', event: PointerEvent): void,
  (e: 'pointerUpOutside', event: PointerEvent): void,
  (e: 'targetOutsideWindow'): void,
  (e: 'popoverOutsideWindow'): void,
  (e: 'pointerClickOutside', event: PointerEvent): void,
}>()

const display = ref(false)
const transitionClass = ref(new Set<string>())


type TimeoutHandle = ReturnType<typeof setTimeout> | null;
let hideTimeoutHandle: TimeoutHandle = null
let endEnterHandle: TimeoutHandle = null
let endLeaveHandle: TimeoutHandle = null
let awaitingForReady = false
let enterPending = false
let nextFrameVersion = 0

watch(() => props.display, (enabled, last) => {
  if (last == undefined && !enabled) return

  if (enabled) {
    if (hideTimeoutHandle) clearTimeout(hideTimeoutHandle)
    transitionClass.value.clear()
    transitionClass.value.add('v-prepare')
    if (display.value) beginEnter()
    else awaitingForReady = true
    display.value = true
  }
  else {
    awaitingForReady = false
    if (hideTimeoutHandle) clearTimeout(hideTimeoutHandle)
    hideTimeoutHandle = setTimeout(() => display.value = false, props.duration ?? 300)
    beginLeave()
  }
}, { immediate: true })

function onReadyToVisible() {
  if (!awaitingForReady) return
  beginEnter()
  awaitingForReady = false
}

const enterPrepare = 'v-prepare'
const enterActive = 'v-enter-active'
const leaveActive = 'v-leave-active'
const enterFrom = 'v-enter-from'
const enterTo = 'v-enter-to'
const leaveFrom = 'v-leave-from'
const leaveTo = 'v-leave-to'


function cancelNextFrame() {
  nextFrameVersion++
}

function nextFrame(callback: () => void) {
  const version = ++nextFrameVersion

  nextTick(() => {
    if (version !== nextFrameVersion) return

    requestAnimationFrame(() => {
      if (version !== nextFrameVersion) return

      requestAnimationFrame(() => {
        if (version !== nextFrameVersion) return
        callback()
      })
    })
  })
}

function startEnterTimeout() {
  endEnterHandle = setTimeout(() => {
    endEnterHandle = null
    transitionClass.value.delete(enterActive)
    transitionClass.value.delete(enterTo)
  }, props.duration ?? 300)
}

function beginEnter() {
  if (!props.display) return
  if (endEnterHandle || enterPending) return

  transitionClass.value.delete(enterPrepare)

  if (endLeaveHandle) {
    clearTimeout(endLeaveHandle)
    endLeaveHandle = null

    transitionClass.value.delete(leaveActive)
    transitionClass.value.delete(leaveTo)
    transitionClass.value.add(enterActive)
    transitionClass.value.add(enterTo)
    startEnterTimeout()
  } else {
    enterPending = true
    transitionClass.value.add(enterFrom)

    nextFrame(() => {
      enterPending = false
      if (!props.display) return

      transitionClass.value.delete(enterFrom)
      transitionClass.value.add(enterActive)
      transitionClass.value.add(enterTo)
      startEnterTimeout()
    })
  }
}

function beginLeave() {
  if (endLeaveHandle) return
  if (endEnterHandle || enterPending) {
    cancelNextFrame()
    enterPending = false

    if (endEnterHandle) clearTimeout(endEnterHandle)
    endEnterHandle = null

    transitionClass.value.delete(enterFrom)
    transitionClass.value.delete(enterActive)
    transitionClass.value.delete(enterTo)
    transitionClass.value.add(leaveActive)
    transitionClass.value.add(leaveTo)
  } else {
    transitionClass.value.add(leaveFrom)
    nextTick(() => {
      if (props.display || !endLeaveHandle) return

      transitionClass.value.delete(leaveFrom)
      transitionClass.value.add(leaveActive)
      transitionClass.value.add(leaveTo)
    })
  }

  endLeaveHandle = setTimeout(() => {
    endLeaveHandle = null
    transitionClass.value.delete(leaveActive)
    transitionClass.value.delete(leaveTo)
  }, props.duration ?? 300)
}

onUnmounted(() => {
  cancelNextFrame()
  if (hideTimeoutHandle) clearTimeout(hideTimeoutHandle)
  if (endEnterHandle) clearTimeout(endEnterHandle)
  if (endLeaveHandle) clearTimeout(endLeaveHandle)
})

</script>


<style lang="scss" scoped></style>
