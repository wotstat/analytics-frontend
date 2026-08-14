<template>
  <template v-if="display">
    <div class="popup-container" ref="popupContainer" :style="targetStyle" v-if="teleportTo === null">
      <slot :arrow="arrowProps"></slot>
    </div>

    <Teleport :to="teleportTarget" defer v-else>
      <div class="popup-container" ref="popupContainer" :style="targetStyle">
        <slot :arrow="arrowProps"></slot>
      </div>
    </Teleport>
  </template>

</template>


<script setup lang="ts">
import { computed, onBeforeMount, onUnmounted, ref, shallowRef, triggerRef, watch, useTemplateRef, RendererElement, onMounted } from 'vue'
import { Bbox, calculatePopoverPosition, generateOffset, getArrowPosition, getParams, getViewportRect, isParamsEqual, OffsetValue, Params, PlacementParam, PlacementWithModifiers, PopoverTarget, roundDpr, TargetRect } from './utils'
import { useEventListener } from '@vueuse/core'
import { getPopoverRoot } from './popoverRoot'

const targetParams = shallowRef<Params | null>(null)

const props = withDefaults(defineProps<{
  target: PopoverTarget | null
  snapToPixels?: boolean
  display: boolean
  offset?: OffsetValue
  viewportOffset?: OffsetValue
  placement?: PlacementParam
  preserveLastPlacement?: boolean
  styles?: Record<string, string>
  teleportTo?: string | RendererElement | null
}>(), {
  snapToPixels: true,
})

const emit = defineEmits<{
  (e: 'pointerDownOutside', event: PointerEvent): void,
  (e: 'pointerUpOutside', event: PointerEvent): void,
  (e: 'pointerClickOutside', event: PointerEvent): void,
  (e: 'targetOutsideWindow'): void
  (e: 'popoverOutsideWindow'): void
  (e: 'popoverFullyOutsideWindow'): void
  (e: 'readyToVisible'): void
}>()

const popupContainer = useTemplateRef<HTMLElement>('popupContainer')
const teleportTarget = computed(() => props.teleportTo ?? getPopoverRoot())
let animationHandle: number | null = null
const isTargetOutsideViewport = ref(false)

function isInsideTarget(node: Node) {
  const target = props.target
  return target != null && 'contains' in target && target.contains(node)
}

useEventListener(window, 'pointerdown', (event: PointerEvent) => {
  if (!props.display) return
  if (!popupContainer.value) return
  if (!popupContainer.value.contains(event.target as Node) && !isInsideTarget(event.target as Node)) emit('pointerDownOutside', event)
})

useEventListener(window, 'pointerup', (event: PointerEvent) => {
  if (!props.display) return
  if (!popupContainer.value) return
  if (!popupContainer.value.contains(event.target as Node) && !isInsideTarget(event.target as Node)) emit('pointerUpOutside', event)
})

useEventListener(window, 'click', (event: PointerEvent) => {
  if (!props.display) return
  if (!popupContainer.value) return
  if (!popupContainer.value.contains(event.target as Node) && !isInsideTarget(event.target as Node)) emit('pointerClickOutside', event)
})

// viewportOffset сжимает вьюпорт со всех сторон — так же, как в generateBbox
function isElementOutsideViewport(element: TargetRect, viewport: Bbox) {
  const offset = viewportOffset.value
  return (
    element.x + element.width < viewport.left + offset.left ||
    element.x > viewport.right - offset.right ||
    element.y + element.height < viewport.top + offset.top ||
    element.y > viewport.bottom - offset.bottom
  )
}

const viewport = ref<Bbox>({ left: 0, top: 0, right: 0, bottom: 0 })
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

  const newViewport = getViewportRect()
  if (viewport.value.left !== newViewport.left || viewport.value.top !== newViewport.top ||
    viewport.value.right !== newViewport.right || viewport.value.bottom !== newViewport.bottom) {
    viewport.value = newViewport
    triggerRef(targetParams)
  }

  isTargetOutsideViewport.value = isElementOutsideViewport(targetNewParams.target, newViewport)
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
    fitsWithinBbox: position.fitsWithinBbox,
    arrowX: arrowPosition?.x,
    arrowY: arrowPosition?.y,
    arrowDirection: arrowPosition?.direction
  }
})

const isPopoverOutsideViewport = computed(() => {
  if (!positions.value || !targetParams.value) return false

  const { popup } = targetParams.value
  return isElementOutsideViewport({ x: positions.value.x, y: positions.value.y, width: popup.width, height: popup.height }, viewport.value)
})

watch(() => positions.value?.fitsWithinBbox, fitsWithinBbox => {
  if (fitsWithinBbox === false) emit('popoverOutsideWindow')
}, { immediate: true })

watch(isPopoverOutsideViewport, outside => {
  if (outside) emit('popoverFullyOutsideWindow')
}, { immediate: true })

watch(isTargetOutsideViewport, outside => {
  if (outside) emit('targetOutsideWindow')
}, { immediate: true })

watch(() => positions.value?.arrowDirection, (direction, old) => {
  if (direction && old === undefined) emit('readyToVisible')
}, { immediate: true })

const targetStyle = computed(() => {
  if (!positions.value) return {}

  const transform = props.snapToPixels ?
    `translate3d(${roundDpr(positions.value.x + window.scrollX)}px, ${roundDpr(positions.value.y + window.scrollY)}px, 0px)` :
    `translate3d(${positions.value.x + window.scrollX}px, ${positions.value.y + window.scrollY}px, 0px)`

  return {
    transform,
    ...props.styles
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
  position: absolute;
  z-index: 1000;
  will-change: transform;
  top: 0px;
  left: 0px;
  margin: 0px;
  pointer-events: none;
}
</style>
