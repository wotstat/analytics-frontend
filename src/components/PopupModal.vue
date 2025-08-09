<template>
  <div class="popup-target" ref="targetElement" v-if="slots.default">
    <slot></slot>
  </div>

  <Transition>
    <Teleport to="body" v-if="displayPopup">
      <div class="popup" ref="popup" :class="{
        'without-padding': props.noPadding,
      }" :style="{
        '--left': left + 'px',
        '--top': top + 'px',
      }">
        <slot name="popup"></slot>
      </div>
    </Teleport>
  </Transition>

</template>

<script setup lang="ts">
import { onClickOutside, onKeyDown, useEventListener } from '@vueuse/core'
import { ref, useSlots, watch } from 'vue'

const targetElement = ref<HTMLElement | null>(null)
const popup = ref<HTMLElement | null>(null)

const top = ref(0)
const left = ref(0)

const displayPopup = defineModel<boolean>({ default: false })

const props = defineProps<{
  noPadding?: boolean,
  target?: HTMLElement | null,
}>()

const slots = useSlots()


watch(displayPopup, displayed => {
  if (!displayed) return

  const target = props.target ?? targetElement.value

  const bbox = target?.getBoundingClientRect()
  if (!bbox) return

  top.value = bbox.top + bbox.height + 5 + window.scrollY
  left.value = bbox.left

  popup.value?.focus()
})

onClickOutside(popup, (event) => {
  const target = props.target ?? targetElement.value
  if (target?.contains(event.target as Node)) return
  displayPopup.value = false
})

useEventListener(document, 'scroll', () => displayPopup.value = false)

onKeyDown('Escape', () => displayPopup.value = false)

useEventListener(popup, 'wheel', onWheel, { passive: false })

function onWheel(e: WheelEvent) {

  function isScrollable(element: HTMLElement) {
    const style = window.getComputedStyle(element)
    return ['auto', 'scroll'].includes(style.overflowY)
  }

  function shouldPass(element: HTMLElement) {
    if (!isScrollable(element)) return false
    if (element.scrollHeight <= element.clientHeight) return false

    if (element.scrollTop === 0 && e.deltaY < 0) return false
    if (element.scrollTop === element.scrollHeight - element.clientHeight && e.deltaY > 0) return false

    return true
  }

  let element = e.target as HTMLElement | null
  while (element != null) {
    if (shouldPass(element)) return
    element = element.parentElement
  }

  e.preventDefault()
}

</script>

<style scoped lang="scss">
.popup {
  position: absolute;
  left: var(--left);
  top: var(--top);
  z-index: 1000;

  box-shadow: 0 0 20px #0000004d;
  border: 1px solid #424242;
  background-color: #2a2a2a;
  border-radius: 8px;

  &:not(.without-padding) {
    padding: 8px;
  }
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.1s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>