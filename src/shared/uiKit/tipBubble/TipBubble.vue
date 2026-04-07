<template>
  <div v-if="displayed" class="tip-bubble" :style="{
    '--content-width': `${contentWidth}px`,
    '--content-height': `${contentHeight}px`,
    '--max-content-width': `${maxContentWidth}`
  }" :class="{
    extended: extended,
    accepted: acceptedInCycle,
    [`align-${targetDirection}`]: true
  }" ref="root" @click="onClick" @mousedown="onPointerDown">
    <div class="bubble" ref="bubble">
      <LightbulbIcon class="icon lightbulb" />
      <CheckmarkIcon class="icon checkmark" :style="{
        '--spring-05': spring(0.5, 0.5)
      }" />
    </div>
    <div class="content-container" ref="contentContainer" :class="{ 'extending-animation': extendingAnimation }">
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
import { useElementBounding, useElementHover, useWindowSize } from '@vueuse/core'
import { animate, spring } from 'motion'

const props = defineProps<{
  direction: 'left' | 'right' | 'auto'
  displayed: boolean
  autoExtend: boolean
  accepted: boolean
  pagePadding?: number | string
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
const { width: contentWidth, height: contentHeight } = useElementBounding(content)
const { width: windowWidth } = useWindowSize({ includeScrollbar: false })

const displayed = ref(false)
const isHover = useElementHover(root)
// const isHover = ref(true)
const isHoverExistsInCycle = ref(false)
const isContentClicked = ref(false)
const canBeExtended = ref(false)
const canBeAutoExtended = ref(false)
const acceptedInCycle = ref(false)
const extendingAnimation = ref(false)

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

let animatedTimeout: ReturnType<typeof setTimeout> | null = null
watch(extended, (value) => {
  extendingAnimation.value = true
  if (animatedTimeout) clearTimeout(animatedTimeout)
  animatedTimeout = setTimeout(() => {
    animatedTimeout = null
    extendingAnimation.value = false
  }, 300)
})

if (props.displayed) showAnimation()
watch(() => props.displayed, (displayed) => {
  if (displayed) showAnimation()
  else hideAnimation()
})

watch(() => props.accepted, (accepted, old) => {
  if (accepted && !old) {
    acceptedInCycle.value = true
    animate(root.value, { transform: ['scale(1)', 'scale(0.8)', 'scale(1)'] }, { duration: 0.4 })
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

  &.align-left {
    .content-container {
      left: 0;

      .content {
        .spacer {
          float: left;
        }
      }
    }
  }

  &.align-right {
    .content-container {
      right: 0;

      .content {
        right: 0;

        .spacer {
          float: right;
        }
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
      transition: width 0.25s ease, height 0.25s ease, background-color 0.3s ease-out;
    }

    .content {
      position: absolute;
      color: #fff;
      font-size: 13px;
      line-height: 1.2;
      // padding: 1.2px 8px 1.2px 8px;
      width: max-content;
      z-index: 2;
      max-width: var(--max-content-width);


      opacity: 0;
      filter: blur(5px);
      transition: opacity 0.2s linear, filter 0.2s linear;
      transition-delay: 0.1s;

      .spacer {
        width: 10px;
        height: 10px;
      }

    }
  }
}
</style>