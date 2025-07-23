<template>
  <div class="context-menu-panel" :style="contextMenuStyle" :class="{
    'some-element-has-checkbox': props.items.some(i => i.type == ContextMenuItemVariant.Button && i.checkbox != undefined),
  }" ref="panelElement" @pointerleave="panelLeave" @pointerenter="panelEnter" @pointermove="pointerMove"
    @pointerdown.stop @pointerup.stop>

    <div v-for="item in props.items" ref="itemsElement" @mouseenter="setHover(item)">
      <div class="context-line" :class="{
        'hover': shouldHoverItem(item),
        'is-active': isActive,
      }">
        <ContextMenuLine :item="item" @on-action="onAction" :options="options" />
      </div>
    </div>

    <Teleport to="#context-menu-root">
      <ContextMenuPanel ref="childPanelElement" v-if="currentItems && activeItem" :items="currentItems"
        :rect="activeItem.element.getBoundingClientRect()" :direction="targetDirection" :order="order + 1"
        @on-action="onAction" :options="options" />
    </Teleport>
  </div>
</template>


<script lang="ts" setup>
import { computed, onMounted, ref, shallowRef, watch } from 'vue';
import { ContextMenuItemVariant, type ContextMenuItem, type ContextMenuItemChild } from './createContextMenu';
import { useElementSize, useElementBounding, useTimeout, useTimeoutFn } from '@vueuse/core';
import ContextMenuPanel from './ContextMenuPanel.vue'
import ContextMenuLine from './lines/Index.vue'

type TimeoutHandler = ReturnType<typeof setTimeout> | null;

const PADDING = 10
const SHOW_CHILD_PANEL_DELAY = 150
const HIDE_CHILD_PANEL_DELAY = 500
const ZERO_SPEED_DELAY = 200
const INCREASE_RECT = 10

const panelElement = ref<HTMLElement | null>(null)
const childPanelElement = ref<InstanceType<typeof ContextMenuPanel> | null>(null)
const itemsElement = ref<HTMLElement[] | null>(null)

const activeItem = shallowRef<{ menu: ContextMenuItem, element: HTMLElement } | null>(null)
const hoverItem = shallowRef<ContextMenuItem | null>(null)
const hoverItemActionAnimHide = ref(false)

const containerSize = useElementSize(document.body)
const menuSize = useElementBounding(panelElement)

const isInitTouch = ref(false)
const targetDirection = ref<'left' | 'right'>('right')

const props = withDefaults(defineProps<{
  rect: DOMRect,
  items: ContextMenuItem[],
  options: {
    actionOnPointerUp?: boolean,
    closeOnAction?: boolean,
  }
  minWidth?: number,
  direction?: 'left' | 'right',
  alignX?: 'left' | 'right' | 'center',
  alignY?: 'normal' | 'bottom',
  order?: number,
}>(), {
  direction: 'right',
  order: 0,
})

const emit = defineEmits<{
  (e: 'onAction'): void
}>()

targetDirection.value = props.direction == 'left' ? 'left' : 'right'

defineExpose({
  panelElement,
  isInitTouch,
})

const contextMenuStyle = computed(() => {
  if (!props.rect) return {}

  const pos = {
    x: props.rect.x,
    y: props.rect.y,
  }

  const width = props.rect.width
  const selfWidth = menuSize.width.value
  const isRoot = props.order == 0
  if (selfWidth == 0) return {}

  if (isRoot && props.rect.width != 0) {
    if (props.alignX == 'right') {
      pos.x += width - selfWidth
      pos.x = Math.max(PADDING, pos.x)
    } else if (props.alignX == 'left') {
      pos.x = Math.min(containerSize.width.value - selfWidth - PADDING, pos.x)
    } else if (props.alignX == 'center') {
      pos.x += (width - selfWidth) / 2
      pos.x = Math.min(containerSize.width.value - selfWidth - PADDING, pos.x)
      pos.x = Math.max(PADDING, pos.x)
    }
  } else {
    const rightPos = pos.x + width + (isRoot ? 1 : -5);
    const leftPos = pos.x - selfWidth - (isRoot ? 1 : -5)

    if (props.direction == 'right') {
      if (rightPos + selfWidth + PADDING > containerSize.width.value) targetDirection.value = 'left'
    }
    else if (props.direction == 'left') {
      if (leftPos - selfWidth - PADDING < 0) targetDirection.value = 'right'
    }

    pos.x = targetDirection.value == 'right' ? rightPos : leftPos
  }


  if (props.alignY == 'bottom') {
    pos.y += props.rect.height + 1
  } else {
    pos.y -= 6
  }


  if (menuSize.height.value + pos.y > containerSize.height.value - PADDING) {
    pos.y = containerSize.height.value - menuSize.height.value - PADDING
  } else if (pos.y < PADDING) {
    pos.y = PADDING
  }

  return {
    left: pos.x + 'px',
    top: pos.y + 'px',
    zIndex: props.order,
    minWidth: props.minWidth ? props.minWidth + 'px' : 'unset',
  }
})

const currentItems = computed(() => activeItem.value?.menu.type == ContextMenuItemVariant.Child && activeItem.value?.menu.items?.())
const isActive = computed(() => !(childPanelElement.value != null && childPanelElement.value.isInitTouch))


let lastPosition = { x: 0, y: 0 }
let delta = { x: 0, y: 0 }

let zeroSpeedTimer: TimeoutHandler | null = null

function pointerMove(ev: PointerEvent) {
  delta = {
    x: ev.clientX - lastPosition.x,
    y: ev.clientY - lastPosition.y,
  }

  lastPosition = { x: ev.clientX, y: ev.clientY }

  if (delta.x == 0 && delta.y == 0) {
    if (!(lockTimer && lockChildPanel)) return

    zeroSpeedTimer = setTimeout(() => {
      if (!(lockTimer && lockChildPanel)) return
      lockChildPanel = false
      setActive()
    }, ZERO_SPEED_DELAY)

  } else {
    if (zeroSpeedTimer) clearTimeout(zeroSpeedTimer)
  }
}

function shouldHoverItem(item: ContextMenuItem) {
  if (activeItem.value?.menu == item) return true
  if (hoverItemActionAnimHide.value) return false
  if (hoverItem.value == item && !activeItem.value) return true

  return false
}

function hasChildPanel(menuItem: ContextMenuItem | null): menuItem is ContextMenuItemChild {
  return menuItem?.type == ContextMenuItemVariant.Child && !menuItem.disabled
}

function setActive() {
  if (hasChildPanel(hoverItem.value)) {
    activeItem.value = {
      menu: hoverItem.value,
      element: itemsElement.value![props.items.indexOf(hoverItem.value)]
    }
    return
  }

  activeItem.value = null
}

let changeTimer: TimeoutHandler | null = null
let lockTimer: TimeoutHandler | null = null
let lockChildPanel = false

watch(hoverItem, (item) => {
  if (changeTimer) clearTimeout(changeTimer)

  const showedPanel = !!activeItem.value
  const shouldShowPanel = hasChildPanel(item)
  const isChildPanelInit = !!childPanelElement.value?.isInitTouch


  if (lockChildPanel) return

  if (showedPanel) {
    if (raycast() && !isChildPanelInit) {
      lockChildPanel = true
      lockTimer = setTimeout(() => { lockChildPanel = false; setActive() }, HIDE_CHILD_PANEL_DELAY)
      return
    } else {
      activeItem.value = null
    }
  }

  if (shouldShowPanel) {
    changeTimer = setTimeout(() => {
      if (hoverItem.value !== item) return
      setActive()
    }, SHOW_CHILD_PANEL_DELAY)
  } else {
    setActive()
  }
})

watch(() => childPanelElement.value?.isInitTouch, (value) => {
  if (value && lockTimer) {
    clearTimeout(lockTimer)
    lockChildPanel = false
  }
})

function setHover(item: ContextMenuItem) {
  hoverItem.value = item
}

function panelLeave() {
  hoverItem.value = null
}

function panelEnter() {
  isInitTouch.value = true
}

function raycast() {
  function intersect(segmentStart: { x: number, y: number }, segmentEnd: { x: number, y: number }) {
    // Convert the segment to a vector
    const segmentDir = {
      x: segmentEnd.x - segmentStart.x,
      y: segmentEnd.y - segmentStart.y
    };

    // Calculate denominators
    const denom = rayDirection.x * segmentDir.y - rayDirection.y * segmentDir.x;

    // Parallel lines
    if (Math.abs(denom) < 1e-10) return false;

    const t = ((segmentStart.x - rayOrigin.x) * segmentDir.y - (segmentStart.y - rayOrigin.y) * segmentDir.x) / denom;
    const u = ((segmentStart.x - rayOrigin.x) * rayDirection.y - (segmentStart.y - rayOrigin.y) * rayDirection.x) / denom;

    // If 0 <= u <= 1, the intersection point is on the segment
    // If t >= 0, the intersection is in the ray's direction
    return t >= 0 && u >= 0 && u <= 1;
  }

  const rect = childPanelElement.value?.panelElement?.getBoundingClientRect()
  if (!rect) return

  const rayOrigin = lastPosition
  const rayDirection = delta

  rect.x -= INCREASE_RECT
  rect.y -= INCREASE_RECT
  rect.width += INCREASE_RECT * 2
  rect.height += INCREASE_RECT * 2

  const edges = [
    { start: { x: rect.left, y: rect.top }, end: { x: rect.right, y: rect.top } }, // Top edge
    { start: { x: rect.right, y: rect.top }, end: { x: rect.right, y: rect.bottom } }, // Right edge
    { start: { x: rect.left, y: rect.bottom }, end: { x: rect.right, y: rect.bottom } }, // Bottom edge
    { start: { x: rect.left, y: rect.top }, end: { x: rect.left, y: rect.bottom } } // Left edge
  ];

  for (let edge of edges) {
    if (intersect(edge.start, edge.end)) {
      return true;
    }
  }
  return false;
}

// restore
watch(() => props.items, () => {
  hoverItem.value = null
  activeItem.value = null
  isInitTouch.value = false

  if (changeTimer) clearTimeout(changeTimer)
  if (lockTimer) clearTimeout(lockTimer)
  if (zeroSpeedTimer) clearTimeout(zeroSpeedTimer)

  changeTimer = null
  lockTimer = null
  zeroSpeedTimer = null
  lockChildPanel = false
})

function onAction() {
  emit('onAction')

  if (props.options.closeOnAction) {
    setTimeout(() => hoverItemActionAnimHide.value = true, 0);
    setTimeout(() => hoverItemActionAnimHide.value = false, 90);
  }
}

</script>



<style lang="scss" scoped>
.context-menu-panel {
  position: fixed;

  background-color: rgba(41, 41, 41, 0.92);
  border: 1px solid rgba(102, 102, 102, 0.7);
  box-shadow: 0 0 0px 0.5px rgb(0 0 0), 0 0 14px 1px rgba(0, 0, 0, 0.3);

  border-radius: 6px;
  padding: 5px 0;

  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(40px);

  line-height: normal;

  .context-line {
    font-size: 14px;

    -webkit-user-select: none;
    -ms-user-select: none;
    user-select: none;

    &.hover .hover-highlight {
      background-color: var(--accent-color, #0a6bcc);
    }

    &.hover:not(.is-active) .hover-highlight {
      background-color: var(--color-gray-3, #48484A);
    }
  }

  &.some-element-has-checkbox {
    .context-line {
      .context-menu-child-line {
        padding-left: 1.4em;
      }
    }
  }
}
</style>