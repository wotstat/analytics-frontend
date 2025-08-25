<template>
  <Teleport :to="'body'" defer v-if="display">
    <div class="popup-container" ref="popupContainer" :style="targetStyle">
      <slot :arrow="arrowProps"></slot>
    </div>
  </Teleport>
</template>


<script setup lang="ts">
import { computed, onBeforeMount, onUnmounted, ref, shallowRef, triggerRef, watch } from 'vue'
import { calculatePopoverPosition, generateOffset, getArrowPosition, getParams, isParamsEqual, OffsetValue, Params, PlacementParam, PlacementWithModifiers } from './utils'
import { useEventListener } from '@vueuse/core'

const targetParams = shallowRef<Params | null>(null)

const props = defineProps<{
  target: HTMLElement | null
  display: boolean
  offset?: OffsetValue
  viewportOffset?: OffsetValue
  placement?: PlacementParam
  preserveLastPlacement?: boolean
}>()

const emit = defineEmits<{
  (e: 'clickOutside', event: PointerEvent): void,
  (e: 'targetOutsideWindow'): void
  (e: 'readyToVisible'): void
}>()

const popupContainer = ref<HTMLElement | null>(null)
let animationHandle: number | null = null
const isTargetOutsideViewport = ref(false)

useEventListener(window, 'pointerdown', (event: PointerEvent) => {
  if (!props.display) return

  if (!popupContainer.value) return

  if (!popupContainer.value.contains(event.target as Node) && !props.target?.contains(event.target as Node)) emit('clickOutside', event)
})

function isElementOutsideViewport(element: { x: number; y: number; width: number; height: number }, viewPort: { width: number; height: number }) {
  const offset = viewportOffset.value
  return (
    element.x + element.width < 0 + offset.left ||
    element.x > viewPort.width + offset.right ||
    element.y + element.height < 0 + offset.top ||
    element.y > viewPort.height + offset.bottom
  )
}

let lastHtmlSize = { width: 0, height: 0 }
function onAnimationFrame() {
  animationHandle = null

  if (!props.display) return

  animationHandle = requestAnimationFrame(onAnimationFrame)

  if (!props.target) return
  const targetNewParams = getParams(props.target, popupContainer.value)
  if (!targetNewParams) return

  if (!targetParams.value || !isParamsEqual(targetParams.value, targetNewParams)) {
    targetParams.value = targetNewParams
  }

  const htmlSize = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight }
  if (lastHtmlSize.width !== htmlSize.width || lastHtmlSize.height !== htmlSize.height) {
    lastHtmlSize = htmlSize
    triggerRef(targetParams)
  }

  isTargetOutsideViewport.value = isElementOutsideViewport(targetNewParams.target, htmlSize)
}

let lastPlacement: PlacementWithModifiers | undefined = undefined
watch(() => props.display, display => {
  if (display && animationHandle === null) {
    lastPlacement = undefined
    targetParams.value = null
    onAnimationFrame()
  } else if (!display && animationHandle !== null) {
    cancelAnimationFrame(animationHandle)
    animationHandle = null
  }
}, { immediate: true })

onBeforeMount(() => {
  if (props.display && animationHandle === null) onAnimationFrame()
})

onUnmounted(() => {
  if (animationHandle != null) cancelAnimationFrame(animationHandle)
})

const offset = computed(() => generateOffset(props.offset ?? 0))
const viewportOffset = computed(() => generateOffset(props.viewportOffset ?? props.offset ?? 0))
const placementParam = computed<PlacementWithModifiers[]>(() => {
  if (Array.isArray(props.placement)) return props.placement.length == 0 ? ['top-float'] : props.placement
  return [props.placement ?? 'top-float']
})

const positions = computed(() => {
  if (!targetParams.value) return null

  const params = targetParams.value

  const position = calculatePopoverPosition(params, placementParam.value, {
    offset: offset.value,
    viewportOffset: viewportOffset.value,
    bbox: 'window',
    lastPlacement,
    preserveLastPlacement: props.preserveLastPlacement ?? true
  })

  lastPlacement = position.placement

  const arrowPosition = getArrowPosition(position, params)

  return {
    x: position.x,
    y: position.y,
    placement: position.placement,
    arrowX: arrowPosition?.x,
    arrowY: arrowPosition?.y,
    arrowDirection: arrowPosition?.direction
  }
})

watch(() => isTargetOutsideViewport.value, (outside, old) => {
  if (outside == old) return
  if (outside) emit('targetOutsideWindow')
}, { immediate: true })

watch(() => positions.value?.arrowDirection, (direction, old) => {
  if (direction && old === undefined) emit('readyToVisible')
}, { immediate: true })

const targetStyle = computed(() => {
  if (!positions.value) return {}

  return {
    transform: `translate3d(${positions.value.x}px, ${positions.value.y}px, 0px)`
  }
})

const arrowProps = computed(() => {
  if (!positions.value || !positions.value.placement) return { x: 0, y: 0 }

  return {
    x: positions.value.arrowX,
    y: positions.value.arrowY,
    direction: positions.value.arrowDirection
  }
})

</script>


<style lang="scss" scoped>
.popup-container {
  position: fixed;
  z-index: 1000;
  will-change: transform;
  top: 0px;
  left: 0px;
  margin: 0px;
}
</style>