<template>
  <Popover :target :display :offset :viewportOffset :placement :preserveLastPlacement
    @click-outside="e => emit('clickOutside', e)" @target-outside-window="emit('targetOutsideWindow')"
    @ready-to-visible="onReadyToVisible" v-slot="{ arrow }">
    <slot :arrow :transition-class="[...transitionClass.values()]" _class="test"></slot>
  </Popover>
</template>


<script setup lang="ts">
import { ref, watch } from 'vue'
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
}>()

const emit = defineEmits<{
  (e: 'clickOutside', event: PointerEvent): void,
  (e: 'targetOutsideWindow'): void
}>()

const display = ref(props.display)
const transitionClass = ref(new Set<string>())


type TimeoutHandle = ReturnType<typeof setTimeout> | null;
let hideTimeoutHandle: TimeoutHandle = null
let endEnterHandle: TimeoutHandle = null
let endLeaveHandle: TimeoutHandle = null
let awaitingForReady = false

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


function beginEnter() {
  if (!props.display) return
  if (endEnterHandle) return

  transitionClass.value.delete(enterPrepare)

  if (endLeaveHandle) {
    clearTimeout(endLeaveHandle)
    endLeaveHandle = null

    transitionClass.value.delete(leaveActive)
    transitionClass.value.delete(leaveTo)
    transitionClass.value.add(enterActive)
    transitionClass.value.add(enterTo)
  } else {
    transitionClass.value.add(enterFrom)
    setTimeout(() => {
      transitionClass.value.delete(enterFrom)
      transitionClass.value.add(enterActive)
      transitionClass.value.add(enterTo)
    }, 0)
  }

  endEnterHandle = setTimeout(() => {
    endEnterHandle = null
    transitionClass.value.delete(enterActive)
    transitionClass.value.delete(enterTo)
  }, props.duration ?? 300)
}

function beginLeave() {
  if (endLeaveHandle) return
  if (endEnterHandle) {
    clearTimeout(endEnterHandle)
    endEnterHandle = null

    transitionClass.value.delete(enterActive)
    transitionClass.value.delete(enterTo)
    transitionClass.value.add(leaveActive)
    transitionClass.value.add(leaveTo)
  } else {
    transitionClass.value.add(leaveFrom)
    setTimeout(() => {
      transitionClass.value.delete(leaveFrom)
      transitionClass.value.add(leaveActive)
      transitionClass.value.add(leaveTo)
    }, 0)
  }

  endLeaveHandle = setTimeout(() => {
    endLeaveHandle = null
    transitionClass.value.delete(leaveActive)
    transitionClass.value.delete(leaveTo)
  }, props.duration ?? 300)
}

</script>


<style lang="scss" scoped></style>