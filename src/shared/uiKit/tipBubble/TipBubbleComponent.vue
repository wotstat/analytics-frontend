<template>
  <div v-if="displayed" class="tip-bubble" :style="{
    '--content-width': `${contentWidth}px`,
    '--content-height': `${contentHeight}px`,
    '--max-content-width': `${maxContentWidth}`,
    '--left': left
  }" :class="{
    extended: extended,
    accepted: acceptedInCycle,
    [`align-${targetDirection}`]: true,
    'skip-hover-delay': skipHoverDelay,
  }" ref="root" @click="onClick" @mousedown="onMouseDown">
    <div class="bubble" ref="bubble">
      <LightbulbIcon class="icon lightbulb" />
      <CheckmarkIcon class="icon checkmark" :style="{
        '--spring-05': spring(0.5, 0.5)
      }" />
    </div>
    <div class="content-container" ref="contentContainer" :class="{ 'extending-animation': extendingAnimation }">
      <div class="content" ref="content">
        <slot :direction="targetDirection"></slot>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import LightbulbIcon from './assets/lightbulb.svg'
import CheckmarkIcon from './assets/checkmark.svg'
import { useElementBounding, useElementHover, useResizeObserver, useWindowSize } from '@vueuse/core'
import { animate, spring } from 'motion'

const props = defineProps<{
  direction: 'left' | 'right' | 'auto'
  displayed: boolean
  autoExtend: boolean
  accepted: boolean
  pagePadding?: number | string
  forceExtend?: boolean
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
const { left, right } = useElementBounding(root)
const { width: windowWidth } = useWindowSize({ includeScrollbar: false })
const contentWidth = ref(0)
const contentHeight = ref(0)

const displayed = ref(false)
const isHover = useElementHover(root)
const isHoverExistsInCycle = ref(false)
const isContentClicked = ref(false)
const canBeExtended = ref(false)
const canBeAutoExtended = ref(false)
const acceptedInCycle = ref(false)
const extendingAnimation = ref(false)
const skipHoverDelay = ref(false)

let lastExtendTime = 0
let showAnimationController = new AbortController()
let hideAnimationController = new AbortController()

const targetDirection = computed(() => {
  if (props.direction !== 'auto') return props.direction
  if (window.innerWidth / 2 > left.value) return 'left'
  return 'right'
})

const maxContentWidth = computed(() => {
  if (targetDirection.value === 'left') {
    if (props.pagePadding) {
      if (typeof props.pagePadding === 'string') return `calc(${windowWidth.value - left.value}px - var(${props.pagePadding}))`
      return `${windowWidth.value - left.value - props.pagePadding}px`
    }
    if (left.value < windowWidth.value * 0.1 || left.value < 30) return `${windowWidth.value - left.value * 2}px`
    return `${windowWidth.value - left.value - 10}px`
  }

  else {
    if (props.pagePadding) {
      if (typeof props.pagePadding === 'string') return `calc(${right.value}px - var(${props.pagePadding}))`
      return `${right.value - props.pagePadding}px`
    }
    if (right.value < windowWidth.value * 0.1 || right.value < 30) return `${windowWidth.value - right.value * 2}px`
    return `${right.value - 10}px`
  }
})

useResizeObserver(content, (entries) => {
  const entry = entries[0]
  if (!entry) return
  if (contentWidth.value === entry.contentRect.width && contentHeight.value === entry.contentRect.height) return
  const rect = content.value?.getBoundingClientRect()
  if (!rect) return

  const scale = rect.width / entry.contentRect.width
  if (Math.abs(scale - 1) > 0.001) return

  contentWidth.value = entry.contentRect.width
  contentHeight.value = entry.contentRect.height
})

const extended = computed(() => {
  if (!canBeExtended.value) return false
  if (props.forceExtend) return true
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

let animatedTimeout: ReturnType<typeof setTimeout> | null = null
watch(extended, (value) => {
  extendingAnimation.value = true
  if (animatedTimeout) clearTimeout(animatedTimeout)
  animatedTimeout = setTimeout(() => {
    animatedTimeout = null
    extendingAnimation.value = false
  }, value ? 400 : 300)
})

if (props.displayed) showAnimation()
watch(() => [props.displayed, props.autoExtend], ([displayed, autoExtend], [oldDisplayed, oldAutoExtend]) => {
  if (displayed) showAnimation()
  else {
    const respectCollideDelay = !displayed && !autoExtend && oldDisplayed && oldAutoExtend
    hideAnimation(respectCollideDelay)
  }
})

watch(() => props.accepted, (accepted, old) => {
  if (accepted && !old) {
    const delay = extended.value ? 300 : 0
    canBeExtended.value = false
    animate(root.value, { transform: ['scale(1)', 'scale(0.8)', 'scale(1)'] }, { duration: 0.4, delay: delay / 1000 })
    setTimeout(() => hideAnimation(), 1000 + delay)
    setTimeout(() => acceptedInCycle.value = true, delay)
  }
})

watch(isHover, (hover) => {
  isContentClicked.value = false
  if (!hover && canBeExtended.value) isHoverExistsInCycle.value = true
  if (hover) emits('interact', 'hover')
})

function clickAction() {
  isContentClicked.value = !isContentClicked.value
  skipHoverDelay.value = true
  requestAnimationFrame(() => skipHoverDelay.value = false)
  emits('interact', 'click')
}

function onClick() {
  if (navigator.maxTouchPoints == 0) return // disable click on non-touch devices, since mouseUp used
  clickAction()
}

function onMouseDown(downEvent: MouseEvent) {
  animate(root.value, { transform: 'scale(0.95)' }, { duration: 0.2 })

  document.addEventListener('mouseup', (upEvent: MouseEvent) => {
    animate(root.value, { transform: 'scale(1)' }, { duration: 0.2 })
    const distance = Math.sqrt((downEvent.clientX - upEvent.clientX) ** 2 + (downEvent.clientY - upEvent.clientY) ** 2)
    if (distance < 20) clickAction()
  }, { once: true })
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

async function hideAnimation(respectCollideDelay = false) {
  showAnimationController.abort()
  hideAnimationController.abort()

  const controller = new AbortController()
  hideAnimationController = controller

  const extendedBefore = extendingAnimation.value || extended.value || respectCollideDelay
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

    &.skip-hover-delay {
      div.content-container {
        transition-delay: 0s;

        .content {
          transition-delay: 0s;
        }
      }
    }


    div.content-container {
      $delay: 0.1s;

      width: var(--content-width);
      height: var(--content-height);
      transition-delay: $delay;

      .content {
        opacity: 1;
        filter: blur(0);
        transition-delay: $delay;
        transition-duration: 0.1s;
        will-change: opacity, filter, transform;
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

  &.align-left {
    .content-container {
      left: 0;
    }
  }

  &.align-right {
    .content-container {
      right: 0;

      .content {
        right: 0;
      }
    }
  }

  .content-container {
    top: 0;
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
    transition: background-color 0.3s ease-out;

    &.extending-animation {
      transition: width 0.25s ease-in-out, height 0.25s ease-in-out, background-color 0.3s ease-out;
    }

    .content {
      position: absolute;
      width: max-content;
      z-index: 2;
      max-width: var(--max-content-width);

      opacity: 0;
      filter: blur(2px);
      transition: opacity 0.2s linear, filter 0.2s linear;
      transition-delay: 0.1s;
    }
  }
}
</style>