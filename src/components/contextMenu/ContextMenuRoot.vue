<template>
  <Teleport to="body">
    <div id="context-menu-root" :class="{ 'fade-leave-active': fadeLeaveActive }" ref="contextMenuRoot"></div>
  </Teleport>

  <Teleport to="#context-menu-root" v-if="currentContextMenu && targetRect">
    <ContextMenuPanel :rect="targetRect" :items="currentContextMenu.items" ref="currentMenuPanel" @on-action="onAction"
      :options="panelOptions" :key="currentContextMenu.id" :min-width="currentContextMenu.options.minWidth"
      :align-x="currentContextMenu.options.alignX" :align-y="currentContextMenu.options.alignY" />
  </Teleport>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import ContextMenuPanel from './ContextMenuPanel.vue'
import { currentContextMenu } from './createContextMenu';
import { useEventListener } from '@vueuse/core';

const AFTER_ACTION_CLOSE_DELAY = 150
const FADE_LEAVE_DURATION = 90
const FADE_LEAVE_DURATION_MS = FADE_LEAVE_DURATION + 'ms'
const SHOULD_CLOSE_BY_POINTER_UP_THRESHOLD = 10 // pixels
const SHOULD_CLOSE_BY_POINTER_UP_TIMEOUT = 400 // milliseconds

type Timeout = ReturnType<typeof setTimeout>

const currentMenuPanel = ref<InstanceType<typeof ContextMenuPanel> | null>(null)

const contextMenuRoot = ref<HTMLElement | null>(null)
const shouldCloseByPointerUp = ref(false)
let canActivateCloseByPointerUp = false
let isPointerDown = false
let pointerDownPosition = { x: 0, y: 0 }
let shouldCloseByPointerUpTimeout: Timeout | null = null

useEventListener(document, 'pointerup', () => isPointerDown = false, { passive: true, capture: true })
useEventListener(document, 'pointerdown', e => {
  isPointerDown = true
  pointerDownPosition = { x: e.clientX, y: e.clientY }
}, { passive: true, capture: true })

watch(currentContextMenu, menu => {
  if (shouldCloseByPointerUpTimeout) {
    clearTimeout(shouldCloseByPointerUpTimeout)
    shouldCloseByPointerUpTimeout = null
  }

  if (menu) {
    if (isPointerDown) {
      canActivateCloseByPointerUp = true
      shouldCloseByPointerUp.value = false
      shouldCloseByPointerUpTimeout = setTimeout(() => {
        shouldCloseByPointerUpTimeout = null
        canActivateCloseByPointerUp = false
        shouldCloseByPointerUp.value = true
      }, SHOULD_CLOSE_BY_POINTER_UP_TIMEOUT)
    } else {
      canActivateCloseByPointerUp = false
      shouldCloseByPointerUp.value = true
    }

  } else {
    canActivateCloseByPointerUp = false
    shouldCloseByPointerUp.value = false
  }
})

useEventListener(document, 'pointermove', e => {
  if (!currentContextMenu.value || !canActivateCloseByPointerUp) return;

  const distance = Math.sqrt(
    Math.pow(e.clientX - pointerDownPosition.x, 2) +
    Math.pow(e.clientY - pointerDownPosition.y, 2)
  );

  if (distance > SHOULD_CLOSE_BY_POINTER_UP_THRESHOLD) {
    shouldCloseByPointerUp.value = true
    canActivateCloseByPointerUp = false
  }
}, { passive: true, capture: true })

function close() {
  if (currentContextMenu.value) {
    currentContextMenu.value = null
  }
}

function closeWithAnim() {
  if (fadeLeaveEndTimeout) clearTimeout(fadeLeaveEndTimeout)

  fadeLeaveActive.value = true
  fadeLeaveEndTimeout = setTimeout(() => {
    fadeLeaveEndTimeout = null
    close()
    fadeLeaveActive.value = false
  }, FADE_LEAVE_DURATION)
}

const fadeLeaveActive = ref(false)
let fadeLeaveEndTimeout: Timeout | null = null
watch(currentContextMenu, menu => {
  if (!menu) return;
  fadeLeaveActive.value = false
  if (fadeLeaveEndTimeout) clearTimeout(fadeLeaveEndTimeout)
})

useEventListener(document, 'pointerdown', (event: PointerEvent) => {
  if (!contextMenuRoot.value?.contains(event.target as Node)) closeWithAnim()
}, { passive: true, capture: true })
useEventListener(document, 'keydown', (e) => {
  if (e.key === 'Escape') {
    closeWithAnim()
    e.stopPropagation()
  }
})

useEventListener(document, 'pointerup', (e) => {
  if (currentContextMenu.value && currentContextMenu.value.options.actionOnPointerUp && shouldCloseByPointerUp.value) {
    closeWithAnim()
    e.stopPropagation()
  }
})

const targetRect = computed(() => {
  if (!currentContextMenu.value) return

  const pos = currentContextMenu.value.options.position;

  if (pos instanceof DOMRect) return pos;

  return new DOMRect(pos.x, pos.y, 0, 0)
})

const panelOptions = computed(() => {
  if (!currentContextMenu.value) return {}

  return {
    actionOnPointerUp: currentContextMenu.value.options.actionOnPointerUp ? shouldCloseByPointerUp.value : false,
    closeOnAction: currentContextMenu.value.options.closeOnAction,
  }
})

function onAction() {
  if (!currentContextMenu.value) return
  if (currentContextMenu.value.options.closeOnAction) setTimeout(() => closeWithAnim(), AFTER_ACTION_CLOSE_DELAY);
}

</script>

<style lang="scss" scoped>
#context-menu-root {
  position: relative;
  z-index: 10000;
}

.fade-leave-active {
  transition: opacity v-bind(FADE_LEAVE_DURATION_MS) ease-in;
  opacity: 0;
  pointer-events: none;
}
</style>