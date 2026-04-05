<template>
  <div class="tip-bubble" :style="{
    '--left': `${left}px`,
    '--content-width': `${contentWidth}px`,
    '--content-height': `${contentHeight}px`
  }" :class="{ extended: extended, accepted: acceptedInCycle }" ref="root" @click="onClick" @mousedown="onPointerDown"
    v-if="displayed">
    <div class="bubble" ref="bubble">
      <LightbulbIcon class="icon lightbulb" />
      <CheckmarkIcon class="icon checkmark" :style="{
        '--spring-05': spring(0.5, 0.5)
      }" />
    </div>
    <div class="content-container" ref="contentContainer">
      <div class="content" ref="content">
        <div class="spacer"></div>
        Используйте стрелочки ← и → для переключения дней
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import LightbulbIcon from './assets/lightbulb.svg'
import CheckmarkIcon from './assets/checkmark.svg'
import { useElementBounding, useElementHover } from '@vueuse/core'
import { animate } from 'motion'
import { spring } from 'motion'

const props = defineProps<{
  direction: 'left' | 'right' | 'auto'
  displayed: boolean
  autoExtend: boolean
  accepted: boolean
}>()

const emits = defineEmits<{
  (e: 'closeAnimationEnd'): void,
  (e: 'showAnimationEnd'): void,
  (e: 'extendChanged', extended: boolean): void,
  (e: 'interact', type: 'hover' | 'click'): void
}>()

const root = ref<HTMLDivElement | null>(null)
const bubble = ref<HTMLDivElement | null>(null)
const content = ref<HTMLDivElement | null>(null)
const contentContainer = ref<HTMLDivElement | null>(null)
const { left } = useElementBounding(bubble)
const { width: contentWidth, height: contentHeight } = useElementBounding(content)

const displayed = ref(false)
const isHover = useElementHover(root)
const isHoverExistsInCycle = ref(false)
const isContentClicked = ref(false)
const canBeExtended = ref(false)
const canBeAutoExtended = ref(false)
const acceptedInCycle = ref(false)

let lastExtendTime = 0
let showAnimationController = new AbortController()
let hideAnimationController = new AbortController()

const extended = computed(() => {
  if (!canBeExtended.value) return false
  if (isContentClicked.value) return false
  if (acceptedInCycle.value) return false
  if (isHover.value) return true
  if (props.autoExtend && canBeAutoExtended.value && !isHoverExistsInCycle.value) return true
  return false
})

watch(extended, (value) => emits('extendChanged', value))
watch(extended, (value) => {
  if (!value) return
  lastExtendTime = Date.now()
})

if (props.displayed) showAnimation()
watch(() => props.displayed, (displayed) => {
  if (displayed) showAnimation()
  else hideAnimation()
})

watch(() => props.accepted, (accepted, old) => {
  if (accepted && !old) {
    acceptedInCycle.value = true
    animate(root.value, { transform: ['scale(1)', 'scale(1.1)', 'scale(1)'] }, { duration: 0.4 })
    setTimeout(() => hideAnimation(), 1000)
  }
})

watch(isHover, (hover) => {
  isContentClicked.value = false
  if (!hover && canBeExtended.value) isHoverExistsInCycle.value = true
  if (hover) emits('interact', 'hover')
})

function onClick() {
  if (Date.now() - lastExtendTime < 500) return
  isContentClicked.value = !isContentClicked.value
  emits('interact', 'click')
}

function onPointerDown() {
  if (Date.now() - lastExtendTime < 500) return
  animate(root.value, { transform: 'scale(0.95)' }, { duration: 0.2 })
  document.addEventListener('mouseup', () => animate(root.value, { transform: 'scale(1)' }, { duration: 0.2 }), { once: true })
}

async function showAnimation() {
  displayed.value = true
  showAnimationController.abort()
  hideAnimationController.abort()

  const controller = new AbortController()
  showAnimationController = controller

  await new Promise((resolve) => nextTick(() => resolve(null)))
  if (controller.signal.aborted) return

  animate(
    bubble.value,
    { transform: 'scale(1)', opacity: 1, filter: 'blur(0px)' },
    {
      type: 'spring', bounce: 0.5, visualDuration: 0.5,
      filter: { type: 'keyframes', duration: 0.15 }
    }
  )

  setTimeout(() => {
    if (controller.signal.aborted) return
    isHoverExistsInCycle.value = false
    isContentClicked.value = false
    canBeExtended.value = true
    if (contentContainer.value) contentContainer.value.style.display = 'block'
  }, 400)

  setTimeout(() => {
    if (controller.signal.aborted) return
    canBeAutoExtended.value = true
  }, 800)
}

async function hideAnimation() {
  showAnimationController.abort()
  hideAnimationController.abort()

  const controller = new AbortController()
  hideAnimationController = controller

  const extendedBefore = extended.value
  canBeExtended.value = false
  canBeAutoExtended.value = false

  if (extendedBefore) {
    await new Promise((resolve) => nextTick(() => resolve(null)))
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  if (controller.signal.aborted) return
  if (contentContainer.value) contentContainer.value.style.display = 'none'

  animate(bubble.value, { transform: 'scale(0.4)', opacity: 0, filter: 'blur(8px)' }, { duration: 0.2, ease: 'easeOut' })
  await new Promise((resolve) => setTimeout(resolve, 200))
  if (controller.signal.aborted) return
  displayed.value = false
  emits('closeAnimationEnd')
}
</script>


<style lang="scss" scoped>
.tip-bubble {
  position: relative;
  z-index: 7;
  width: 18px;
  height: 18px;
  display: flex;
  user-select: none;
  cursor: pointer;
  transform: scale(1);

  .bubble {
    background-color: var(--tip-background-color, var(--dark-blue-color, #4d4d4d));
    border-radius: 10px;
    inset: 0;
    z-index: 2;

    filter: blur(8px);
    transform: scale(0.4);
    opacity: 0;
    width: 18px;
    height: 18px;
    position: relative;
    transition: background-color 0.3s ease-out;

    .icon {
      width: 10px;
      height: 10px;
      margin: 4px;
      display: block;
      z-index: 1;
      position: absolute;

      &.checkmark {
        fill: #9dffa0;
        opacity: 0;
        filter: blur(3px);
        transform: scale(0.4);
        transition: opacity 0.3s ease-out,
          filter 0.2s ease-out,
          transform var(--spring-05);
      }

      &.lightbulb {
        fill: #fff1b1;
        opacity: 1;
        filter: blur(0);
        transform: scale(1);
        transition: opacity 0.3s ease-out,
          filter 0.2s ease-out,
          transform 0.3s ease-out;
      }
    }
  }

  &.extended {

    .content-container {
      width: var(--content-width);
      height: var(--content-height);
      transition-delay: 0.1s;

      .content {
        opacity: 1;
        filter: blur(0);
        transition-delay: 0s;
        transition-duration: 0.2s;
      }
    }
  }

  &.accepted {
    .bubble {
      background-color: #60ff7b;

      .checkmark {
        fill: #265e2f;
        opacity: 1;
        filter: blur(0);
        transform: scale(1);
      }

      .lightbulb {
        opacity: 0;
        filter: blur(3px);
        transform: scale(0.4);
      }
    }

    .content-container {
      background-color: #60ff7b;
    }
  }

  .content-container {
    top: 0;
    left: 0;
    border-radius: 9px;
    position: absolute;
    background-color: #d99750;
    background-color: var(--tip-background-color, var(--dark-blue-color, #4d4d4d));
    overflow: hidden;

    display: none;
    width: 18px;
    height: 18px;

    min-width: 18px;
    min-height: 18px;
    transition: width 0.25s ease, height 0.25s ease, background-color 0.3s ease-out;

    .content {
      position: absolute;
      color: #fff;
      font-size: 13px;
      line-height: 1.2;
      padding: 1.2px 8px 1.2px 8px;
      width: max-content;
      max-width: calc(100vw - var(--left) - 40px);

      opacity: 0;
      filter: blur(5px);
      transition: opacity 0.2s linear, filter 0.2s linear;
      transition-delay: 0.1s;

      .spacer {
        width: 10px;
        height: 10px;
        float: left;
      }

    }
  }
}
</style>